"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const auth_middleware_1 = tslib_1.__importDefault(require("../../middleware/auth.middleware"));
const conversation_controller_1 = tslib_1.__importDefault(require("./conversation.controller"));
const conversation_service_1 = tslib_1.__importDefault(require("./conversation.service"));
const router = (0, express_1.Router)();
const conversationService = new conversation_service_1.default();
const conversationController = new conversation_controller_1.default(conversationService);
/**
 * @desc create conversation
 * @route POST /api/api/conversations
 * @access Private
 */
router.post('/', auth_middleware_1.default, conversationController.createConversation);
/**
 * @desc get all conversations
 * @route GET /api/api/conversations
 * @access Private
 */
router.get('/', auth_middleware_1.default, conversationController.getConversations);
/**
 * @desc get one conversation by id
 * @route GET /api/api/conversations/:conversationId
 * @access Private
 */
router.get('/:conversationId', auth_middleware_1.default, conversationController.getConversationById);
/**
 * @desc get one conversation by participant id
 * @route GET /api/api/conversations/by/participant_id/:participantId
 * @access Private
 */
router.get('/by/participant_id/:participantId', auth_middleware_1.default, conversationController.getConversationByParticipantIdOrCreate);
/**
 * @desc get messages
 * @route GET /api/api/conversations/:conversationId/messages
 * @access Private
 */
router.get('/:conversationId/messages', auth_middleware_1.default, conversationController.getMessages);
/**
 * @desc send message
 * @route POST /api/api/conversations/:conversationId/messages
 * @access Private
 */
router.post('/:conversationId/messages', auth_middleware_1.default, conversationController.sendMessage);
/**
 * @desc send reaction
 * @route POST /api/api/conversations/:conversationId/messages/:messageId/reactions
 * @access Private
 */
router.post('/:conversationId/messages/:messageId/reactions', auth_middleware_1.default, conversationController.sendReaction);
/**
 * @desc get conversation media
 * @route GET /api/api/conversations/:conversationId/media
 * @access Private
 */
router.get('/:conversationId/media', auth_middleware_1.default, conversationController.getConversationMedia);
exports.default = router;
//# sourceMappingURL=conversation.routes.js.map