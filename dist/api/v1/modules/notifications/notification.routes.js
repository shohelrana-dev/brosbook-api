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
 * @desc read all notifications
 * @route PUT /api/api/notifications/read_all
 * @access Private
 */
router.put('/read_all', auth_middleware_1.default, notificationController.readAll);
/**
 * @desc get notifications count
 * @route GET /api/api/notifications/unread_count
 * @access Private
 */
router.get('/unread_count', auth_middleware_1.default, notificationController.getUnreadCount);
exports.default = router;
//# sourceMappingURL=notification.routes.js.map