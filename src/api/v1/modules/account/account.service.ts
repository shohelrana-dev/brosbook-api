import { appDataSource } from '@config/datasource.config'
import Profile from '@entities/Profile'
import User from '@entities/User'
import { ChangePasswordDTO, ChangeUsernameDTO, UpdateProfileDTO } from '@modules/account/account.dto'
import { selectAllColumns } from '@utils/selectAllColumns'
import { Auth } from '@utils/types'
import argon2 from 'argon2'
import { injectable } from 'inversify'
import isEmpty from 'is-empty'
import { BadRequestException, UnprocessableEntityException } from 'node-http-exceptions'

/**
 * @class AccountService
 * @desc Service for handling user account related operations.
 **/
@injectable()
export default class AccountService {
    private readonly userRepository = appDataSource.getRepository(User)
    private readonly profileRepository = appDataSource.getRepository(Profile)

    public async updateProfile(userData: UpdateProfileDTO, auth: Auth) {
        if (isEmpty(userData)) throw new BadRequestException('User data is empty')

        const { firstName, lastName, bio, phone, location, birthdate, gender } = userData

        const user = await this.userRepository.findOneBy({ id: auth.user.id })

        if (!user) throw new BadRequestException('User does not exists.')

        let profile = await this.profileRepository.findOneBy({ user: { id: user.id } })

        if (!profile) {
            profile = new Profile()
        }

        profile.bio = bio
        profile.phone = phone
        profile.location = location
        profile.birthdate = birthdate
        profile.gender = gender
        await this.profileRepository.save(profile)

        user.firstName = firstName
        user.lastName = lastName
        user.profile = profile
        await this.userRepository.save(user)

        return user
    }

    public async changeUsername(changeUsernameData: ChangeUsernameDTO, auth: Auth) {
        if (isEmpty(changeUsernameData)) throw new BadRequestException('Change username data is empty')

        const { username, password } = changeUsernameData

        const user = await this.userRepository.findOne({
            where: { id: auth.user.id },
            select: selectAllColumns(this.userRepository),
        })

        if (!user) throw new BadRequestException("User doesn't exists.")

        const isPasswordMatching = await argon2.verify(user.password, password)

        if (!isPasswordMatching) throw new UnprocessableEntityException('Invalid Password.')

        user.username = username

        await this.userRepository.save(user)
        delete user.password
        return user
    }

    public async changePassword(changePasswordData: ChangePasswordDTO, auth: Auth) {
        if (isEmpty(changePasswordData)) throw new BadRequestException('Change password data is empty')

        const { currentPassword, newPassword } = changePasswordData

        const user = await this.userRepository.findOne({
            where: { id: auth.user.id },
            select: selectAllColumns(this.userRepository),
        })

        if (!user) throw new BadRequestException("User doesn't exists.")

        const isPasswordMatching = await argon2.verify(user.password, currentPassword)

        if (!isPasswordMatching) throw new UnprocessableEntityException('Current password invalid.')

        user.password = await argon2.hash(newPassword)
        await this.userRepository.save(user)

        return user
    }
}
