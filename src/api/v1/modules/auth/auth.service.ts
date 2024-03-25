import argon2 from 'argon2'
import isEmpty from 'is-empty'
import jwt, { JsonWebTokenError, JwtPayload, TokenExpiredError } from 'jsonwebtoken'
import {
    BadRequestException,
    ForbiddenException,
    InternalServerException,
    NotFoundException,
} from 'node-http-exceptions'

import { appDataSource } from '@config/datasource.config'
import User from '@entities/User'
import { CreateUserDTO, LoginUserDTO, ResetPasswordDTO } from '@modules/auth/auth.dto'
import UserService from '@modules/users/user.service'
import { EmailService } from '@services/email.service'
import { EMAIL_SECRET_KEY } from '@utils/constants'
import { selectAllColumns } from '@utils/selectAllColumns'
import { AuthToken } from '@utils/types'
import verifyGoogleOAuthToken from '@utils/verifyGoogleOAuthToken'
import { inject, injectable } from 'inversify'

/**
 * @class AuthService
 * @desc Service for handling user authentication related operations.
 * */
@injectable()
export default class AuthService {
    private readonly userRepository = appDataSource.getRepository(User)

    constructor(
        @inject(UserService)
        private readonly userService: UserService
    ) {}

    public async signup(userData: CreateUserDTO) {
        if (isEmpty(userData)) throw new BadRequestException('Signup user data is empty')

        const user = await this.userService.create(userData)
        await EmailService.sendEmailVerificationLink({ email: userData.email, username: user.username })
        return user
    }

    public async login(userData: LoginUserDTO) {
        if (isEmpty(userData)) throw new BadRequestException('Login user data is empty')

        const { username, password } = userData

        const user = await this.userRepository.findOne({
            where: [{ email: username }, { username }],
            select: selectAllColumns(this.userRepository),
        })

        if (!user) throw new BadRequestException('User not found with the email or username')

        const isPasswordMatched = await argon2.verify(user.password, password)

        if (!isPasswordMatched) throw new BadRequestException('Invalid password')

        delete user.password

        if (!user.hasEmailVerified) {
            throw new ForbiddenException(
                'Your email has not been verified yet. Please check your mailbox.',
                { user }
            )
        }

        const accessTokenData = AuthService.createAccessToken(user)
        const refreshToken = AuthService.createRefreshToken(user)

        return { user, ...accessTokenData, refreshToken }
    }

    public async loginWithGoogle(token: string) {
        const tokenPayload = await verifyGoogleOAuthToken(token)

        let user = await this.userRepository.findOneBy({ email: tokenPayload.email })

        //make user email verified if not verified
        if (user && !user.hasEmailVerified) {
            user.emailVerifiedAt = new Date(Date.now())
            await this.userRepository.save(user)
        }

        if (!user) {
            //create new user
            user = await this.userService.createWithGoogleOAuthTokenPayload(tokenPayload)
        }

        const accessTokenData = AuthService.createAccessToken(user)
        const refreshToken = AuthService.createRefreshToken(user)

        return { user, ...accessTokenData, refreshToken }
    }

    public async refreshToken(refreshToken: string) {
        if (!refreshToken) throw new ForbiddenException('Refresh token is empty')

        try {
            const tokenPayload = jwt.verify(
                refreshToken,
                process.env['REFRESH_TOKEN_SECRET']
            ) as JwtPayload

            if (tokenPayload.type !== 'refresh') {
                throw new BadRequestException('Invalid refreshToken')
            }

            try {
                const user = await this.userRepository.findOneByOrFail({ id: tokenPayload.id })
                return AuthService.createAccessToken(user)
            } catch {
                throw new NotFoundException('User not found with the token payload')
            }
        } catch (err) {
            if (err instanceof TokenExpiredError) {
                throw new ForbiddenException('Token has been expired')
            } else if (err instanceof JsonWebTokenError) {
                throw new ForbiddenException('Invalid token')
            }
            throw err
        }
    }

    public async forgotPassword(email: string) {
        const user = await this.userRepository.findOneBy({ email })

        if (!user) throw new BadRequestException('User not found with the email')

        try {
            await EmailService.sendResetPasswordLink(email)

            return user
        } catch {
            throw new InternalServerException('Failed to send password reset email')
        }
    }

    public async resetPassword({ password, token }: ResetPasswordDTO) {
        if (!password || !token) throw new BadRequestException('Password or token is empty')
        let email = null

        try {
            const decoded = jwt.verify(token, EMAIL_SECRET_KEY) as JwtPayload
            email = decoded.email
        } catch (e) {
            throw new BadRequestException('Token is invalid')
        }

        let user = await this.userRepository.findOneBy({ email: email })

        if (!user) throw new BadRequestException('User does not exists')

        user.password = await argon2.hash(password)
        user = await this.userRepository.save(user)
        delete user.password

        return user
    }

    public async verifyEmail(token: string) {
        let email = null

        try {
            const payload = jwt.verify(token, EMAIL_SECRET_KEY) as JwtPayload
            email = payload.email
        } catch {
            throw new BadRequestException('Invalid token')
        }

        let user = await this.userRepository.findOneBy({ email })

        if (!user) throw new BadRequestException('User does not exists')

        if (user.hasEmailVerified) {
            throw new BadRequestException('Your email address already verified')
        }

        user.emailVerifiedAt = new Date(Date.now())
        user = await this.userRepository.save(user)
        delete user.password

        return user
    }

    public async resendEmailVerificationLink(email: string) {
        const user = await this.userRepository.findOneBy({ email })

        if (!user) throw new BadRequestException('User does not exists')

        if (user.hasEmailVerified) throw new BadRequestException('Your email address already verified')

        try {
            await EmailService.sendEmailVerificationLink({ email: user.email, username: user.username })
        } catch {
            throw new InternalServerException('Failed to resend email verification link')
        }
    }

    private static createAccessToken(user: User): AuthToken {
        const tokenPayload = {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: { url: user.avatar.url },
            type: 'access',
        }
        const accessTokenSecret = process.env['ACCESS_TOKEN_SECRET']
        const expiresIn = process.env['ACCESS_TOKEN_EXPIRES_IN'] || '30m'
        const tokenType = 'Bearer'

        const accessToken = jwt.sign(tokenPayload, accessTokenSecret, {
            expiresIn,
        })

        return {
            accessToken,
            tokenType,
            expiresIn,
        }
    }

    private static createRefreshToken(user: User) {
        const tokenPayload = {
            id: user.id,
            username: user.username,
            email: user.email,
            type: 'refresh',
        }
        const refreshTokenSecret = process.env['REFRESH_TOKEN_SECRET']
        const expiresIn = process.env['REFRESH_TOKEN_EXPIRES_IN'] || '7d'

        const refreshToken = jwt.sign(tokenPayload, refreshTokenSecret, {
            expiresIn,
        })

        return refreshToken
    }
}
