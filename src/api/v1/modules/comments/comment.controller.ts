import Comment from '@entities/Comment'
import authMiddleware from '@middleware/auth.middleware'
import { ListResponse } from '@utils/types'
import { Request, Response } from 'express'
import { inject } from 'inversify'
import { controller, httpDelete, httpGet, httpPost } from 'inversify-express-utils'
import CommentService from './comment.service'

/**
 * @class CommentController
 * @desc Responsible for handling API requests for the /posts/:postId/comments route.
 **/
@controller('/posts/:postId/comments')
export default class CommentController {
    constructor(
        @inject(CommentService)
        private readonly commentService: CommentService
    ) {}

    @httpGet('/')
    public async getComments(req: Request): Promise<ListResponse<Comment>> {
        const page = Number(req.query.page || 1)
        const limit = Number(req.query.limit || 5)

        return await this.commentService.getComments(req.params.postId, { page, limit }, req.auth)
    }

    @httpPost('/', authMiddleware)
    public async create(req: Request, res: Response): Promise<Response> {
        const comment = await this.commentService.create(
            {
                postId: req.params.postId,
                body: req.body.body,
            },
            req.auth
        )

        return res.status(201).json(comment)
    }

    @httpDelete('/:id', authMiddleware)
    public async delete(req: Request): Promise<Comment> {
        return await this.commentService.delete(req.params.id, req.auth)
    }

    @httpPost('/:id/like', authMiddleware)
    public async like(req: Request): Promise<Comment> {
        return await this.commentService.like(req.params.id, req.auth)
    }

    @httpPost('/:id/unlike', authMiddleware)
    public async unlike(req: Request): Promise<Comment> {
        return await this.commentService.unlike(req.params.id, req.auth)
    }
}
