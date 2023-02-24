"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ConversationController {
    constructor(conversationService) {
        this.conversationService = conversationService;
        this.createConversation = async (req, res, next) => {
            try {
                const conversation = await this.conversationService.createConversation(req.body.participantId, req.auth);
                res.json(conversation);
            }
            catch (err) {
                next(err);
            }
        };
        this.getConversations = async (req, res, next) => {
            try {
                const conversations = await this.conversationService.getConversations(req.query, req.auth);
                res.json(conversations);
            }
            catch (err) {
                next(err);
            }
        };
        this.getConversationById = async (req, res, next) => {
            try {
                const conversation = await this.conversationService.getConversationById(req.params.conversationId, req.auth);
                res.json(conversation);
            }
            catch (err) {
                next(err);
            }
        };
        this.getConversationByParticipantIdOrCreate = async (req, res, next) => {
            try {
                const conversation = await this.conversationService.getConversationByParticipantIdOrCreate(req.params.participantId, req.auth);
                res.json(conversation);
            }
            catch (err) {
                next(err);
            }
        };
        this.getMessages = async (req, res, next) => {
            try {
                const messages = await this.conversationService.getMessages(req.params.conversationId, req.query, req.auth);
                res.json(messages);
            }
            catch (err) {
                next(err);
            }
        };
        this.sendMessage = async (req, res, next) => {
            var _a;
            try {
                const conversationId = req.params.conversationId;
                const body = req.body.body;
                const image = (_a = req.files) === null || _a === void 0 ? void 0 : _a.image;
                const type = req.body.type;
                console.log(req.files);
                const message = await this.conversationService.sendMessage(conversationId, {
                    body,
                    image,
                    type
                }, req.auth);
                res.json(message);
            }
            catch (err) {
                next(err);
            }
        };
        this.sendReaction = async (req, res, next) => {
            try {
                const messageId = req.params.messageId;
                const name = req.body.name;
                const message = await this.conversationService.sendReaction({ messageId, name }, req.auth);
                res.json(message);
            }
            catch (err) {
                next(err);
            }
        };
        this.getConversationMedia = async (req, res, next) => {
            try {
                const conversationId = req.params.conversationId;
                const mediaList = await this.conversationService.getConversationMedia(conversationId, req.query);
                res.json(mediaList);
            }
            catch (err) {
                next(err);
            }
        };
    }
}
exports.default = ConversationController;
//# sourceMappingURL=conversation.controller.js.map