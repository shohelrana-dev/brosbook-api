import { UploadedFile } from "express-fileupload"
import User from "@entities/User"
import { paginateMeta } from "@utils/paginateMeta"
import { Auth, ListQueryParams, ListResponse, SearchQueryParams } from "@utils/types"
import BadRequestException from "@exceptions/BadRequestException"
import Media, { MediaSource } from "@entities/Media"
import MediaService from "@services/media.service"
import NotFoundException from "@exceptions/NotFoundException"
import isEmpty from "is-empty"
import { CreateUserDTO } from "@modules/auth/auth.dto"
import { LoginTicket, OAuth2Client, TokenPayload } from "google-auth-library"
import UnauthorizedException from "@exceptions/UnauthorizedException"
import { v4 as uuid } from "uuid"
import NotificationService from "@modules/notifications/notification.service"
import { NotificationTypes } from "@entities/Notification"
import { Brackets, In } from "typeorm"
import fetch from "cross-fetch"
import InternalServerException from "@exceptions/InternalServerException"
import { inject, injectable } from "inversify"
import { appDataSource } from "@config/datasource.config"
import Profile from "@entities/Profile"

/**
 * Service responsible for handling user operations such as creation, retrieval, and management.
 * This service uses a repository pattern to communicate with the underlying database.
 * It also depends on the MediaService and NotificationService to handle media and notification related tasks.
 */
@injectable()
export default class UserService {
    private readonly userRepository    = appDataSource.getRepository( User )
    private readonly profileRepository = appDataSource.getRepository( Profile )
    private readonly mediaRepository   = appDataSource.getRepository( Media )

    /**
     * Creates an instance of the UserService class.
     *
     * @param notificationService - The NotificationService object. Used for sending notifications to users.
     * @param mediaService - The MediaService object. Used for handling media related tasks.
     */
    constructor(
        @inject( NotificationService )
        private readonly notificationService: NotificationService,
        @inject( MediaService )
        private readonly mediaService: MediaService
    ) {
    }

    /**
     * Creates a new user and returns the newly created user object.
     *
     * @param userData - The user data object containing the user's details.
     * @returns A promise that resolves to the newly created user object.
     * @throws BadRequestException if the user data is empty.
     */
    public async create( userData: CreateUserDTO ): Promise<User> {
        if ( isEmpty( userData ) ) throw new BadRequestException( 'User data is empty' )

        let user       = new User()
        user.firstName = userData.firstName
        user.lastName  = userData.lastName
        user.email     = userData.email
        user.username  = userData.username
        user.password  = userData.password
        await this.userRepository.save( user )

        await this.profileRepository.create({ user }).save()

        return user
    }

    /**
     * Creates a new user using a Google token and returns the newly created user object.
     *
     * @param token - The Google token used to authenticate the user.
     * @returns A promise that resolves to the newly created user object.
     * @throws BadRequestException if the token is empty.
     * @throws UnauthorizedException if the token is invalid.
     * @throws InternalServerException if the user creation fails.
     */
    public async createWithGoogle( token: string ): Promise<User> {
        if ( !token ) throw new BadRequestException( 'Token is empty' )

        const oAuthClient              = new OAuth2Client( process.env.GOOGLE_CLIENT_ID )
        let tokenPayload: TokenPayload = null

        try {
            const ticket: LoginTicket = await oAuthClient.verifyIdToken( {
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID
            } )
            tokenPayload              = ticket.getPayload()
        } catch ( e ) {
            throw new UnauthorizedException( 'Invalid access token' )
        }

        let user = await this.userRepository.findOneBy( { email: tokenPayload.email } )

        //make user verified
        if ( user && !user.hasEmailVerified ) {
            user.emailVerifiedAt = new Date( Date.now() ).toISOString()
            await this.userRepository.save( user )
        }

        if ( user ) return user

        try {
            //create user
            user                 = new User()
            user.firstName       = tokenPayload.given_name
            user.lastName        = tokenPayload.family_name || tokenPayload.given_name
            user.fullName        = `${ user.firstName } ${ user.lastName }`
            user.email           = tokenPayload.email
            user.emailVerifiedAt = new Date( Date.now() ).toISOString()
            user.password        = uuid()
            await this.userRepository.save( user )

            await this.profileRepository.create({ user }).save()

            //save photo
            user.avatar = await this.mediaService.save( {
                file: Buffer.from( await ( await fetch( tokenPayload.picture ) ).arrayBuffer() ),
                source: MediaSource.AVATAR,
                creator: { id: user.id } as User
            } )

            await this.userRepository.save( user )

            return user
        } catch ( err ) {
            throw new InternalServerException( 'Failed to create user' )
        }
    }

    /**
     * Fetches the currently logged-in user with its profile information.
     *
     * @param {Auth} auth - An object containing the user's authentication information.
     * @returns {Promise<User>} The currently logged-in user with its profile information.
     * @throws {NotFoundException} When the user is not found in the database.
     */
    public async getCurrentUser( auth: Auth ) {
        return await this.userRepository.findOneOrFail( {
            where: { id: auth.user.id },
            relations: ["profile"]
        } )
    }

    /**
     * Fetches a user by its user ID with its profile information.
     *
     * @param {string} userId - The ID of the user to fetch.
     * @param {Auth} auth - An object containing the user's authentication information.
     * @returns {Promise<User>} The user with the given user ID with its profile information.
     * @throws {BadRequestException} When the user ID is empty.
     * @throws {NotFoundException} When the user is not found in the database.
     */
    public async getById( userId: string, auth: Auth ): Promise<User> {
        if ( !userId ) throw new BadRequestException( "User id is empty" )

        const user = await this.userRepository.findOne( {
            where: { id: userId },
            relations: ["profile"]
        } )

        if ( !user ) throw new NotFoundException( 'User does not exists' )

        await this.formatUser( user, auth )

        return user
    }

    /**
     * Fetches a user by its username with its profile information.
     *
     * @param {string} username - The username of the user to fetch.
     * @param {Auth} auth - An object containing the user's authentication information.
     * @returns {Promise<User>} The user with the given username with its profile information.
     * @throws {BadRequestException} When the username is empty.
     * @throws {NotFoundException} When the user is not found in the database.
     */
    public async getByUsername( username: string, auth: Auth ): Promise<User> {
        if ( !username ) throw new BadRequestException( "Username is empty" )

        const user = await this.userRepository.findOne( {
            where: { username },
            relations: { profile: true }
        } )

        if ( !user ) throw new NotFoundException( 'User does not exists' )

        await this.formatUser( user, auth )

        return user
    }

    /**
     * Fetches the count of the followers of a user with the given user ID.
     *
     * @param {string} userId - The ID of the user to fetch the followers count.
     * @returns {Promise<number>} The count of the followers of the user with the given user ID.
     * @throws {BadRequestException} When the user ID is empty.
     */
    public async getFollowersCount( userId: string ): Promise<number> {
        if ( !userId ) throw new BadRequestException( "User id is empty" )

        //followers count
        return await this.userRepository.createQueryBuilder( "user" )
            .leftJoin( "user.followings", "following" )
            .where( "following.id = :followingId", { followingId: userId } )
            .getCount()
    }

    /**
     * Get the number of users a particular user is following
     *
     * @param {string} userId - The user id
     * @returns {Promise<number>} The number of users the user is following
     * @throws {BadRequestException} if user id is empty
     */
    public async getFollowingsCount( userId: string ): Promise<number> {
        if ( !userId ) throw new BadRequestException( "User id is empty" )

        //followings count
        return await this.userRepository.createQueryBuilder( "user" )
            .leftJoin( "user.followers", "follower" )
            .where( "follower.id = :followerId", { followerId: userId } )
            .getCount()
    }

    /**
     * Get the list of media belonging to a particular user
     *
     * @param {string} userId - The user id
     * @param {ListQueryParams} params - List query parameters (page and limit)
     * @returns {Promise<ListResponse<Media>>} The list of media belonging to the user
     * @throws {BadRequestException} if user id is empty
     * @throws {NotFoundException} if user does not exist
     */
    public async getUserMediaList( userId: string, params: ListQueryParams ): Promise<ListResponse<Media>> {
        const { page, limit } = params
        const skip            = limit * ( page - 1 )

        if ( !userId ) throw new BadRequestException( "User id is empty" )

        const user = await this.userRepository.findOneBy( { id: userId } )

        if ( !user ) throw new NotFoundException( 'User does not exists' )

        const [media, count] = await this.mediaRepository.findAndCount( {
            where: {
                creator: { id: user.id },
                source: In( [MediaSource.AVATAR, MediaSource.COVER_PHOTO, MediaSource.POST] )
            },
            order: { createdAt: "DESC" },
            skip: skip,
            take: limit
        } )

        return { items: media, ...paginateMeta( count, page, limit ) }
    }

    /**
     * Search for users based on a query string
     *
     * @param {SearchQueryParams} params - Search query parameters (q, page and limit)
     * @param {Auth} auth - The authenticated user object
     * @returns {Promise<ListResponse<User>>} The list of users matching the search query
     */
    public async search( params: SearchQueryParams, auth: Auth ): Promise<ListResponse<User>> {
        const { q, page, limit } = params
        const skip               = limit * ( page - 1 )

        const [users, count] = await this.userRepository
            .createQueryBuilder( 'user' )
            .leftJoinAndSelect( 'user.avatar', 'avatar' )
            .where( 'user.id != :userId', { userId: auth.user.id } )
            .andWhere( new Brackets( ( qb ) => {
                qb.where( 'user.firstName iLIKE :q', { q: `%${ q }%` } )
                qb.orWhere( 'user.lastName iLIKE :q', { q: `%${ q }%` } )
                qb.orWhere( 'user.username iLIKE :q', { q: `%${ q }%` } )
            } ) )
            .orderBy( 'user.createdAt', 'DESC' )
            .skip( skip )
            .take( limit )
            .getManyAndCount()

        await this.formatUsers( users, auth )

        return { items: users, ...paginateMeta( count, page, limit ) }
    }

    /**
     * Retrieves a list of suggested users for the current user to follow.
     *
     * @param {ListQueryParams} params - The pagination parameters.
     * @param {Auth} auth - The user authentication object.
     * @return {Promise<ListResponse<User>>} - The list of suggested users and pagination metadata.
     */
    public async getSuggestions( params: ListQueryParams, auth: Auth ): Promise<ListResponse<User>> {
        const { page, limit } = params
        const skip            = limit * ( page - 1 )

        const user = await this.userRepository.findOne( {
            where: { id: auth.user.id },
            relations: ['followings']
        } )

        const followingIds = !isEmpty( user.followings ) ? user.followings.map( user => user.id ) : ['']

        // Retrieve users not followed by the current user
        const [users, count] = await this.userRepository
            .createQueryBuilder( 'user' )
            .leftJoinAndSelect( 'user.avatar', 'avatar' )
            .leftJoinAndSelect( 'user.profile', 'profile' )
            .where( 'user.id != :userId', { userId: auth.user.id } )
            .andWhere( 'user.id NOT IN (:...followingIds)', { followingIds } )
            .orderBy( 'user.createdAt', 'DESC' )
            .skip( skip )
            .take( limit )
            .getManyAndCount()


        await this.formatUsers( users, auth )

        return { items: users, ...paginateMeta( count, page, limit ) }
    }

    /**
     * Retrieves a list of followers for a given user.
     *
     * @param {string} userId - The ID of the user to retrieve followers for.
     * @param {ListQueryParams} params - The pagination parameters.
     * @param {Auth} auth - The user authentication object.
     * @return {Promise<ListResponse<User>>} - The list of followers and pagination metadata.
     */
    public async getFollowers( userId: string, params: ListQueryParams, auth: Auth ): Promise<ListResponse<User>> {
        if ( !userId ) throw new BadRequestException( "User id is empty" )

        const { page, limit } = params
        const skip            = limit * ( page - 1 )

        const [followers, count] = await this.userRepository
            .createQueryBuilder( 'user' )
            .leftJoin( 'user.followings', 'following' )
            .leftJoinAndSelect( 'user.avatar', 'avatar' )
            .leftJoinAndSelect( 'user.profile', 'profile' )
            .where( 'following.id = :userId', { userId } )
            .skip( skip )
            .take( limit )
            .getManyAndCount()

        await this.formatUsers( followers, auth )

        return { items: followers, ...paginateMeta( count, page, limit ) }
    }


    /**
     * Retrieves a list of followings for a given user.
     *
     * @param {string} userId - The ID of the user to retrieve followings for.
     * @param {ListQueryParams} params - The pagination parameters.
     * @param {Auth} auth - The user authentication object.
     * @return {Promise<ListResponse<User>>} - The list of followings and pagination metadata.
     */
    public async getFollowings( userId: string, params: ListQueryParams, auth: Auth ): Promise<ListResponse<User>> {
        if ( !userId ) throw new BadRequestException( "User id is empty" )

        const { page, limit } = params
        const skip            = limit * ( page - 1 )

        const [followings, count] = await this.userRepository
            .createQueryBuilder( 'user' )
            .leftJoin( 'user.followers', 'follower' )
            .leftJoinAndSelect( 'user.avatar', 'avatar' )
            .leftJoinAndSelect( 'user.profile', 'profile' )
            .where( 'follower.id = :userId', { userId } )
            .skip( skip )
            .take( limit )
            .getManyAndCount()

        await this.formatUsers( followings, auth )

        return { items: followings, ...paginateMeta( count, page, limit ) }
    }

    /**
     * Changes the avatar of a user.
     *
     * @param {UploadedFile} avatar - The new avatar image file.
     * @param {Auth} auth - The authentication information for the user.
     * @returns {Promise<User>} The updated user object.
     * @throws {BadRequestException} if the avatar is empty.
     */
    public async changeAvatar( avatar: UploadedFile, auth: Auth ): Promise<User> {
        if ( !avatar ) throw new BadRequestException( "Avatar is empty" )

        const user = await this.userRepository.findOneBy( { id: auth.user.id } )

        user.avatar = await this.mediaService.save( {
            file: avatar.data,
            creator: auth.user,
            source: MediaSource.AVATAR
        } )

        return await this.userRepository.save( user )
    }

    /**
     * Changes the cover photo of a user's profile.
     *
     * @param {UploadedFile} coverPhoto - The new cover photo image file.
     * @param {Auth} auth - The authentication information for the user.
     * @returns {Promise<User>} The updated user object.
     * @throws {BadRequestException} if the cover photo is empty, or if the user or profile does not exist.
     */
    public async changeCoverPhoto( coverPhoto: UploadedFile, auth: Auth ): Promise<User> {
        if ( !coverPhoto ) throw new BadRequestException( "Cover photo is empty" )

        const user    = await this.userRepository.findOneBy( { id: auth.user.id } )
        let profile = await this.profileRepository.findOneBy( { user: { id: auth.user.id } } )

        if(!profile && user){
           profile = await this.profileRepository.create({user}).save() 
        }

        if ( !user || !profile ) throw new BadRequestException( "User does not exists" )

        profile.coverPhoto = await this.mediaService.save( {
            file: coverPhoto.data,
            creator: auth.user,
            source: MediaSource.COVER_PHOTO
        } )
        await this.profileRepository.save( profile )
        user.profile = profile

        return user
    }

    /**
     * Follows a target user.
     *
     * @param {string} targetUserId - The ID of the user to follow.
     * @param {Auth} auth - The authentication information for the user.
     * @returns {Promise<User>} The target user object with updated follower information.
     * @throws {BadRequestException} if the target user ID is empty or does not exist, or if the user is already following the target user.
     * @throws {InternalServerException} if the database operation fails.
     */
    public async follow( targetUserId: string, auth: Auth ): Promise<User> {
        if ( !targetUserId ) throw new BadRequestException( 'Target user id is empty' )

        const targetUser = await this.userRepository.findOneBy( { id: targetUserId } )

        if ( !targetUser ) throw new BadRequestException( 'Target user does not exists' )

        //check already following
        const findTheUserFromFollowing = await this.userRepository
            .createQueryBuilder( 'user' )
            .innerJoin( 'user.followings', 'following' )
            .where( 'user.id = :userId', { userId: auth.user.id } )
            .andWhere( 'following.id = :followingId', { followingId: targetUser.id } )
            .getOne()

        if ( findTheUserFromFollowing ) throw new BadRequestException( 'You already followed the user' )

        try {
            targetUser.followers = [auth.user]
            await this.userRepository.save( targetUser )
        } catch ( e ) {
            throw new InternalServerException( 'Failed to follow the user' )
        }

        targetUser.isViewerFollow = true

        this.notificationService.create( {
            recipient: targetUser,
            type: NotificationTypes.FOLLOWED
        }, auth )

        return targetUser
    }

    /**
     * Unfollows a target user.
     *
     * @param {string} targetUserId - The ID of the user to unfollow.
     * @param {Auth} auth - The authentication information for the user.
     * @returns {Promise<User>} The target user object with updated follower information.
     * @throws {BadRequestException} if the target user ID is empty or does not exist.
     * @throws {InternalServerException} if the database operation fails.
     */
    public async unfollow( targetUserId: string, auth: Auth ): Promise<User> {
        if ( !targetUserId ) throw new BadRequestException( 'Target user id is empty' )

        const targetUser = await this.userRepository.findOneBy( { id: targetUserId } )

        if ( !targetUser ) throw new BadRequestException( 'Target user does not exists' )

        try {
            await this.userRepository.createQueryBuilder()
                .relation( User, 'followings' )
                .of( auth.user.id )
                .remove( targetUserId )
        } catch ( e ) {
            throw new InternalServerException( 'Failed to unfollow the user' )
        }

        targetUser.isViewerFollow = false

        this.notificationService.delete( { recipient: targetUser, type: NotificationTypes.FOLLOWED }, auth )

        return targetUser
    }

    /**
     * Makes a user active.
     *
     * @param {string} userId - The ID of the user to make active.
     * @returns {Promise<User>} The updated user object.
     * @throws {BadRequestException} if the user ID is empty or does not exist.
     */
    public async makeUserActive( userId: string ): Promise<User> {
        if ( !userId ) throw new BadRequestException( 'User id is empty' )

        const user = await this.userRepository.findOneBy( { id: userId } )

        if ( !user ) throw new BadRequestException( 'User does not exists' )

        user.active = true

        await this.userRepository.save( user )

        return user
    }

    /**
     * Makes a user inactive.
     *
     * @param {string} userId - The ID of the user to make inactive.
     * @returns {Promise<User>} The updated user object.
     * @throws {BadRequestException} if the user ID is empty or does not exist.
     */
    public async makeUserInactive( userId: string ): Promise<User> {
        if ( !userId ) throw new BadRequestException( 'User id is empty' )

        const user = await this.userRepository.findOneBy( { id: userId } )

        if ( !user ) throw new BadRequestException( 'User does not exists' )

        user.active = false

        await this.userRepository.save( user )

        return user
    }

    /**
     * Formats a user object with additional information.
     *
     * @param {User} user - The user object to format.
     * @param {Auth} auth - The authentication information for the current user.
     * @returns {Promise<User>} The formatted user object.
     */
    async formatUser( user: User, auth: Auth ): Promise<User> {
        user.isViewerFollow = await this.isCurrentUserFollow( user, auth )

        return user
    }

    /**
     * Formats an array of user objects with additional information.
     *
     * @param {User[]} users - The array of user objects to format.
     * @param {Auth} auth - The authentication information for the current user.
     * @returns {Promise<User[]>} The formatted array of user objects.
     */
    async formatUsers( users: User[], auth: Auth ): Promise<User[]> {
        for ( const user of users ) {
            await this.formatUser( user, auth )
        }

        return users
    }

    /**
     * Checks if the current user is following a specified user.
     *
     * @param {User} followUser - The user being followed.
     * @param {Auth} auth - The authentication object for the current user.
     * @returns {Promise<boolean>} A Promise that resolves to true if the current user is following the specified user; otherwise, false.
     */
    async isCurrentUserFollow( followUser: User, auth: Auth ): Promise<boolean> {
        if ( !auth.isAuthenticated ) return false

        // Count the number of followings records that match the current user ID and follow user ID
        const count = await this.userRepository
            .createQueryBuilder( 'user' )
            .leftJoinAndSelect( 'user.followings', 'following' )
            .where( 'user.id = :currentUserId', { currentUserId: auth.user.id } )
            .andWhere( 'following.id = :followUserId', { followUserId: followUser.id } )
            .getCount()

        // Return true if count is greater than zero, indicating that the current user is following the follow user
        return count > 0
    }
}