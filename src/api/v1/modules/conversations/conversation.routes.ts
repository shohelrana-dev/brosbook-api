import { Router } from "express"
import authMiddleware from "@middleware/auth.middleware"
import ChatController from "./conversation.controller"
import ConversationService from "./conversation.service"

const router                 = Router()
const conversationService    = new ConversationService()
const conversationController = new ChatController( conversationService )

/**
 * @desc create conversation
 * @route POST /api/api/conversations
 * @access Private
 */
router.post( '/', authMiddleware, conversationController.createConversation )

/**
 * @desc get all conversations
 * @route GET /api/api/conversations
 * @access Private
 */
router.get( '/', authMiddleware, conversationController.getConversations )

/**
 * @desc get unread conversations count
 * @route GET /api/api/conversations
 * @access Private
 */
router.get( '/unread_count', authMiddleware, conversationController.getUnreadConversationsCount )

/**
 * @desc get one conversation by id
 * @route GET /api/api/conversations/:conversationId
 * @access Private
 */
router.get( '/:conversationId', authMiddleware, conversationController.getConversationById )

/**
 * @desc get one conversation by participant id
 * @route GET /api/api/conversations/by/participant_id/:participantId
 * @access Private
 */
router.get( '/by/participant_id/:participantId', authMiddleware, conversationController.getConversationByParticipantIdOrCreate )

/**
 * @desc get messages
 * @route GET /api/api/conversations/:conversationId/messages
 * @access Private
 */
router.get( '/:conversationId/messages', authMiddleware, conversationController.getMessages )

/**
 * @desc send message
 * @route POST /api/api/conversations/:conversationId/messages
 * @access Private
 */
router.post( '/:conversationId/messages', authMiddleware, conversationController.sendMessage )

/**
 * @desc seen all messages
 * @route POST /api/api/conversations/:conversationId/messages/seen_all
 * @access Private
 */
router.post( '/:conversationId/messages/seen_all', authMiddleware, conversationController.seenAllMessages )

/**
 * @desc send reaction
 * @route POST /api/api/conversations/:conversationId/messages/:messageId/reactions
 * @access Private
 */
router.post( '/:conversationId/messages/:messageId/reactions', authMiddleware, conversationController.sendReaction )

/**
 * @desc get conversation media
 * @route GET /api/api/conversations/:conversationId/media
 * @access Private
 */
router.get( '/:conversationId/media', authMiddleware, conversationController.getConversationMedia )


export default router