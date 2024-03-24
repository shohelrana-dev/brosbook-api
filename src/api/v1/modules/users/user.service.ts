import { appDataSource } from '@config/datasource.config'
import Media, { MediaSource } from '@entities/Media'
import { NotificationTypes } from '@entities/Notification'
import Profile from '@entities/Profile'
import User from '@entities/User'
import { CreateUserDTO } from '@modules/auth/auth.dto'
import NotificationService from '@modules/notifications/notification.service'
import MediaService from '@services/media.service'
import { paginateMeta } from '@utils/paginateMeta'
import { Auth, ListQueryParams, SearchQueryParams } from '@utils/types'
import fetch from 'cross-fetch'
import { UploadedFile } from 'express-fileupload'
import { TokenPayload } from 'google-auth-library'
import { inject, injectable } from 'inversify'
import isEmpty from 'is-empty'
import { BadRequestException, NotFoundException } from 'node-http-exceptions'
import { Brackets, In } from 'typeorm'
import { v4 as uuid } from 'uuid'

/**
 * @class UserService
 * @desc Service responsible for handling user operations such as creation, retrieval, and management.
 */
@injectable()
export default class UserService {
    private readonly userRepository = appDataSource.getRepository(User)
    private readonly profileRepository = appDataSource.getRepository(Profile)
    private readonly mediaRepository = appDataSource.getRepository(Media)

    constructor(
        @inject(NotificationService)
        private readonly notificationService: NotificationService,
        @inject(MediaService)
        private readonly mediaService: MediaService
    ) {}

    public async create(userData: CreateUserDTO) {
        if (isEmpty(userData)) throw new BadRequestException('User data is empty')

        let user = new User()
        user.firstName = userData.firstName
        user.lastName = userData.lastName
        user.email = userData.email
        user.username = userData.username
        user.password = userData.password

        await this.userRepository.save(user)
        await this.profileRepository.create({ user }).save()
        return user
    }

    public async createWithGoogleOAuthTokenPayload(tokenPayload: TokenPayload) {
        //create user
        const user = new User()
        user.firstName = tokenPayload.given_name
        user.lastName = tokenPayload.family_name || tokenPayload.given_name
        user.fullName = `${user.firstName} ${user.lastName}`
        user.email = tokenPayload.email
        user.emailVerifiedAt = new Date(Date.now())
        user.password = uuid()
        await this.userRepository.save(user)

        await this.profileRepository.create({ user }).save()

        //save photo
        user.avatar = await this.mediaService.save({
            file: Buffer.from(await (await fetch(tokenPayload.picture)).arrayBuffer()),
            source: MediaSource.AVATAR,
            creator: { id: user.id } as User,
        })

        await this.userRepository.save(user)

        return user
    }

    public async getCurrentUser(auth: Auth) {
        try {
            return await this.userRepository.findOneOrFail({
                where: { id: auth.user.id },
                relations: ['profile'],
            })
        } catch {
            throw new NotFoundException('User does not exists')
        }
    }

    public async getById(userId: string, auth: Auth) {
        if (!userId) throw new BadRequestException('User id is empty')

        try {
            const user = await this.userRepository.findOneOrFail({
                where: { id: userId },
                relations: ['profile'],
            })
            return await this.formatUser(user, auth)
        } catch {
            throw new NotFoundException('User does not exists')
        }
    }

    public async getByUsername(username: string, auth: Auth) {
        if (!username) throw new BadRequestException('Username is empty')

        try {
            const user = await this.userRepository.findOneOrFail({
                where: { username },
                relations: { profile: true },
            })

            return await this.formatUser(user, auth)
        } catch {
            throw new NotFoundException('User does not exists')
        }
    }

    public async getFollowersCount(userId: string) {
        if (!userId) throw new BadRequestException('User id is empty')

        //followers count
        return await this.userRepository
            .createQueryBuilder('user')
            .leftJoin('user.followings', 'following')
            .where('following.id = :followingId', { followingId: userId })
            .getCount()
    }

    public async getFollowingsCount(userId: string) {
        if (!userId) throw new BadRequestException('User id is empty')

        //followings count
        return await this.userRepository
            .createQueryBuilder('user')
            .leftJoin('user.followers', 'follower')
            .where('follower.id = :followerId', { followerId: userId })
            .getCount()
    }

    public async getUserMediaList(userId: string, params: ListQueryParams) {
        const { page, limit } = params
        const skip = limit * (page - 1)

        if (!userId) throw new BadRequestException('User id is empty')

        const user = await this.userRepository.findOneBy({ id: userId })

        if (!user) throw new NotFoundException('User does not exists')

        const [media, count] = await this.mediaRepository.findAndCount({
            where: {
                creator: { id: user.id },
                source: In([MediaSource.AVATAR, MediaSource.COVER_PHOTO, MediaSource.POST]),
            },
            order: { createdAt: 'DESC' },
            skip: skip,
            take: limit,
        })

        return { items: media, ...paginateMeta(count, page, limit) }
    }

    public async search(params: SearchQueryParams, auth: Auth) {
        const { q, page, limit } = params
        const skip = limit * (page - 1)

        const [users, count] = await this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.avatar', 'avatar')
            .where('user.id != :userId', { userId: String(auth.user?.id) })
            .andWhere(
                new Brackets((qb) => {
                    qb.where('user.firstName iLIKE :q', { q: `%${q}%` })
                    qb.orWhere('user.lastName iLIKE :q', { q: `%${q}%` })
                    qb.orWhere('user.username iLIKE :q', { q: `%${q}%` })
                })
            )
            .orderBy('user.createdAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount()

        await this.formatUsers(users, auth)

        return { items: users, ...paginateMeta(count, page, limit) }
    }

    public async getSuggestions(params: ListQueryParams, auth: Auth) {
        const { page, limit } = params
        const skip = limit * (page - 1)

        const user = await this.userRepository.findOne({
            where: { id: auth.user.id },
            relations: ['followings'],
        })

        const followingIds = !isEmpty(user.followings) ? user.followings.map((user) => user.id) : ['']

        // Retrieve users not followed by the current user
        const [users, count] = await this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.avatar', 'avatar')
            .leftJoinAndSelect('user.profile', 'profile')
            .where('user.id != :userId', { userId: auth.user.id })
            .andWhere('user.id NOT IN (:...followingIds)', { followingIds })
            .orderBy('user.createdAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount()

        await this.formatUsers(users, auth)

        return { items: users, ...paginateMeta(count, page, limit) }
    }

    public async getFollowers(userId: string, params: ListQueryParams, auth: Auth) {
        if (!userId) throw new BadRequestException('User id is empty')

        const { page, limit } = params
        const skip = limit * (page - 1)

        const [followers, count] = await this.userRepository
            .createQueryBuilder('user')
            .leftJoin('user.followings', 'following')
            .leftJoinAndSelect('user.avatar', 'avatar')
            .leftJoinAndSelect('user.profile', 'profile')
            .where('following.id = :userId', { userId })
            .skip(skip)
            .take(limit)
            .getManyAndCount()

        await this.formatUsers(followers, auth)

        return { items: followers, ...paginateMeta(count, page, limit) }
    }

    public async getFollowings(userId: string, params: ListQueryParams, auth: Auth) {
        if (!userId) throw new BadRequestException('User id is empty')

        const { page, limit } = params
        const skip = limit * (page - 1)

        const [followings, count] = await this.userRepository
            .createQueryBuilder('user')
            .leftJoin('user.followers', 'follower')
            .leftJoinAndSelect('user.avatar', 'avatar')
            .leftJoinAndSelect('user.profile', 'profile')
            .where('follower.id = :userId', { userId })
            .skip(skip)
            .take(limit)
            .getManyAndCount()

        await this.formatUsers(followings, auth)

        return { items: followings, ...paginateMeta(count, page, limit) }
    }

    public async changeAvatar(avatar: UploadedFile, auth: Auth) {
        if (!avatar) throw new BadRequestException('Avatar is empty')

        const user = await this.userRepository.findOneBy({ id: auth.user.id })

        if (!user) throw new BadRequestException('User does not exists')

        user.avatar = await this.mediaService.save({
            file: avatar.data,
            creator: auth.user,
            source: MediaSource.AVATAR,
        })

        return await this.userRepository.save(user)
    }

    public async changeCoverPhoto(coverPhoto: UploadedFile, auth: Auth) {
        if (!coverPhoto) throw new BadRequestException('Cover photo is empty')

        const user = await this.userRepository.findOneBy({ id: auth.user.id })
        const profile = await this.profileRepository.findOneBy({ user: { id: auth.user.id } })

        if (!user || !profile) throw new BadRequestException('User does not exists')

        profile.coverPhoto = await this.mediaService.save({
            file: coverPhoto.data,
            creator: auth.user,
            source: MediaSource.COVER_PHOTO,
        })
        await this.profileRepository.save(profile)
        user.profile = profile

        return user
    }

    public async follow(targetUserId: string, auth: Auth) {
        if (!targetUserId) throw new BadRequestException('Target user id is empty')

        const targetUser = await this.userRepository.findOneBy({ id: targetUserId })

        if (!targetUser) throw new BadRequestException('Target user does not exists')

        //check already following
        const findTheUserFromFollowing = await this.userRepository
            .createQueryBuilder('user')
            .innerJoin('user.followings', 'following')
            .where('user.id = :userId', { userId: auth.user.id })
            .andWhere('following.id = :followingId', { followingId: targetUser.id })
            .getOne()

        if (findTheUserFromFollowing) throw new BadRequestException('You already followed the user')

        targetUser.followers = [auth.user as User]
        await this.userRepository.save(targetUser)

        targetUser.isViewerFollow = true

        this.notificationService.create(
            {
                recipient: targetUser,
                type: NotificationTypes.FOLLOWED,
            },
            auth
        )

        return targetUser
    }

    public async unfollow(targetUserId: string, auth: Auth) {
        if (!targetUserId) throw new BadRequestException('Target user id is empty')

        const targetUser = await this.userRepository.findOneBy({ id: targetUserId })

        if (!targetUser) throw new BadRequestException('Target user does not exists')

        await this.userRepository
            .createQueryBuilder()
            .relation(User, 'followings')
            .of(auth.user.id)
            .remove(targetUserId)

        targetUser.isViewerFollow = false

        this.notificationService.delete(
            { recipient: targetUser, type: NotificationTypes.FOLLOWED },
            auth
        )

        return targetUser
    }

    public async makeUserActive(userId: string) {
        if (!userId) throw new BadRequestException('User id is empty')

        const user = await this.userRepository.findOneBy({ id: userId })

        if (!user) throw new BadRequestException('User does not exists')

        user.active = true

        return await this.userRepository.save(user)
    }

    public async makeUserInactive(userId: string) {
        if (!userId) throw new BadRequestException('User id is empty')

        const user = await this.userRepository.findOneBy({ id: userId })

        if (!user) throw new BadRequestException('User does not exists')

        user.active = false

        return await this.userRepository.save(user)
    }

    public async formatUser(user: User, auth: Auth) {
        user.isViewerFollow = await this.isCurrentUserFollow(user, auth)

        return user
    }

    public async formatUsers(users: User[], auth: Auth) {
        for (const user of users) {
            await this.formatUser(user, auth)
        }

        return users
    }

    public async isCurrentUserFollow(followUser: User, auth: Auth) {
        if (!auth.isAuthenticated) return false

        // Count the number of followings records that match the current user ID and follow user ID
        const count = await this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.followings', 'following')
            .where('user.id = :currentUserId', { currentUserId: auth.user.id })
            .andWhere('following.id = :followUserId', { followUserId: followUser.id })
            .getCount()

        // Return true if count is greater than zero, indicating that the current user is following the follow user
        return count > 0
    }
}
