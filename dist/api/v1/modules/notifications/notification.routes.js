"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const auth_middleware_1 = tslib_1.__importDefault(require("../../middleware/auth.middleware"));
const notification_service_1 = tslib_1.__importDefault(require("../notifications/notification.service"));
const notification_controller_1 = tslib_1.__importDefault(require("../notifications/notification.controller"));
const router = (0, express_1.Router)();
const notificationService = new notification_service_1.default();
const notificationController = new notification_controller_1.default(notificationService);
/**
 * @desc get notifications
 * @route GET /api/api/notifications
 * @access Private
 */
router.get('/', auth_middleware_1.default, notificationController.getMany);
/**
 * @desc update all notifications
 * @route PUT /api/api/notifications
 * @access Private
 */
router.put('/', auth_middleware_1.default, notificationController.updateAll);
/**
 * @desc get notifications count
 * @route GET /api/api/notifications/unread_count
 * @access Private
 */
router.get('/unread_count', auth_middleware_1.default, notificationController.getUnreadCount);
/**
 * @desc update notification
 * @route GET /api/api/notifications/notificationId
 * @access Private
 */
router.put('/:notificationId', auth_middleware_1.default, notificationController.update);
exports.default = router;
//# sourceMappingURL=notification.routes.js.map