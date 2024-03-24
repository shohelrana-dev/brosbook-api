import Conversation from '@entities/Conversation'
import Media from '@entities/Media'
import authMiddleware from '@middleware/auth.middleware'
import { ListResponse } from '@utils/types'
import { Request, Response } from 'express'
import { inject } from 'inversify'
import { controller, httpGet, httpPost } from 'inversify-express-utils'
import ConversationService from './conversation.service'

/**
 * @class ConversationController
 * @desc Responsible for handling API requests for the /conversations route.
 **/
@controller('/conversations', authMiddleware)
export default class ConversationController {
    constructor(
        @inject(ConversationService)
        private readonly conversationService: ConversationService
    ) {}

    @httpPost('/')
    public async createConversation(req: Request, res: Response): Promise<Response<Conversation>> {
        const conversation = await this.conversationService.createConversation(
            req.body.participantId,
            req.auth
        )

        return res.status(201).json(conversation)
    }

    @httpGet('/')
    public async getConversations(req: Request): Promise<ListResponse<Conversation>> {
        const page = Number(req.query.page || 1)
        const limit = Number(req.query.limit || 12)

        return await this.conversationService.getConversations({ page, limit }, req.auth)
    }

    @httpGet('/unread_count')
    public async getUnreadConversationsCount(req: Request): Promise<{ count: number }> {
        const count = await this.conversationService.getUnreadConversationsCount(req.auth.user.id)

        return { count }
    }

    @httpGet('/:id')
    public async getConversationById(req: Request): Promise<Conversation> {
        return await this.conversationService.getConversationById(req.params.id, req.auth)
    }

    @httpGet('/by/participant_id/:id')
    public async getConversationByParticipantId(req: Request): Promise<Conversation> {
        return await this.conversationService.getConversationByParticipantId(req.params.id, req.auth)
    }

    @httpGet('/:conversationId/media')
    public async getConversationMedia(req: Request): Promise<ListResponse<Media>> {
        const conversationId = req.params.conversationId
        const page = Number(req.query.page || 1)
        const limit = Number(req.query.limit || 16)

        return await this.conversationService.getConversationMedia(conversationId, { page, limit })
    }
}
