import { Router } from "express"
import authMiddleware from "@middleware/auth.middleware"
import NotificationService from "@modules/notifications/notification.service"
import NotificationController from "@modules/notifications/notification.controller"

const router                 = Router()
const notificationService    = new NotificationService()
const notificationController = new NotificationController( notificationService )

/**
 * @desc get notifications
 * @route GET /api/api/notifications
 * @access Private
 */
router.get( '/', authMiddleware, notificationController.getMany )

/**
 * @desc read all notifications
 * @route PUT /api/api/notifications/read_all
 * @access Private
 */
router.put( '/read_all', authMiddleware, notificationController.readAll )

/**
 * @desc get notifications count
 * @route GET /api/api/notifications/unread_count
 * @access Private
 */
router.get( '/unread_count', authMiddleware, notificationController.getUnreadCount )


export default router