import { appDataSource } from '@config/datasource.config'
import Conversation from '@entities/Conversation'
import Media from '@entities/Media'
import Message from '@entities/Message'
import User from '@entities/User'
import UserService from '@modules/users/user.service'
import MediaService from '@services/media.service'
import { paginateMeta } from '@utils/paginateMeta'
import { Auth, ListQueryParams, ListResponse } from '@utils/types'
import { inject, injectable } from 'inversify'
import { BadRequestException, NotFoundException } from 'node-http-exceptions'

@injectable()
export default class ConversationService {
    private readonly userRepository = appDataSource.getRepository(User)
    private readonly conversationRepository = appDataSource.getRepository(Conversation)
    private readonly messageRepository = appDataSource.getRepository(Message)

    constructor(
        @inject(UserService)
        private readonly userService: UserService,
        @inject(MediaService)
        private readonly mediaService: MediaService
    ) {}

    public async createConversation(participantId: string, auth: Auth): Promise<Conversation> {
        if (!participantId) throw new BadRequestException('Participant id is empty.')

        const user = await this.userRepository.findOneBy({ id: auth.user.id })
        const participant = await this.userRepository.findOneBy({ id: participantId })

        if (!participant) throw new NotFoundException('Participant user does not exists.')

        const findConversation = await this.conversationRepository.findOneBy([
            { user1: { id: user.id }, user2: { id: participant.id } },
            { user1: { id: participant.id }, user2: { id: user.id } },
        ])

        if (findConversation) throw new NotFoundException('Conversation already exists.')

        const conversation = new Conversation()
        conversation.user1 = user
        conversation.user2 = participant
        await this.conversationRepository.save(conversation)

        return conversation
    }

    public async getConversationById(conversationId: string, auth: Auth): Promise<Conversation> {
        if (!conversationId) throw new BadRequestException('Conversation id is empty.')

        const conversation = await this.conversationRepository
            .createQueryBuilder('conversation')
            .leftJoinAndSelect('conversation.user1', 'user1')
            .leftJoinAndSelect('conversation.user2', 'user2')
            .leftJoinAndSelect('user1.avatar', 'user1Avatar')
            .leftJoinAndSelect('user2.avatar', 'user2Avatar')
            .leftJoinAndSelect('user1.profile', 'user1Profile')
            .leftJoinAndSelect('user2.profile', 'user2Profile')
            .leftJoinAndSelect('conversation.lastMessage', 'lastMessage')
            .leftJoinAndSelect('lastMessage.image', 'lastMessageImage')
            .leftJoinAndSelect('lastMessage.sender', 'lastMessageSender')
            .where('conversation.id = :conversationId', { conversationId })
            .getOne()

        if (!conversation) throw new NotFoundException('Conversation does not exists.')

        return await this.formatConversation(conversation, auth)
    }

    public async getConversationByParticipantId(
        participantId: string,
        auth: Auth
    ): Promise<Conversation> {
        if (!participantId) throw new BadRequestException('Participant id is empty.')

        const participant = await this.userRepository.findOneBy({ id: participantId })
        if (!participant) throw new NotFoundException('Participant  does not exists.')

        const conversation = await this.conversationRepository.findOne({
            where: [
                { user1: { id: auth.user.id }, user2: { id: participantId } },
                { user1: { id: participantId }, user2: { id: auth.user.id } },
            ],
            relations: ['user1', 'user2', 'lastMessage'],
        })

        if (!conversation) throw new NotFoundException('Conversation  not found.')

        return await this.formatConversation(conversation, auth)
    }

    public async getConversations(
        { page, limit }: ListQueryParams,
        auth: Auth
    ): Promise<ListResponse<Conversation>> {
        const skip = limit * (page - 1)
        //.addSelect('COUNT(CASE WHEN message.seenAt IS NULL AND messageSender.id != :userId THEN 1 END)', 'unreadCount')

        const [conversations, count] = await this.conversationRepository
            .createQueryBuilder('conversation')
            .setParameter('currentUserId', auth.user.id)
            .leftJoinAndSelect('conversation.user1', 'user1')
            .leftJoinAndSelect('conversation.user2', 'user2')
            .leftJoinAndSelect('user1.avatar', 'avatar1')
            .leftJoinAndSelect('user2.avatar', 'avatar2')
            .leftJoinAndSelect('conversation.lastMessage', 'lastMessage')
            .leftJoinAndSelect('lastMessage.image', 'lastMessageImage')
            .leftJoinAndSelect('lastMessage.sender', 'lastMessageSender')
            .where('(user1.id = :currentUserId OR user2.id = :currentUserId)')
            .orderBy('conversation.updatedAt', 'DESC')
            .take(limit)
            .skip(skip)
            .getManyAndCount()

        await this.formatConversations(conversations, auth)

        return { items: conversations, ...paginateMeta(count, page, limit) }
    }

    public async getUnreadConversationsCount(userId: string): Promise<number> {
        return await this.conversationRepository
            .createQueryBuilder('conversation')
            .setParameter('userId', userId)
            .innerJoin('conversation.user1', 'user1')
            .innerJoin('conversation.user2', 'user2')
            .innerJoin('conversation.lastMessage', 'lastMessage')
            .innerJoin('lastMessage.sender', 'lastMessageSender')
            .where('lastMessage.seenAt IS NULL')
            .andWhere('lastMessageSender.id != :userId')
            .andWhere('(user1.id = :userId OR user2.id = :userId)')
            .groupBy('conversation.id')
            .getCount()
    }

    public async getConversationUnreadMessagesCount(
        conversationId: string,
        auth: Auth
    ): Promise<number> {
        return await this.messageRepository
            .createQueryBuilder('message')
            .innerJoin('message.conversation', 'conversation')
            .innerJoin('message.sender', 'sender')
            .where('conversation.id = :conversationId', { conversationId })
            .andWhere('sender.id != :senderId', { senderId: auth.user.id })
            .andWhere('message.seenAt IS NULL')
            .groupBy('message.id')
            .getCount()
    }

    public async getConversationMedia(
        conversationId: string,
        params: ListQueryParams
    ): Promise<ListResponse<Media>> {
        if (!conversationId) throw new BadRequestException('Conversation id is empty.')

        const page = params.page
        const limit = params.limit
        const skip = limit * (page - 1)

        const conversation = await this.conversationRepository.findOne({
            where: { id: conversationId },
            relations: ['user1', 'user2'],
        })
        if (!conversation) throw new NotFoundException('Conversation does not exists.')

        const [messages, count] = await this.messageRepository
            .createQueryBuilder('message')
            .leftJoinAndSelect('message.image', 'image')
            .where('message.conversationId = :conversationId', { conversationId })
            .andWhere('image.id IS NOT NULL')
            .orderBy('image.createdAt', 'DESC')
            .take(limit)
            .skip(skip)
            .getManyAndCount()

        const mediaList = messages.map((msg) => msg.image)

        return { items: mediaList, ...paginateMeta(count, page, limit) }
    }

    public async formatConversation(conversation: Conversation, auth: Auth): Promise<Conversation> {
        if (conversation.user1.id === auth.user.id) {
            conversation.participant = conversation.user2
        } else {
            conversation.participant = conversation.user1
        }

        conversation.unreadMessagesCount = await this.getConversationUnreadMessagesCount(
            conversation.id,
            auth
        )

        return conversation
    }

    public async formatConversations(
        conversations: Conversation[],
        auth: Auth
    ): Promise<Conversation[]> {
        for (const conversation of conversations) {
            await this.formatConversation(conversation, auth)
        }

        return conversations
    }
}
