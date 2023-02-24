"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const auth_middleware_1 = tslib_1.__importDefault(require("../../middleware/auth.middleware"));
const post_controller_1 = tslib_1.__importDefault(require("../posts/post.controller"));
const post_service_1 = tslib_1.__importDefault(require("./post.service"));
const router = (0, express_1.Router)();
const postService = new post_service_1.default();
const postController = new post_controller_1.default(postService);
/**
 * @desc get all posts
 * @route GET posts
 * @access Public
 * */
router.get('/', postController.getMany);
/**
 * @desc create post
 * @route POST posts
 * @access Private
 * */
router.post('/', auth_middleware_1.default, postController.create);
/**
 * @desc get feed posts
 * @route GET posts
 * @access Private
 * */
router.get('/feed', auth_middleware_1.default, postController.getFeedPosts);
/**
 * @desc get post by postId
 * @route GET posts/:postId
 * @access Public
 * */
router.get('/:postId', postController.getPostById);
/**
 * @desc delete post
 * @route DELETE posts/:id
 * @access Private
 * */
router.delete('/:postId', auth_middleware_1.default, postController.delete);
/**
 * @desc  save post like
 * @route POST posts/:postId/like
 * @access Private
 * */
router.post('/:postId/like', auth_middleware_1.default, postController.like);
/**
 * @desc  remove post like
 * @route DELETE posts/:postId/unlike
 * @access Private
 * */
router.post('/:postId/unlike', auth_middleware_1.default, postController.unlike);
exports.default = router;
//# sourceMappingURL=post.routes.js.map