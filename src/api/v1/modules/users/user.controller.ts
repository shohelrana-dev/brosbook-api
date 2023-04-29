import { Request } from "express"
import UserService from "./user.service"
import { UploadedFile } from "express-fileupload"
import { inject } from "inversify"
import { controller, httpGet, httpPost } from "inversify-express-utils"
import authMiddleware from "@middleware/auth.middleware"
import User from "@entities/User"
import { ListResponse } from "@interfaces/index.interfaces"
import Media from "@entities/Media"

/**
 * @class UserController
 * @desc Responsible for handling API requests for the
 * /users route.
 **/
@controller( '/users' )
export default class UserController {
    constructor( @inject( UserService ) private readonly usersService: UserService ){}

    @httpGet( '/me', authMiddleware )
    public async getCurrentUser( req: Request ): Promise<User>{
        return await this.usersService.getCurrentUser( req.auth )
    }

    @httpGet( '/by/username/:username', )
    public async getUserByUsername( req: Request ): Promise<User>{
        return await this.usersService.getUserByUsername( req.params.username, req.auth )
    }

    @httpGet( '/search' )
    public async searchUsers( req: Request ): Promise<ListResponse<User>>{
        const q= req.query.q as string
        const page  = Number( req.query.page || 1 )
        const limit = Number( req.query.limit || 6 )

        return await this.usersService.searchUsers( { q, page, limit }, req.auth )
    }

    @httpGet( '/suggestions', authMiddleware )
    public async getSuggestions( req: Request ): Promise<ListResponse<User>>{
        const page  = Number( req.query.page || 1 )
        const limit = Number( req.query.limit || 6 )

        return await this.usersService.getSuggestions( { page, limit }, req.auth )
    }

    @httpGet( '/:userId' )
    public async getUserById( req: Request ): Promise<User>{
        return await this.usersService.getUserById( req.params.userId, req.auth )
    }

    @httpGet( '/:userId/followings' )
    public async getFollowings( req: Request ): Promise<ListResponse<User>>{
        const userId = req.params.userId as string
        const page   = Number( req.query.page || 1 )
        const limit  = Number( req.query.limit || 6 )

        return await this.usersService.getFollowings( userId, { page, limit }, req.auth )
    }

    @httpGet( '/:userId/followings/count' )
    public async getFollowingsCount( req: Request ): Promise<{ count: number }>{
        const count = await this.usersService.getFollowingsCount( req.params.userId )

        return { count }
    }

    @httpGet( '/:userId/media' )
    public async getUserMediaList( req: Request ): Promise<ListResponse<Media>>{
        const page   = Number( req.query.page || 1 )
        const limit  = Number( req.query.limit || 16 )
        const userId = req.params.userId as string

        return await this.usersService.getUserMediaList( userId, {page, limit} )
    }

    @httpGet( '/:userId/followers' )
    public async getFollowers( req: Request ): Promise<ListResponse<User>>{
        const userId = req.params.userId
        const page   = Number( req.query.page || 1 )
        const limit  = Number( req.query.limit || 6 )

        return await this.usersService.getFollowers( userId, { page, limit }, req.auth )
    }

    @httpGet( '/:userId/followers/count' )
    public async getFollowersCount( req: Request ): Promise<{ count: number }>{
        const count = await this.usersService.getFollowersCount( req.params.userId )

        return { count }
    }

    @httpPost( '/me/avatar', authMiddleware )
    public async changeAvatar( req: Request ): Promise<User>{
        const file = req.files?.avatar as UploadedFile

        return await this.usersService.changeAvatar( file, req.auth )
    }

    @httpPost( '/me/cover_photo', authMiddleware )
    public async changeCoverPhoto( req: Request ): Promise<User>{
        const file = req.files?.coverPhoto as UploadedFile

        return await this.usersService.changeCoverPhoto( file, req.auth )
    }

    @httpPost( '/follow/:userId', authMiddleware )
    public async follow( req: Request ): Promise<User>{
        return await this.usersService.follow( req.params.userId, req.auth )
    }

    @httpPost( '/unfollow/:userId', authMiddleware )
    public async unfollow( req: Request ): Promise<User>{
        return await this.usersService.unfollow( req.params.userId, req.auth )
    }

}