"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const auth_middleware_1 = tslib_1.__importDefault(require("../../middleware/auth.middleware"));
const comment_controller_1 = tslib_1.__importDefault(require("../comments/comment.controller"));
const comment_service_1 = tslib_1.__importDefault(require("./comment.service"));
const router = (0, express_1.Router)();
const commentService = new comment_service_1.default();
const commentController = new comment_controller_1.default(commentService);
/**
 * @desc get comments
 * @route GET /posts/:postId/comments
 * @access Private
 */
router.get('/:postId/comments/', auth_middleware_1.default, commentController.getMany);
/**
 * @desc create comment
 * @route POST /posts/:postId/comments
 * @access Private
 */
router.post('/:postId/comments/', auth_middleware_1.default, commentController.create);
/**
 * @desc delete comment
 * @route DELETE /posts/:postId/comments/:commentId
 * @access Private
 */
router.delete('/:postId/comments/:commentId', auth_middleware_1.default, commentController.delete);
/**
 * @desc save comment like
 * @route POST /posts/:postId/comments/:commentId/like
 * @access Private
 */
router.post('/:postId/comments/:commentId/like', auth_middleware_1.default, commentController.like);
/**
 * @desc comment unlike
 * @route POST /posts/:postId/comments/:commentId/unlike
 * @access Private
 */
router.post('/:postId/comments/:commentId/unlike', auth_middleware_1.default, commentController.unlike);
exports.default = router;
//# sourceMappingURL=comment.routes.js.map