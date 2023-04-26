import ConversationService from "./conversation.service"
import { Request, Response } from "express"
import { UploadedFile } from "express-fileupload"
import { controller, httpGet, httpPost } from "inversify-express-utils"
import { inject } from "inversify"
import authMiddleware from "@middleware/auth.middleware"
import Conversation from "@entities/Conversation"
import { ListResponse } from "@interfaces/index.interfaces"
import Message from "@entities/Message"
import Media from "@entities/Media"
import message from "@entities/Message"

/**
 * @class ConversationController
 * @desc Responsible for handling API requests for the
 * /conversations route.
 **/
@controller( '/conversations', authMiddleware )
export default class ConversationController {
    constructor(
        @inject( ConversationService )
        private readonly conversationService: ConversationService
    ){}

    @httpPost( '/' )
    public async createConversation( req: Request, res: Response ): Promise<Response<Conversation>>{
        const conversation = await this.conversationService.createConversation( req.body.participantId, req.auth )

        return res.status( 201 ).json( conversation )
    }

    @httpGet( '/' )
    public async getConversations( req: Request ): Promise<ListResponse<Conversation>>{
        const page  = Number( req.query.page || 1 )
        const limit = Number( req.query.limit || 12 )

        return await this.conversationService.getConversations( { page, limit }, req.auth )
    }

    @httpGet( '/unread_count' )
    public async getUnreadConversationsCount( req: Request ): Promise<{ count: number }>{
        const count = await this.conversationService.getUnreadConversationsCount( req.auth.user.id )

        return { count }
    }

    @httpGet( '/:id' )
    public async getConversationById( req: Request ): Promise<Conversation>{
        return await this.conversationService.getConversationById( req.params.id, req.auth )
    }

    @httpGet( '/by/participant_id/:id' )
    public async getConversationByParticipantIdOrCreate( req: Request ): Promise<Conversation>{
        return await this.conversationService.getConversationByParticipantIdOrCreate( req.params.id, req.auth )
    }

    @httpGet( '/:conversationId/messages' )
    public async getMessages( req: Request ): Promise<ListResponse<Message>>{
        const page  = Number( req.query.page || 1 )
        const limit = Number( req.query.limit || 15 )

        return await this.conversationService.getMessages( req.params.conversationId, { page, limit }, req.auth )
    }

    @httpPost( '/:conversationId/messages' )
    public async sendMessage( req: Request, res: Response ): Promise<Response<Message>>{
        const conversationId = req.params.conversationId
        const body           = req.body.body
        const image          = req.files?.image as UploadedFile
        const type           = req.body.type

        const message = await this.conversationService.sendMessage( conversationId, {
            body,
            image,
            type
        }, req.auth )

        return res.status( 201 ).json( message )
    }

    @httpPost( '/:conversationId/messages/seen_all' )
    public async seenAllMessages( req: Request ): Promise<{ message: string }>{
        await this.conversationService.seenAllMessages( req.params.conversationId, req.auth )

        return { message: 'success' }
    }

    @httpGet( '/:conversationId/media' )
    public async getConversationMedia( req: Request ): Promise<ListResponse<Media>>{
        const conversationId = req.params.conversationId
        const page           = Number( req.query.page || 1 )
        const limit          = Number( req.query.limit || 16 )

        return await this.conversationService.getConversationMedia( conversationId, { page, limit } )
    }

    @httpPost( '/:conversationId/messages/:messageId/reactions' )
    public async sendReaction( req: Request, res: Response ): Promise<message>{
        const messageId = req.params.messageId
        const name      = req.body.name

        return await this.conversationService.sendReaction( { messageId, name }, req.auth )
    }
}