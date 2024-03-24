import { default as Message, default as message } from '@entities/Message'
import authMiddleware from '@middleware/auth.middleware'
import ConversationService from '@modules/conversations/conversation.service'
import SocketService from '@services/socket.service'
import { ListResponse } from '@utils/types'
import { Request, Response } from 'express'
import { UploadedFile } from 'express-fileupload'
import { inject } from 'inversify'
import { controller, httpGet, httpPost } from 'inversify-express-utils'
import MessageService from './message.service'

/**
 * @class MessageController
 * @desc Responsible for handling API requests for the /conversations/:conversationId/messages route.
 **/
@controller('/conversations/:conversationId/messages', authMiddleware)
export default class MessageController {
    constructor(
        @inject(MessageService)
        private readonly messageService: MessageService,
        @inject(ConversationService)
        private readonly conversationService: ConversationService
    ) {}

    @httpGet('/')
    public async getMessages(req: Request): Promise<ListResponse<Message>> {
        const page = Number(req.query.page || 1)
        const limit = Number(req.query.limit || 15)

        return await this.messageService.getMessages(
            req.params.conversationId,
            { page, limit },
            req.auth
        )
    }

    @httpPost('/')
    public async sendMessage(req: Request, res: Response): Promise<Response<Message>> {
        const conversationId = req.params.conversationId
        const body = req.body.body
        const image = req.files?.image as UploadedFile
        const type = req.body.type

        const message = await this.messageService.sendMessage(
            conversationId,
            {
                body,
                image,
                type,
            },
            req.auth
        )

        SocketService.emit('message.new', message)

        this.conversationService
            .getUnreadConversationsCount(message.recipient.id)
            .then((count) => {
                if (count > 0) {
                    SocketService.emit(`conversation.unread.count.${message.recipient.id}`, count)
                }
            })
            .then((e) => console.log(e))

        return res.status(201).json(message)
    }

    @httpPost('/seen')
    public async seenMessages(req: Request): Promise<Message[]> {
        const user = req.auth.user
        const messages = await this.messageService.seenMessages(req.params.conversationId, req.auth)

        const lastMessage = messages.length > 0 ? messages[0] : null

        if (lastMessage) {
            SocketService.emit(`message.seen`, lastMessage)
            SocketService.emit(
                `conversation.unread.count.${user.id}`,
                await this.conversationService.getUnreadConversationsCount(user.id)
            )
            SocketService.emit(`message.seen`, lastMessage)
        }
        return messages
    }

    @httpPost('/:messageId/reactions')
    public async sendReaction(req: Request): Promise<message> {
        const conversationId = req.params.conversationId
        const messageId = req.params.messageId
        const name = req.body.name

        const message = await this.messageService.sendReaction(
            { conversationId, messageId, name },
            req.auth
        )

        SocketService.emit(`message.update`, message)

        return message
    }
}
