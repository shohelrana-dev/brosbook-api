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
 * @desc get unread conversations count
 * @route GET /api/api/conversations
 * @access Private
 */
router.get('/unread_count', auth_middleware_1.default, conversationController.getUnreadConversationsCount);
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
 * @desc seen all messages
 * @route POST /api/api/conversations/:conversationId/messages/seen_all
 * @access Private
 */
router.post('/:conversationId/messages/seen_all', auth_middleware_1.default, conversationController.seenAllMessages);
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