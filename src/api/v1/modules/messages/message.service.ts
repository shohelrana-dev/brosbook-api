import { appDataSource } from '@config/datasource.config'
import Conversation from '@entities/Conversation'
import { MediaSource } from '@entities/Media'
import Message from '@entities/Message'
import Reaction from '@entities/Reaction'
import User from '@entities/User'
import MediaService from '@services/media.service'
import { paginateMeta } from '@utils/paginateMeta'
import { Auth, ListQueryParams, MessagePayload, ReactionPayload } from '@utils/types'
import { inject, injectable } from 'inversify'
import isEmpty from 'is-empty'
import { BadRequestException, NotFoundException } from 'node-http-exceptions'
import { IsNull } from 'typeorm'

/**
 * @class MessageService
 * @desc Service for handling message related operations.
 */
@injectable()
export default class MessageService {
    public readonly conversationRepository = appDataSource.getRepository(Conversation)
    public readonly messageRepository = appDataSource.getRepository(Message)
    public readonly reactionRepository = appDataSource.getRepository(Reaction)

    constructor(
        @inject(MediaService)
        private readonly mediaService: MediaService
    ) {}

    public async getMessages(conversationId: string, params: ListQueryParams, auth: Auth) {
        if (!conversationId) throw new BadRequestException('ConversationId id is empty.')

        const page = params.page
        const limit = params.limit
        const skip = limit * (page - 1)

        const conversation = await this.conversationRepository.findOne({
            where: { id: conversationId },
            relations: ['user1', 'user2'],
        })

        if (!conversation) throw new NotFoundException('Conversation does not exists.')

        const [messages, count] = await this.messageRepository.findAndCount({
            where: { conversation: { id: conversationId } },
            order: { createdAt: 'desc' },
            take: limit,
            skip,
        })

        this.formatMessages(messages, conversation, auth)

        return { items: messages, ...paginateMeta(count, page, limit) }
    }

    public async sendMessage(conversationId: string, messageData: MessagePayload, auth: Auth) {
        if (!conversationId) throw new BadRequestException('ConversationId id is empty.')

        const { image, body, type } = messageData

        if (!body && !image) throw new BadRequestException('Message data is empty.')

        const conversation = await this.conversationRepository.findOne({
            where: { id: conversationId },
            relations: ['user1', 'user2'],
        })
        if (!conversation) throw new NotFoundException('Conversation does not exists.')

        const message = new Message()
        message.conversation = { id: conversation.id } as Conversation
        message.sender = auth.user as User
        message.type = type

        if (image) {
            message.image = await this.mediaService.save({
                file: image.data,
                creator: auth.user,
                source: MediaSource.CONVERSATION,
            })
        }
        if (body) {
            message.body = body
        }
        await this.messageRepository.save(message)

        conversation.lastMessage = { id: message.id } as Message
        await this.conversationRepository.save(conversation)

        this.formatMessage(message, conversation, auth)

        return message
    }

    public async sendReaction(reactionData: ReactionPayload, auth: Auth) {
        const { conversationId, messageId, name } = reactionData

        if (isEmpty(reactionData)) throw new BadRequestException('Reaction data is empty.')
        if (!messageId) throw new BadRequestException('messageId id is empty.')
        if (!conversationId) throw new BadRequestException('Conversation id is empty.')

        const reactionNames = ['like', 'love', 'angry', 'sad', 'smile', 'wow']

        if (!reactionNames.includes(name)) {
            throw new BadRequestException('Invalid reaction.')
        }

        const conversation = await this.conversationRepository.findOne({
            where: { id: conversationId },
            relations: ['user1', 'user2'],
        })
        if (!conversation) throw new NotFoundException('Conversation does not exists.')

        const message = await this.messageRepository.findOneBy({
            id: messageId,
            conversation: { id: conversationId },
        })
        if (!message) throw new NotFoundException('Message does not exists.')

        let reaction = await this.reactionRepository.findOneBy({
            sender: { id: auth.user.id },
            message: { id: message.id },
        })

        if (reaction) {
            reaction.name = name
        } else {
            reaction = new Reaction()
            reaction.name = name
            reaction.sender = auth.user as User
            reaction.message = message
        }

        await this.reactionRepository.save(reaction)
        message.reactions = await this.reactionRepository.findBy({ message: { id: messageId } })
        this.formatMessage(message, conversation, auth)

        return message
    }

    public async seenMessages(conversationId: string, auth: Auth) {
        if (!conversationId) throw new BadRequestException('Conversation id is empty.')

        const conversation = await this.conversationRepository.findOne({
            where: [
                { id: conversationId, user1: { id: auth.user.id } },
                { id: conversationId, user2: { id: auth.user.id } },
            ],
            relations: ['user1', 'user2', 'lastMessage'],
        })
        if (!conversation) throw new NotFoundException('Conversation does not exists.')

        const participant =
            conversation.user1.id !== auth.user.id ? conversation.user1 : conversation.user2

        const messages = await this.messageRepository.find({
            where: {
                conversation: { id: conversationId },
                sender: { id: participant.id },
                seenAt: IsNull(),
            },
            order: { createdAt: 'DESC' },
        })

        if (messages.length > 0) {
            for (const message of messages) {
                message.seenAt = new Date(Date.now())
                await this.messageRepository.save(message)
            }
        }

        this.formatMessages(messages, conversation, auth)

        return messages
    }

    public formatMessage(message: Message, conversation: Conversation, auth: Auth): Message {
        message.isMeSender = message.sender.id === auth.user.id
        if (conversation?.user1 && conversation?.user2) {
            message.recipient =
                message.sender.id !== conversation.user1.id ? conversation.user1 : conversation.user2
            message.conversation = conversation
        }

        return message
    }

    public formatMessages(messages: Message[], conversation: Conversation, auth: Auth): Message[] {
        for (const message of messages) {
            this.formatMessage(message, conversation, auth)
        }

        return messages
    }
}
