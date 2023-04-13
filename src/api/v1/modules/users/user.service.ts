import { UploadedFile } from "express-fileupload"
import User from "@entities/User"
import { paginateMeta } from "@utils/paginateMeta"
import { appDataSource } from "@config/data-source"
import { Auth, ListQueryParams, ListResponse, SearchQueryParams } from "@interfaces/index.interfaces"
import BadRequestException from "@exceptions/BadRequestException"
import Media, { MediaSource } from "@entities/Media"
import MediaService from "@services/media.service"
import NotFoundException from "@exceptions/NotFoundException"
import isEmpty from "is-empty"
import Profile from "@entities/Profile"
import { CreateUserDTO } from "@modules/auth/auth.dto"
import { LoginTicket, OAuth2Client, TokenPayload } from "google-auth-library"
import UnauthorizedException from "@exceptions/UnauthorizedException"
import { v4 as uuid } from "uuid"
import NotificationService from "@modules/notifications/notification.service"
import { NotificationTypes } from "@entities/Notification"
import { Brackets, In } from "typeorm"
import fetch from "cross-fetch"
import InternalServerException from "@exceptions/InternalServerException"


export default class UserService {
    public readonly userRepository      = appDataSource.getRepository( User )
    public readonly profileRepository   = appDataSource.getRepository( Profile )
    public readonly mediaService        = new MediaService()
    public readonly notificationService = new NotificationService()

    public async create( userData: CreateUserDTO ): Promise<User>{
        if( isEmpty( userData ) ) throw new BadRequestException( 'User data is empty.' )

        let user       = new User()
        user.firstName = userData.firstName
        user.lastName  = userData.lastName
        user.email     = userData.email
        user.username  = userData.username
        user.password  = userData.password
        await this.userRepository.save( user )

        return user
    }

    public async createWithGoogle( token: string ): Promise<User>{
        if( ! token ) throw new BadRequestException( 'Token is empty.' )

        const oAuthClient              = new OAuth2Client( process.env.GOOGLE_CLIENT_ID )
        let tokenPayload: TokenPayload = null

        try {
            const ticket: LoginTicket = await oAuthClient.verifyIdToken( {
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID
            } )
            tokenPayload              = ticket.getPayload()
        } catch ( e ) {
            throw new UnauthorizedException( 'Invalid access token.' )
        }

        let user = await this.userRepository.findOneBy( { email: tokenPayload.email } )

        //make user verified
        if( user && ! user.hasEmailVerified ){
            user.emailVerifiedAt = new Date( Date.now() ).toISOString()
            await this.userRepository.save( user )
        }

        if( user ) return user

        try {
            //create user
            user                 = new User()
            user.firstName       = tokenPayload.given_name
            user.lastName        = tokenPayload.family_name || tokenPayload.given_name
            user.email           = tokenPayload.email
            user.emailVerifiedAt = new Date( Date.now() ).toISOString()
            user.password        = uuid()
            await this.userRepository.save( user )

            //save photo
            user.avatar = await this.mediaService.save( {
                file: Buffer.from( await ( await fetch( tokenPayload.picture ) ).arrayBuffer() ),
                source: MediaSource.AVATAR,
                creator: { id: user.id } as User
            } )

            await this.userRepository.save( user )

            return user
        } catch ( err ) {
            throw new InternalServerException( 'Failed to create user.' )
        }
    }

    public async getCurrentUser( auth: Auth ){
        return await this.userRepository.findOneOrFail( {
            where: { id: auth.user.id },
            relations: ["profile"]
        } )
    }

    public async getUserById( userId: string, auth: Auth ): Promise<User>{
        if( ! userId ) throw new BadRequestException( "User id is empty." )

        const user = await this.userRepository.findOne( {
            where: { id: userId },
            relations: ["profile"]
        } )

        if( ! user ) throw new NotFoundException( 'User doesn\'t exists.' )

        await this.formatUser( user, auth )

        return user
    }

    public async getUserByUsername( username: string, auth: Auth ): Promise<User>{
        if( ! username ) throw new BadRequestException( "Username is empty." )

        const user = await this.userRepository.findOne( {
            where: { username },
            relations: { profile: true }
        } )

        if( ! user ) throw new NotFoundException( 'User doesn\'t exists.' )

        await this.formatUser( user, auth )

        return user
    }

    public async getFollowersCount( userId: string ): Promise<number>{
        if( ! userId ) throw new BadRequestException( "User id is empty." )

        //followers count
        return await this.userRepository
            .createQueryBuilder( "user" )
            .leftJoin( "user.followings", "following" )
            .where( "following.id = :followingId", { followingId: userId } )
            .getCount()
    }

    public async getFollowingsCount( userId: string ): Promise<number>{
        if( ! userId ) throw new BadRequestException( "User id is empty." )

        //followings count
        return await this.userRepository
            .createQueryBuilder( "user" )
            .leftJoin( "user.followers", "follower" )
            .where( "follower.id = :followerId", { followerId: userId } )
            .getCount()
    }

    public async getUserMediaList( userId: string, params: ListQueryParams ): Promise<ListResponse<Media>>{
        const page  = params.page || 1
        const limit = params.limit || 12
        const skip  = limit * ( page - 1 )

        if( ! userId ) throw new BadRequestException( "User id is empty." )

        const user = await this.userRepository.findOneBy( { id: userId } )

        if( ! user ) throw new NotFoundException( 'User doesn\'t exists.' )

        const [media, count] = await this.mediaService.repository.findAndCount( {
            where: {
                creator: { id: user.id },
                source: In( [MediaSource.AVATAR, MediaSource.COVER_PHOTO, MediaSource.POST] )
            },
            skip: skip,
            take: limit
        } )

        return { items: media, ...paginateMeta( count, page, limit ) }
    }

    public async searchUsers( params: SearchQueryParams, auth: Auth ): Promise<ListResponse<User>>{
        const q     = params.q
        const page  = params.page || 1
        const limit = params.limit || 16
        const skip  = limit * ( page - 1 )

        const [users, count] = await this.userRepository
            .createQueryBuilder( 'user' )
            .leftJoinAndSelect( 'user.avatar', 'avatar' )
            .where( 'user.id != :userId', { userId: auth.user.id } )
            .andWhere( new Brackets( ( qb ) => {
                qb.where( 'user.firstName LIKE :q', { q: `%${ q }%` } )
                qb.orWhere( 'user.lastName LIKE :q', { q: `%${ q }%` } )
                qb.orWhere( 'user.username LIKE :q', { q: `%${ q }%` } )
            } ) )
            .orderBy( 'user.createdAt', 'DESC' )
            .skip( skip )
            .take( limit )
            .getManyAndCount()

        await this.formatUsers( users, auth )

        return { items: users, ...paginateMeta( count, page, limit ) }
    }

    public async getSuggestions( params: ListQueryParams, auth: Auth ): Promise<ListResponse<User>>{
        const page  = params.page || 1
        const limit = params.limit || 6
        const skip  = limit * ( page - 1 )

        const user = await this.userRepository.findOne( {
            where: { id: auth.user.id },
            relations: ['followings']
        } )

        const followingIds = ! isEmpty( user.followings ) ? user.followings.map( user => user.id ) : ['']

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

    public async getFollowers( userId: string, params: ListQueryParams, auth: Auth ): Promise<ListResponse<User>>{
        if( ! userId ) throw new BadRequestException( "User id is empty." )

        const page  = params.page || 1
        const limit = params.limit || 10
        const skip  = limit * ( page - 1 )

        const [followers, count] = await this.userRepository
            .createQueryBuilder( 'user' )
            .leftJoin( 'user.followings', 'following' )
            .where( 'following.id = :userId', { userId } )
            .skip( skip )
            .take( limit )
            .getManyAndCount()

        await this.formatUsers( followers, auth )

        return { items: followers, ...paginateMeta( count, page, limit ) }
    }


    public async getFollowings( userId: string, params: ListQueryParams, auth: Auth ): Promise<ListResponse<User>>{
        if( ! userId ) throw new BadRequestException( "User id is empty." )

        const page  = params.page || 1
        const limit = params.limit || 10
        const skip  = limit * ( page - 1 )

        const [followings, count] = await this.userRepository
            .createQueryBuilder( 'user' )
            .leftJoin( 'user.followers', 'follower' )
            .where( 'follower.id = :userId', { userId } )
            .skip( skip )
            .take( limit )
            .getManyAndCount()

        await this.formatUsers( followings, auth )

        return { items: followings, ...paginateMeta( count, page, limit ) }
    }

    public async changeAvatar( avatar: UploadedFile, auth: Auth ){
        if( ! avatar ) throw new BadRequestException( "Avatar is empty." )

        const user = await this.userRepository.findOneBy( { id: auth.user.id } )

        user.avatar = await this.mediaService.save( {
            file: avatar.data,
            creator: auth.user,
            source: MediaSource.AVATAR
        } )

        return await this.userRepository.save( user )
    }

    public async changeCoverPhoto( coverPhoto: UploadedFile, auth: Auth ): Promise<User>{
        if( ! coverPhoto ) throw new BadRequestException( "Cover photo is empty." )

        const user    = await this.userRepository.findOneBy( { id: auth.user.id } )
        const profile = await this.profileRepository.findOneBy( { user: { id: auth.user.id } } )

        if( ! user || ! profile ) throw new BadRequestException( "User does not exists." )

        profile.coverPhoto = await this.mediaService.save( {
            file: coverPhoto.data,
            creator: auth.user,
            source: MediaSource.COVER_PHOTO
        } )
        await this.profileRepository.save( profile )
        user.profile = profile

        return user
    }

    public async follow( targetUserId: string, auth: Auth ): Promise<User>{
        if( ! targetUserId ) throw new BadRequestException( 'Target user id is empty.' )

        const targetUser = await this.userRepository.findOneBy( { id: targetUserId } )

        if( ! targetUser ) throw new BadRequestException( 'Target user does not exists.' )

        try {
            targetUser.followers = [auth.user]
            await this.userRepository.save( targetUser )
        } catch ( e ) {
            console.log( e.message )
        }

        targetUser.isViewerFollow = true

        this.notificationService.create( {
            recipient: targetUser,
            type: NotificationTypes.FOLLOWED
        }, auth )

        return targetUser
    }

    public async unfollow( targetUserId: string, auth: Auth ): Promise<User>{
        if( ! targetUserId ) throw new BadRequestException( 'Target user id is empty.' )

        const targetUser = await this.userRepository.findOneBy( { id: targetUserId } )

        if( ! targetUser ) throw new BadRequestException( 'Target user does not exists.' )

        await this.userRepository
            .createQueryBuilder()
            .relation( User, 'followings' )
            .of( auth.user.id )
            .remove( targetUserId )

        targetUser.isViewerFollow = false

        return targetUser
    }

    public async makeUserActive( userId: string ): Promise<User>{
        if( ! userId ) throw new BadRequestException( 'User id is empty.' )

        const user = await this.userRepository.findOneBy( { id: userId } )

        if( ! user ) throw new BadRequestException( 'User does not exists.' )

        user.active = 1

        await this.userRepository.save( user )

        return user
    }

    public async makeUserInactive( userId: string ): Promise<User>{
        if( ! userId ) throw new BadRequestException( 'User id is empty.' )

        const user = await this.userRepository.findOneBy( { id: userId } )

        if( ! user ) throw new BadRequestException( 'User does not exists.' )

        user.active = 0

        await this.userRepository.save( user )

        return user
    }

    async formatUser( user: User, auth: Auth ): Promise<User>{
        user.isViewerFollow = await this.isCurrentUserFollow( user, auth )

        return user
    }

    async formatUsers( users: User[], auth: Auth ): Promise<User[]>{
        for ( const user of users ) {
            await this.formatUser( user, auth )
        }

        return users
    }

    async isCurrentUserFollow( followUser: User, auth: Auth ): Promise<boolean>{
        if( ! auth.isAuthenticated ) return false

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