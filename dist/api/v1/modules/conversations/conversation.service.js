"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const Conversation_1 = tslib_1.__importDefault(require("../../entities/Conversation"));
const BadRequestException_1 = tslib_1.__importDefault(require("../../exceptions/BadRequestException"));
const NotFoundException_1 = tslib_1.__importDefault(require("../../exceptions/NotFoundException"));
const data_source_1 = require("../../../../config/data-source");
const user_service_1 = tslib_1.__importDefault(require("../users/user.service"));
const Message_1 = tslib_1.__importDefault(require("../../entities/Message"));
const is_empty_1 = tslib_1.__importDefault(require("is-empty"));
const express_1 = require("../../../../config/express");
const Reaction_1 = tslib_1.__importDefault(require("../../entities/Reaction"));
const paginateMeta_1 = require("../../utils/paginateMeta");
const media_service_1 = tslib_1.__importDefault(require("../../services/media.service"));
const Media_1 = require("../../entities/Media");
class ConversationService {
    constructor() {
        this.repository = data_source_1.appDataSource.getRepository(Conversation_1.default);
        this.messageRepository = data_source_1.appDataSource.getRepository(Message_1.default);
        this.reactionRepository = data_source_1.appDataSource.getRepository(Reaction_1.default);
        this.userService = new user_service_1.default();
        this.mediaService = new media_service_1.default();
    }
    async createConversation(participantId, auth) {
        if (!participantId)
            throw new BadRequestException_1.default('Participant id is empty.');
        const user = await this.userService.repository.findOneBy({ id: auth.user.id });
        const participant = await this.userService.repository.findOneBy({ id: participantId });
        if (!participant)
            throw new NotFoundException_1.default('Participant user doesn\'t exists.');
        const findConversation = await this.repository.findOneBy([
            { user1: { id: user.id }, user2: { id: participant.id } },
            { user1: { id: participant.id }, user2: { id: user.id } }
        ]);
        if (findConversation)
            throw new NotFoundException_1.default('Conversation already exists.');
        const conversation = new Conversation_1.default();
        conversation.user1 = user;
        conversation.user2 = participant;
        await this.repository.save(conversation);
        return conversation;
    }
    async getConversationById(conversationId, auth) {
        if (!conversationId)
            throw new BadRequestException_1.default('Conversation id is empty.');
        const conversation = await this.repository
            .createQueryBuilder('conversation')
            .leftJoinAndSelect('conversation.user1', 'user1')
            .leftJoinAndSelect('conversation.user2', 'user2')
            .leftJoinAndSelect('user1.avatar', 'user1Avatar')
            .leftJoinAndSelect('user2.avatar', 'user2Avatar')
            .leftJoinAndSelect('user1.profile', 'user1Profile')
            .leftJoinAndSelect('user2.profile', 'user2Profile')
            .where('conversation.id = :conversationId', { conversationId })
            .getOne();
        if (!conversation)
            throw new NotFoundException_1.default('Conversation doesn\'t exists.');
        return this.formatConversation(conversation, auth);
    }
    async getConversationByParticipantIdOrCreate(participantId, auth) {
        if (!participantId)
            throw new BadRequestException_1.default('Participant id is empty.');
        const participant = await this.userService.repository.findOneBy({ id: participantId });
        if (!participant)
            throw new NotFoundException_1.default('Participant  doesn\'t exists.');
        const conversation = await this.repository.findOneBy([
            { user1: { id: auth.user.id }, user2: { id: participantId } },
            { user1: { id: participantId }, user2: { id: auth.user.id } }
        ]);
        if (conversation)
            return conversation;
        const newConversation = new Conversation_1.default();
        newConversation.user1 = auth.user;
        newConversation.user2 = participant;
        await this.repository.save(newConversation);
        return this.formatConversation(conversation, auth);
    }
    async getConversations(params, auth) {
        const page = params.page || 1;
        const limit = params.limit || 12;
        const skip = limit * (page - 1);
        const [conversations, count] = await this.repository.findAndCount({
            relations: { user1: true, user2: true, lastMessage: true },
            where: [
                { user1: { id: auth.user.id } },
                { user2: { id: auth.user.id } }
            ],
            order: { updatedAt: "DESC" },
            take: limit,
            skip
        });
        const formatConversations = conversations.map(conversation => this.formatConversation(conversation, auth));
        return Object.assign({ items: formatConversations }, (0, paginateMeta_1.paginateMeta)(count, page, limit));
    }
    async getMessages(conversationId, params, auth) {
        if (!conversationId)
            throw new BadRequestException_1.default('ConversationId id is empty.');
        const page = params.page || 1;
        const limit = params.limit || 12;
        const skip = limit * (page - 1);
        const conversation = await this.repository.findOneBy({ id: conversationId });
        if (!conversation)
            throw new NotFoundException_1.default('Conversation doesn\'t exists.');
        const [messages, count] = await this.messageRepository.findAndCount({
            where: { conversation: { id: conversationId } },
            order: { createdAt: "desc" },
            take: limit,
            skip
        });
        const formattedMessages = messages.map(msg => this.formatMessage(msg, auth));
        return Object.assign({ items: formattedMessages }, (0, paginateMeta_1.paginateMeta)(count, page, limit));
    }
    async sendMessage(conversationId, messageData, auth) {
        if (!conversationId)
            throw new BadRequestException_1.default('ConversationId id is empty.');
        const { image, body, type } = messageData;
        if (!body && !image)
            throw new BadRequestException_1.default('Message data is empty.');
        const conversation = await this.repository.findOneBy({ id: conversationId });
        if (!conversation)
            throw new NotFoundException_1.default('Conversation doesn\'t exists.');
        const sender = await this.userService.repository.findOneBy({ id: auth.user.id });
        const message = new Message_1.default();
        message.conversation = conversation;
        message.sender = sender;
        message.type = type;
        if (image) {
            message.image = await this.mediaService.save({
                file: image.data,
                creatorId: sender.id,
                source: Media_1.MediaSource.CONVERSATION
            });
        }
        else {
            message.body = body;
        }
        await this.messageRepository.save(message);
        conversation.lastMessageId = message.id;
        await this.repository.save(conversation);
        express_1.io.emit(`new_message_${conversation.id}`, message);
        return message;
    }
    async sendReaction(reactionData, auth) {
        const { messageId, name } = reactionData;
        if ((0, is_empty_1.default)(reactionData))
            throw new BadRequestException_1.default('Reaction data is empty.');
        if (!messageId)
            throw new BadRequestException_1.default('messageId id is empty.');
        const reactionNames = ["like", "love", "angry", "sad", "smile", "wow"];
        if (!reactionNames.includes(name)) {
            throw new BadRequestException_1.default('Invalid reaction.');
        }
        const message = await this.messageRepository.findOneBy({ id: messageId });
        if (!message)
            throw new NotFoundException_1.default('Message doesn\'t exists.');
        let reaction = await this.reactionRepository.findOneBy({
            sender: { id: auth.user.id },
            messageId,
        });
        if (reaction) {
            reaction.name = name;
            reaction.url = `${process.env.SERVER_URL}/reactions/${name}.png`;
        }
        else {
            reaction = new Reaction_1.default();
            reaction.name = name;
            reaction.url = `${process.env.SERVER_URL}/reactions/${name}.png`;
            reaction.sender = auth.user;
            reaction.messageId = message.id;
        }
        await this.reactionRepository.save(reaction);
        message.reactions = await this.reactionRepository.findBy({ messageId });
        express_1.io.emit(`new_reaction_${message.conversation.id}`, message);
        return message;
    }
    async getConversationMedia(conversationId, params) {
        if (!conversationId)
            throw new BadRequestException_1.default('ConversationId id is empty.');
        const page = params.page || 1;
        const limit = params.limit || 12;
        const skip = limit * (page - 1);
        const conversation = await this.repository.findOne({
            where: { id: conversationId },
            relations: { user1: true, user2: true }
        });
        if (!conversation)
            throw new NotFoundException_1.default('Conversation doesn\'t exists.');
        const [messages, count] = await this.messageRepository
            .createQueryBuilder('message')
            .leftJoinAndSelect('message.image', 'image')
            .where('message.conversationId = :conversationId', { conversationId })
            .andWhere('image.id IS NOT NULL')
            .take(limit)
            .skip(skip)
            .getManyAndCount();
        const mediaList = messages.map(msg => msg.image);
        return Object.assign({ items: mediaList }, (0, paginateMeta_1.paginateMeta)(count, page, limit));
    }
    formatConversation(conversation, auth) {
        if (conversation.user1.id === auth.user.id) {
            conversation.participant = conversation.user2;
        }
        else {
            conversation.participant = conversation.user1;
        }
        return conversation;
    }
    formatMessage(message, auth) {
        if (message.sender.id === auth.user.id) {
            message.isMeSender = true;
        }
        else {
            message.isMeSender = false;
        }
        return message;
    }
}
exports.default = ConversationService;
//# sourceMappingURL=conversation.service.js.map