import { UploadedFile } from "express-fileupload"
import Relationship from "@entities/Relationship"
import User from "@entities/User"
import { paginateMeta } from "@utils/paginateMeta"
import { appDataSource } from "@config/data-source"
import { Auth, ListQueryParams, ListResponse, SearchQueryParams } from "@interfaces/index.interfaces"
import BadRequestException from "@exceptions/BadRequestException"
import { MediaSource } from "@entities/Media"
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
import { Brackets } from "typeorm"
import fetch from "cross-fetch"


export default class UserService {
    public readonly repository             = appDataSource.getRepository( User )
    public readonly profileRepository      = appDataSource.getRepository( Profile )
    public readonly relationshipRepository = appDataSource.getRepository( Relationship )
    public readonly mediaService           = new MediaService()
    public readonly notificationService    = new NotificationService()

    public async create( userData: CreateUserDTO ): Promise<User>{
        if( isEmpty( userData ) ) throw new BadRequestException( 'User data is empty.' )

        let user       = new User()
        user.firstName = userData.firstName
        user.lastName  = userData.lastName
        user.email     = userData.email
        user.username  = userData.username
        user.password  = userData.password
        await this.repository.save( user )

        await this.profileRepository.create( { user } ).save()

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

        let user = await this.repository.findOneBy( { email: tokenPayload.email } )

        //make user verified
        if( user && ! user.hasEmailVerified ){
            user.emailVerifiedAt = new Date( Date.now() ).toISOString()
            await this.repository.save( user )
        }

        if( user ) return user

        //create user
        user           = new User()
        user.firstName = tokenPayload.given_name
        user.lastName  = tokenPayload.family_name
        user.email     = tokenPayload.email
        user.password  = uuid()
        user           = await this.repository.save( user )

        //save photo
        user.avatar = await this.mediaService.save( {
            file: Buffer.from( await ( await fetch( tokenPayload.picture ) ).arrayBuffer() ),
            source: MediaSource.AVATAR,
            creatorId: user.id
        } )

        await this.repository.save( user )

        await this.profileRepository.create( { user } ).save()

        return user
    }

    public async getCurrentUser( auth: Auth ){
        return await this.repository.findOneOrFail( {
            where: { id: auth.user.id },
            relations: { profile: true }
        } )
    }

    public async getUserById( userId: string, auth: Auth ): Promise<User>{
        if( ! userId ) throw new BadRequestException( "User id is empty." )

        const user = await this.repository.findOne( {
            where: { id: userId },
            relations: { profile: true }
        } )

        if( ! user ) throw new NotFoundException( 'User doesn\'t exists.' )

        await user.setViewerProperties( auth )

        return user
    }

    public async getUserByUsername( username: string, auth: Auth ): Promise<User>{
        if( ! username ) throw new BadRequestException( "Username is empty." )

        const user = await this.repository.findOne( {
            where: { username },
            relations: { profile: true }
        } )

        if( ! user ) throw new NotFoundException( 'User doesn\'t exists.' )

        await user.setViewerProperties( auth )

        return user
    }

    public async getFollowersCount( userId: string ): Promise<number>{
        if( ! userId ) throw new BadRequestException( "User id is empty." )

        return await Relationship.countBy( { following: { id: userId } } )
    }

    public async getFollowingsCount( userId: string ): Promise<number>{
        if( ! userId ) throw new BadRequestException( "User id is empty." )

        return await Relationship.countBy( { follower: { id: userId } } )
    }

    public async searchUsers( params: SearchQueryParams, auth: Auth ): Promise<ListResponse<User>>{
        const key   = params.key
        const page  = params.page || 1
        const limit = params.limit || 16
        const skip  = limit * ( page - 1 )

        const [users, count] = await this.repository
            .createQueryBuilder( 'user' )
            .leftJoinAndSelect( 'user.avatar', 'avatar' )
            .where( 'user.id != :userId', { userId: auth.user.id } )
            .andWhere( new Brackets( ( qb ) => {
                qb.where( 'user.firstName LIKE :key', { key: `%${ key }%` } )
                qb.orWhere( 'user.lastName LIKE :key', { key: `%${ key }%` } )
            } ) )
            .orderBy( 'user.createdAt', 'DESC' )
            .skip( skip )
            .take( limit )
            .getManyAndCount()

        const formattedUsers = await Promise.all( users.map( user => user.setViewerProperties( auth ) ) )

        return { items: formattedUsers, ...paginateMeta( count, page, limit ) }
    }

    public async getSuggestions( params: ListQueryParams, auth: Auth ): Promise<ListResponse<User>>{
        const page  = params.page || 1
        const limit = params.limit || 6
        const skip  = limit * ( page - 1 )

        const currentUserFollowings = await this.relationshipRepository
            .createQueryBuilder( 'relationship' )
            .leftJoin( 'relationship.follower', 'follower' )
            .leftJoin( 'relationship.following', 'following' )
            .where( 'follower.id = :userId', { userId: auth.user.id } )
            .select( 'relationship.id' )
            .addSelect( 'following.id' )
            .getMany()

        let currentUserFollowingIds = currentUserFollowings.map( rel => rel.following.id )
        currentUserFollowingIds     = isEmpty( currentUserFollowings ) ? [""] : currentUserFollowingIds

        const [users, count] = await this.repository
            .createQueryBuilder( 'user' )
            .leftJoin( 'user.followings', 'following' )
            .leftJoin( 'user.followers', 'follower' )
            .leftJoinAndSelect( 'user.avatar', 'avatar' )
            .leftJoinAndSelect( 'user.profile', 'profile' )
            .where( 'user.id != :userId', { userId: auth.user.id } )
            .andWhere( 'user.id NOT IN (:...userIds)', { userIds: currentUserFollowingIds } )
            .orderBy( 'user.createdAt', 'DESC' )
            .skip( skip )
            .take( limit )
            .getManyAndCount()

        const formattedUsers = await Promise.all( users.map( user => user.setViewerProperties( auth ) ) )

        return { items: formattedUsers, ...paginateMeta( count, page, limit ) }
    }

    public async getFollowers( userId: string, params: ListQueryParams, auth: Auth ): Promise<ListResponse<User>>{
        if( ! userId ) throw new BadRequestException( "User id is empty." )

        const page  = params.page || 1
        const limit = params.limit || 10
        const skip  = limit * ( page - 1 )

        const [relationships, count] = await this.relationshipRepository
            .createQueryBuilder( 'relationship' )
            .leftJoinAndSelect( 'relationship.follower', 'follower' )
            .leftJoinAndSelect( 'relationship.following', 'following' )
            .leftJoinAndSelect( 'follower.avatar', 'followerAvatar' )
            .leftJoinAndSelect( 'following.avatar', 'followingAvatar' )
            .leftJoinAndSelect( 'follower.profile', 'followerProfile' )
            .leftJoinAndSelect( 'following.profile', 'followingProfile' )
            .where( 'following.id = :followingId', { followingId: userId } )
            .take( limit )
            .skip( skip )
            .getManyAndCount()

        const followers = relationships.map( rel => rel.follower )

        const formattedFollowers = await Promise.all( followers.map( user => user.setViewerProperties( auth ) ) )

        return { items: formattedFollowers, ...paginateMeta( count, page, limit ) }
    }


    public async getFollowings( userId: string, params: ListQueryParams, auth: Auth ): Promise<ListResponse<User>>{
        if( ! userId ) throw new BadRequestException( "User id is empty." )

        const page  = params.page || 1
        const limit = params.limit || 10
        const skip  = limit * ( page - 1 )

        const [relationships, count] = await this.relationshipRepository
            .createQueryBuilder( 'relationship' )
            .leftJoinAndSelect( 'relationship.following', 'following' )
            .leftJoinAndSelect( 'relationship.follower', 'follower' )
            .leftJoinAndSelect( 'follower.avatar', 'followerAvatar' )
            .leftJoinAndSelect( 'following.avatar', 'followingAvatar' )
            .leftJoinAndSelect( 'follower.profile', 'followerProfile' )
            .leftJoinAndSelect( 'following.profile', 'followingProfile' )
            .where( 'follower.id = :followerId', { followerId: userId } )
            .take( limit )
            .skip( skip )
            .getManyAndCount()

        const followings = relationships.map( rel => rel.following )

        const formattedFollowings = await Promise.all( followings.map( user => user.setViewerProperties( auth ) ) )

        return { items: formattedFollowings, ...paginateMeta( count, page, limit ) }
    }

    public async changeAvatar( avatar: UploadedFile, auth: Auth ){
        if( ! avatar ) throw new BadRequestException( "Avatar is empty." )

        const user = await this.repository.findOneBy( { id: auth.user.id } )

        user.avatar = await this.mediaService.save( {
            file: avatar.data,
            creatorId: auth.user.id,
            source: MediaSource.AVATAR
        } )

        return await this.repository.save( user )
    }

    public async changeCoverPhoto( coverPhoto: UploadedFile, auth: Auth ): Promise<User>{
        if( ! coverPhoto ) throw new BadRequestException( "Cover photo is empty." )

        const user    = await this.repository.findOneBy( { id: auth.user.id } )
        const profile = await this.profileRepository.findOneBy( { user: { id: auth.user.id } } )

        if( ! user || ! profile ) throw new BadRequestException( "User does not exists." )

        profile.coverPhoto = await this.mediaService.save( {
            file: coverPhoto.data,
            creatorId: auth.user.id,
            source: MediaSource.COVER_PHOTO
        } )
        await this.profileRepository.save( profile )
        user.profile = profile

        return user
    }

    public async follow( targetUserId: string, auth: Auth ): Promise<User>{
        if( ! targetUserId ) throw new BadRequestException( 'Target user id is empty.' )

        const targetUser = await this.repository.findOneBy( { id: targetUserId } )

        if( ! targetUser ) throw new BadRequestException( 'Target user does not exists.' )

        await this.relationshipRepository.create( { follower: { id: auth.user.id }, following: targetUser } ).save()

        targetUser.isViewerFollow = true

        this.notificationService.create( {
            initiatorId: auth.user.id,
            recipientId: targetUserId,
            type: NotificationTypes.FOLLOWED
        } )

        return targetUser
    }

    public async unfollow( targetUserId: string, auth: Auth ): Promise<User>{
        if( ! targetUserId ) throw new BadRequestException( 'Target user id is empty.' )

        const targetUser = await this.repository.findOneBy( { id: targetUserId } )

        if( ! targetUser ) throw new BadRequestException( 'Target user does not exists.' )

        await this.relationshipRepository.delete( { follower: { id: auth.user.id }, following: { id: targetUser.id } } )

        targetUser.isViewerFollow = false

        return targetUser
    }
}