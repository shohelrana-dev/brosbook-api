"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const auth_middleware_1 = tslib_1.__importDefault(require("../../middleware/auth.middleware"));
const user_controller_1 = tslib_1.__importDefault(require("../users/user.controller"));
const user_service_1 = tslib_1.__importDefault(require("./user.service"));
const router = (0, express_1.Router)();
const userService = new user_service_1.default();
const usersController = new user_controller_1.default(userService);
/**
 * @desc get current user
 * @route GET /api/api/users/me
 * @access Private
 */
router.get('/me', auth_middleware_1.default, usersController.getCurrentUser);
/**
 * @desc change profile photo
 * @route POST /api/api/users/me/avatar
 * @access Private
 */
router.post('/me/avatar', auth_middleware_1.default, usersController.changeAvatar);
/**
 * @desc change cover photo
 * @route POST /api/api/users/me/cover_photo
 * @access Private
 */
router.post('/me/cover_photo', auth_middleware_1.default, usersController.changeCoverPhoto);
/**
 * @desc get users
 * @route GET /api/api/users/search
 * @access Private
 */
router.get('/search', usersController.searchUsers);
/**
 * @desc get suggested users
 * @route GET /api/api/users/suggestions
 * @access Private
 */
router.get('/suggestions', auth_middleware_1.default, usersController.getSuggestions);
/**
 * @desc get user by user id
 * @route GET /api/api/users/:userId
 * @access Public
 */
router.get('/:userId', usersController.getUserById);
/**
 * @desc get user by username =
 * @route GET /api/api/users/by/username/:username
 * @access Public
 */
router.get('/by/username/:username', usersController.getUserByUsername);
/**
 * @desc get followers
 * @route GET /api/api/users/:userId/followers
 * @access Public
 */
router.get('/:userId/followers', usersController.getFollowers);
/**
 * @desc get followers count
 * @route GET /api/api/users/:userId/followers/count
 * @access Public
 */
router.get('/:userId/followers/count', usersController.getFollowersCount);
/**
 * @desc get followings
 * @route GET /api/api/users/:userId/followings
 * @access Public
 */
router.get('/:userId/followings', usersController.getFollowings);
/**
 * @desc get followings count
 * @route GET /api/api/users/:userId/followings/count
 * @access Public
 */
router.get('/:userId/followings/count', usersController.getFollowingsCount);
/**
 * @desc follow
 * @route POST /api/api/users/follow/:userId
 * @access Private
 */
router.post('/follow/:userId', auth_middleware_1.default, usersController.follow);
/**
 * @desc Add following
 * @route POST /api/api/users/unfollow/:userId
 * @access Private
 */
router.post('/unfollow/:userId', auth_middleware_1.default, usersController.unfollow);
exports.default = router;
//# sourceMappingURL=user.routes.js.map