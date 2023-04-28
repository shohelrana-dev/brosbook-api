import argon2 from "argon2"
import jwt from "jsonwebtoken"
import isEmpty from "is-empty"

import User from "@entities/User"
import { LoginTokenPayload } from "@interfaces/index.interfaces"
import { LoginUserDTO, ResetPasswordDTO } from "@modules/auth/auth.dto"
import BadRequestException from "@exceptions/BadRequestException"
import { CreateUserDTO } from "@modules/auth/auth.dto"
import { EmailService } from "@services/email.service"
import UserService from "@modules/users/user.service"
import { selectAllColumns } from "@utils/selectAllColumns"
import { inject, injectable } from "inversify"
import { appDataSource } from "@config/datasource.config"

@injectable()
class AuthService {
    private readonly userRepository = appDataSource.getRepository( User )

    constructor(
        @inject( UserService )
        private readonly userService: UserService
    ){}

    public async signup( userData: CreateUserDTO ): Promise<User>{
        if( isEmpty( userData ) ) throw new BadRequestException( 'Signup user data is empty.' )

        const user = await this.userService.create( userData )

        await EmailService.sendEmailVerificationLink( userData.email, user.username )

        return user
    }

    public async login( userData: LoginUserDTO ): Promise<LoginTokenPayload>{
        if( isEmpty( userData ) ) throw new BadRequestException( 'Login user data is empty.' )

        const { username, password } = userData

        const user = await this.userRepository.findOne( {
            where: [
                { email: username },
                { username }
            ],
            select: selectAllColumns( this.userRepository )
        } )

        if( ! user ) throw new BadRequestException( 'User not found with the email or username.' )

        const isPasswordMatched = await argon2.verify( user.password, password )

        if( ! isPasswordMatched ) throw new BadRequestException( 'Invalid password.' )

        delete user.password

        if( ! user.hasEmailVerified ){
            return { access_token: null, expires_in: null, user, message: 'Email was not verified. ' }
        }

        return AuthService.createJwtLoginToken( user )
    }

    public async loginWithGoogle( token: string ): Promise<LoginTokenPayload>{
        const user = await this.userService.createWithGoogle( token )

        return AuthService.createJwtLoginToken( user )
    }

    public async forgotPassword( email: string ): Promise<void>{
        const user = await User.findOneBy( { email } )

        if( ! user ) throw new BadRequestException( 'User not found with the email.' )

        await EmailService.sendResetPasswordLink( email )
    }

    public async resetPassword( payload: ResetPasswordDTO ): Promise<User>{
        const { password, token } = payload
        let email                 = null

        try {
            const decoded = jwt.verify( token, process.env.JWT_SECRET ) as any
            email         = decoded.email
        } catch ( e ) {
            throw new BadRequestException( 'Invalid token.' )
        }

        let user = await this.userRepository.findOneBy( { email: email } )

        if( ! user ) throw new BadRequestException( 'User does not exists.' )

        user.password = await argon2.hash( password )
        user          = await this.userRepository.save( user )
        delete user.password

        return user
    }

    public async verifyEmail( token: string ): Promise<User>{
        let email = null

        try {
            const payload = jwt.verify( token, process.env.JWT_SECRET ) as any
            email         = payload.email
        } catch ( e ) {
            throw new BadRequestException( 'Invalid token.' )
        }

        let user = await this.userRepository.findOneBy( { email } )

        if( ! user ) throw new BadRequestException( 'User does not exists.' )

        if( user.hasEmailVerified ){
            throw new BadRequestException( 'The email address already verified' )
        }

        user.emailVerifiedAt = new Date( Date.now() ).toISOString()
        user                 = await this.userRepository.save( user )
        delete user.password

        return user
    }

    public async resendEmailVerificationLink( email: string ){
        const user = await this.userRepository.findOneBy( { email } )

        if( ! user ) throw new BadRequestException( 'User does not exists.' )

        await EmailService.sendEmailVerificationLink( user.email, user.username )
    }

    private static createJwtLoginToken( user: User ): LoginTokenPayload{
        const dataStoredInToken = {
            id: user.id,
            username: user.username,
            email: user.email
        }
        const secretKey         = process.env.JWT_SECRET!
        const expires_in        = process.env.JWT_EXPIRY || '1d'

        let access_token = jwt.sign( dataStoredInToken, secretKey, { expiresIn: expires_in } )
        return { access_token, expires_in, token_type: 'Bearer', user }
    }
}

export default AuthService