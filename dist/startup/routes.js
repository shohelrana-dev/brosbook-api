"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const auth_routes_1 = tslib_1.__importDefault(require("../api/v1/modules/auth/auth.routes"));
const account_routes_1 = tslib_1.__importDefault(require("../api/v1/modules/account/account.routes"));
const post_routes_1 = tslib_1.__importDefault(require("../api/v1/modules/posts/post.routes"));
const comment_routes_1 = tslib_1.__importDefault(require("../api/v1/modules/comments/comment.routes"));
const user_routes_1 = tslib_1.__importDefault(require("../api/v1/modules/users/user.routes"));
const conversation_routes_1 = tslib_1.__importDefault(require("../api/v1/modules/conversations/conversation.routes"));
const notification_routes_1 = tslib_1.__importDefault(require("../api/v1/modules/notifications/notification.routes"));
const router = (0, express_1.Router)();
//base routes
router.use('/api/v1/auth', auth_routes_1.default);
router.use('/api/v1/account', account_routes_1.default);
router.use('/api/v1/users', user_routes_1.default);
router.use('/api/v1/posts', [post_routes_1.default, comment_routes_1.default]);
router.use('/api/v1/conversations', conversation_routes_1.default);
router.use('/api/v1/notifications', notification_routes_1.default);
exports.default = router;
//# sourceMappingURL=routes.js.map