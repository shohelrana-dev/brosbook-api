import argon2 from "argon2"
import Profile from "@entities/Profile"
import User from "@entities/User"
import BadRequestException from "@exceptions/BadRequestException"
import UnprocessableEntityException from "@exceptions/UnprocessableEntityException"
import { ChangePasswordDTO, ChangeUsernameDTO, UpdateProfileDTO } from "@modules/account/account.dto"
import isEmpty from "is-empty"
import UserService from "@modules/users/user.service"
import { Auth } from "@interfaces/index.interfaces"
import { selectAllColumns } from "@utils/selectAllColumns"
import { inject, injectable } from "inversify"
import { appDataSource } from "@config/datasource.config"

@injectable()
export default class AccountService {
    private readonly userRepository    = appDataSource.getRepository( User )
    private readonly profileRepository = appDataSource.getRepository( Profile )

    constructor(
        @inject( UserService )
        private readonly userService: UserService
    ){}

    public async updateProfile( userData: UpdateProfileDTO, auth: Auth ): Promise<User>{
        if( isEmpty( userData ) ) throw new BadRequestException( 'User data is empty' )

        const { firstName, lastName, bio, phone, location, birthdate, gender } = userData

        const user = await this.userRepository.findOneBy( { id: auth.user.id } )

        if( ! user ) throw new BadRequestException( 'User does not exists.' )

        const profile = await this.profileRepository.findOneBy( { user: { id: user.id } } )

        profile.bio       = bio
        profile.phone     = phone
        profile.location  = location
        profile.birthdate = birthdate
        profile.gender    = gender
        await this.profileRepository.save( profile )

        user.firstName = firstName
        user.lastName  = lastName
        user.profile   = profile
        await this.userRepository.save( user )

        return user
    }

    public async changeUsername( changeUsernameData: ChangeUsernameDTO, auth: Auth ){
        if( isEmpty( changeUsernameData ) ) throw new BadRequestException( 'Change username data is empty' )

        const { username, password } = changeUsernameData

        const user = await this.userRepository.findOne( {
            where: { id: auth.user.id },
            select: selectAllColumns( this.userRepository )
        } )

        if( ! user ) throw new BadRequestException( "User doesn't exists." )

        const isPasswordMatching = await argon2.verify( user.password, password )

        if( ! isPasswordMatching ) throw new UnprocessableEntityException( "Invalid Password." )

        user.username = username
        await this.userRepository.save( user )

        delete user.password

        return user
    }

    public async changePassword( changePasswordData: ChangePasswordDTO, auth: Auth ){
        if( isEmpty( changePasswordData ) ) throw new BadRequestException( 'Change password data is empty' )

        const { currentPassword, newPassword } = changePasswordData

        const user = await this.userRepository.findOne( {
            where: { id: auth.user.id },
            select: selectAllColumns( this.userRepository )
        } )

        if( ! user ) throw new BadRequestException( "User doesn't exists." )

        const isPasswordMatching = await argon2.verify( user.password, currentPassword )

        if( ! isPasswordMatching ) throw new UnprocessableEntityException( "Current password invalid." )

        user.password = await argon2.hash( newPassword )
        await this.userRepository.save( user )
    }
}