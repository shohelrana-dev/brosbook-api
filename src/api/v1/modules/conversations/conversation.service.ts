import { Auth, ListQueryParams, ListResponse } from "@interfaces/index.interfaces"
import Conversation from "@entities/Conversation"
import conversation from "@entities/Conversation"
import BadRequestException from "@exceptions/BadRequestException"
import NotFoundException from "@exceptions/NotFoundException"
import { appDataSource } from "@config/data-source"
import UserService from "@modules/users/user.service"
import Message, { MessageType } from "@entities/Message"
import { UploadedFile } from "express-fileupload"
import isEmpty from "is-empty"
import { io } from "@config/express"
import Reaction from "@entities/Reaction"
import User from "@entities/User"
import { paginateMeta } from "@utils/paginateMeta"
import MediaService from "@services/media.service"
import Media, { MediaSource } from "@entities/Media"
import { Brackets, IsNull } from "typeorm"
import message from "@entities/Message"

export default class ConversationService {
    public readonly repository         = appDataSource.getRepository( Conversation )
    public readonly messageRepository  = appDataSource.getRepository( Message )
    public readonly reactionRepository = appDataSource.getRepository( Reaction )
    public readonly userService        = new UserService()
    public readonly mediaService       = new MediaService()

    public async createConversation( participantId: string, auth: Auth ): Promise<Conversation>{
        if( ! participantId ) throw new BadRequestException( 'Participant id is empty.' )

        const user        = await this.userService.repository.findOneBy( { id: auth.user.id } )
        const participant = await this.userService.repository.findOneBy( { id: participantId } )

        if( ! participant ) throw new NotFoundException( 'Participant user doesn\'t exists.' )

        const findConversation = await this.repository.findOneBy( [
            { user1: { id: user.id }, user2: { id: participant.id } },
            { user1: { id: participant.id }, user2: { id: user.id } }
        ] )

        if( findConversation ) throw new NotFoundException( 'Conversation already exists.' )

        const conversation = new Conversation()
        conversation.user1 = user
        conversation.user2 = participant
        await this.repository.save( conversation )

        return conversation
    }

    public async getConversationById( conversationId: string, auth: Auth ): Promise<Conversation>{
        if( ! conversationId ) throw new BadRequestException( 'Conversation id is empty.' )

        const conversation = await this.repository
            .createQueryBuilder( 'conversation' )
            .leftJoinAndSelect( 'conversation.user1', 'user1' )
            .leftJoinAndSelect( 'conversation.user2', 'user2' )
            .leftJoinAndSelect( 'user1.avatar', 'user1Avatar' )
            .leftJoinAndSelect( 'user2.avatar', 'user2Avatar' )
            .leftJoinAndSelect( 'user1.profile', 'user1Profile' )
            .leftJoinAndSelect( 'user2.profile', 'user2Profile' )
            .where( 'conversation.id = :conversationId', { conversationId } )
            .getOne()

        if( ! conversation ) throw new NotFoundException( 'Conversation doesn\'t exists.' )


        return this.formatConversation( conversation, auth )
    }

    public async getConversationByParticipantIdOrCreate( participantId: string, auth: Auth ): Promise<Conversation>{
        if( ! participantId ) throw new BadRequestException( 'Participant id is empty.' )

        const participant = await this.userService.repository.findOneBy( { id: participantId } )
        if( ! participant ) throw new NotFoundException( 'Participant  doesn\'t exists.' )

        const conversation = await this.repository.findOneBy( [
            { user1: { id: auth.user.id }, user2: { id: participantId } },
            { user1: { id: participantId }, user2: { id: auth.user.id } }
        ] )

        if( conversation ) return conversation

        const newConversation = new Conversation()
        newConversation.user1 = auth.user as User
        newConversation.user2 = participant
        await this.repository.save( newConversation )

        return this.formatConversation( conversation, auth )
    }

    public async getConversations( params: ListQueryParams, auth: Auth ): Promise<ListResponse<Conversation>>{
        const page  = params.page || 1
        const limit = params.limit || 12
        const skip  = limit * ( page - 1 )

        const [conversations, count] = await this.repository.findAndCount( {
            relations: { user1: true, user2: true, lastMessage: true },
            where: [
                { user1: { id: auth.user.id } },
                { user2: { id: auth.user.id } }
            ],
            order: { updatedAt: "DESC" },
            take: limit,
            skip
        } )

        const formatConversations = conversations.map( conversation => this.formatConversation( conversation, auth ) )

        return { items: formatConversations, ...paginateMeta( count, page, limit ) }
    }

    public async getUnreadConversationsCount( userId: string ): Promise<number>{
        return await this.repository.createQueryBuilder( 'conversation' )
            .innerJoin( "conversation.user1", "user1" )
            .innerJoin( "conversation.user2", "user2" )
            .innerJoin( "conversation.lastMessage", "lastMessage" )
            .innerJoin( "lastMessage.sender", "lastMessageSender" )
            .where( "lastMessage.seenAt IS NULL" )
            .andWhere( "lastMessageSender.id != :userId", { userId } )
            .andWhere( new Brackets( qb => {
                qb.where( 'user1.id = :userId', { userId } )
                qb.orWhere( 'user2.id = :userId', { userId } )
            } ) )
            .groupBy( 'conversation.id' )
            .getCount()
    }

    public async getMessages( conversationId: string, params: ListQueryParams, auth: Auth ): Promise<ListResponse<Message>>{
        if( ! conversationId ) throw new BadRequestException( 'ConversationId id is empty.' )

        const page  = params.page || 1
        const limit = params.limit || 12
        const skip  = limit * ( page - 1 )

        const conversation = await this.repository.findOneBy( { id: conversationId } )

        if( ! conversation ) throw new NotFoundException( 'Conversation doesn\'t exists.' )

        const [messages, count] = await this.messageRepository.findAndCount( {
            where: { conversation: { id: conversationId } },
            order: { createdAt: "desc" },
            take: limit,
            skip
        } )

        const formattedMessages = messages.map( msg => this.formatMessage( msg, auth ) )

        return { items: formattedMessages, ...paginateMeta( count, page, limit ) }
    }

    public async sendMessage( conversationId: string, messageData: { image: UploadedFile, body: string, type: MessageType }, auth: Auth ): Promise<Message>{
        if( ! conversationId ) throw new BadRequestException( 'ConversationId id is empty.' )

        const { image, body, type } = messageData

        if( ! body && ! image ) throw new BadRequestException( 'Message data is empty.' )

        const conversation = await this.repository.findOne( {
            where: { id: conversationId },
            relations: ['user1', 'user2']
        } )
        if( ! conversation ) throw new NotFoundException( 'Conversation doesn\'t exists.' )

        const sender    = await this.userService.repository.findOneBy( { id: auth.user.id } )
        const recipient = sender.id === conversation.user1.id ? conversation.user2 : conversation.user1

        const message        = new Message()
        message.conversation = { id: conversation.id } as Conversation
        message.sender       = sender
        message.type         = type

        if( image ){
            message.image = await this.mediaService.save( {
                file: image.data,
                creator: sender,
                source: MediaSource.CONVERSATION
            } )
        } else{
            message.body = body
        }
        await this.messageRepository.save( message )

        io.emit( `message.new.${ conversation.id }`, message )

        conversation.lastMessage = { id: message.id } as Message
        await this.repository.save( conversation )

        this.getUnreadConversationsCount( recipient.id ).then( ( count ) => {
            if( count > 0 ){
                io.emit( `conversation.unread.count.${ recipient.id }`, count )
            }
        } )

        return message
    }

    public async sendReaction( reactionData: { messageId: string, name: string }, auth: Auth ): Promise<Message>{
        const { messageId, name } = reactionData

        if( isEmpty( reactionData ) ) throw new BadRequestException( 'Reaction data is empty.' )
        if( ! messageId ) throw new BadRequestException( 'messageId id is empty.' )

        const reactionNames = ["like", "love", "angry", "sad", "smile", "wow"]

        if( ! reactionNames.includes( name ) ){
            throw new BadRequestException( 'Invalid reaction.' )
        }

        const message = await this.messageRepository.findOneBy( { id: messageId } )
        if( ! message ) throw new NotFoundException( 'Message doesn\'t exists.' )

        let reaction = await this.reactionRepository.findOneBy( {
            sender: { id: auth.user.id },
            message: { id: message.id },
        } )

        if( reaction ){
            reaction.name = name
        } else{
            reaction         = new Reaction()
            reaction.name    = name
            reaction.sender  = auth.user as User
            reaction.message = message
        }
        await this.reactionRepository.save( reaction )

        message.reactions = await this.reactionRepository.findBy( { message: { id: messageId } } )

        io.emit( `message.update.${ message.conversation.id }`, message )

        return message
    }

    public async seenAllMessages( conversationId: string, auth: Auth ): Promise<void>{
        if( ! conversationId ) throw new BadRequestException( 'Conversation id is empty.' )

        const conversation = await this.repository.findOne( {
            where: [
                { id: conversationId, user1: { id: auth.user.id } },
                { id: conversationId, user2: { id: auth.user.id } }
            ],
            relations: ["user1", "user2", "lastMessage"]
        } )
        if( ! conversation ) throw new NotFoundException( 'Conversation doesn\'t exists.' )

        const participant = conversation.user1.id === auth.user.id ? conversation.user2 : conversation.user1

        const messages = await this.messageRepository.findBy( {
            conversation: { id: conversationId },
            sender: { id: participant.id },
            seenAt: IsNull()
        } )

        if( messages.length > 0 ){
            await this.messageRepository.update( {
                conversation: { id: conversationId },
                sender: { id: participant.id }
            }, {
                seenAt: new Date( Date.now() )
            } )

            io.emit( `conversation.unread.count.${ auth.user.id }`, await this.getUnreadConversationsCount( auth.user.id ) )


            const message = await this.messageRepository.findOneBy( { id: conversation.lastMessage.id } )
            io.emit( `message.seen.${ conversation.id }`, message )
        }

    }

    public async getConversationMedia( conversationId: string, params: ListQueryParams ): Promise<ListResponse<Media>>{
        if( ! conversationId ) throw new BadRequestException( 'Conversation id is empty.' )

        const page  = params.page || 1
        const limit = params.limit || 12
        const skip  = limit * ( page - 1 )

        const conversation = await this.repository.findOne( {
            where: { id: conversationId },
            relations: { user1: true, user2: true }
        } )
        if( ! conversation ) throw new NotFoundException( 'Conversation doesn\'t exists.' )

        const [messages, count] = await this.messageRepository
            .createQueryBuilder( 'message' )
            .leftJoinAndSelect( 'message.image', 'image' )
            .where( 'message.conversationId = :conversationId', { conversationId } )
            .andWhere( 'image.id IS NOT NULL' )
            .take( limit )
            .skip( skip )
            .getManyAndCount()

        const mediaList = messages.map( msg => msg.image )

        return { items: mediaList, ...paginateMeta( count, page, limit ) }
    }

    public formatConversation( conversation: Conversation, auth: Auth ): Conversation{
        if( conversation.user1.id === auth.user.id ){
            conversation.participant = conversation.user2
        } else{
            conversation.participant = conversation.user1
        }
        return conversation
    }

    public formatMessage( message: Message, auth: Auth ): Message{
        message.isMeSender = message.sender.id === auth.user.id

        return message
    }
}