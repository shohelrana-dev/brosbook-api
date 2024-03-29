import Post from '@entities/Post'
import authMiddleware from '@middleware/auth.middleware'
import { ListResponse } from '@utils/types'
import { Request, Response } from 'express'
import { UploadedFile } from 'express-fileupload'
import { inject } from 'inversify'
import { controller, httpDelete, httpGet, httpPost } from 'inversify-express-utils'
import PostService from './post.service'

/**
 * @class PostController
 * @desc Responsible for handling API requests for the /posts route.
 **/
@controller('/posts')
export default class PostController {
    constructor(@inject(PostService) private readonly postService: PostService) {}

    @httpPost('/', authMiddleware)
    public async create(req: Request, res: Response): Promise<Response> {
        const body = req.body.body
        const image = req.files?.image as UploadedFile
        const auth = req.auth

        const post = await this.postService.create({ body, image }, auth)

        return res.status(201).json(post)
    }

    @httpGet('/')
    public async getPosts(req: Request): Promise<ListResponse<Post>> {
        const page = Number(req.query.page || 1)
        const limit = Number(req.query.limit || 6)
        const authorId = req.query.authorId as string

        return await this.postService.getPosts({ authorId, page, limit }, req.auth)
    }

    @httpGet('/feed')
    public async getFeedPosts(req: Request): Promise<ListResponse<Post>> {
        const page = Number(req.query.page || 1)
        const limit = Number(req.query.limit || 6)

        return await this.postService.getFeedPosts({ page, limit }, req.auth)
    }

    @httpGet('/:id')
    public async getPostById(req: Request): Promise<Post> {
        return await this.postService.getPostById(req.params.id, req.auth)
    }

    @httpDelete('/:id', authMiddleware)
    public async delete(req: Request): Promise<Post> {
        return await this.postService.delete(req.params.id)
    }

    @httpPost('/:id/like', authMiddleware)
    public async like(req: Request): Promise<Post> {
        return await this.postService.like(req.params.id, req.auth)
    }

    @httpPost('/:id/unlike', authMiddleware)
    public async unlike(req: Request): Promise<Post> {
        return await this.postService.unlike(req.params.id, req.auth)
    }
}
