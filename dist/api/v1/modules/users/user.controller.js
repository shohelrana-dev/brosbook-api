"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UserController {
    constructor(usersService) {
        this.usersService = usersService;
        this.getCurrentUser = async (req, res, next) => {
            try {
                const user = await this.usersService.getCurrentUser(req.auth);
                res.json(user);
            }
            catch (err) {
                next(err);
            }
        };
        this.getUserById = async (req, res, next) => {
            try {
                const user = await this.usersService.getUserById(req.params.userId, req.auth);
                res.json(user);
            }
            catch (err) {
                next(err);
            }
        };
        this.getUserByUsername = async (req, res, next) => {
            try {
                const user = await this.usersService.getUserByUsername(req.params.username, req.auth);
                res.json(user);
            }
            catch (err) {
                next(err);
            }
        };
        this.searchUsers = async (req, res, next) => {
            try {
                const users = await this.usersService.searchUsers(req.query, req.auth);
                res.json(users);
            }
            catch (err) {
                next(err);
            }
        };
        this.getSuggestions = async (req, res, next) => {
            try {
                const users = await this.usersService.getSuggestions(req.query, req.auth);
                res.json(users);
            }
            catch (err) {
                next(err);
            }
        };
        this.getFollowings = async (req, res, next) => {
            const userId = req.params.userId;
            const page = Number(req.query.page);
            const limit = Number(req.query.limit);
            try {
                const followings = await this.usersService.getFollowings(userId, { page, limit }, req.auth);
                res.json(followings);
            }
            catch (err) {
                next(err);
            }
        };
        this.getFollowingsCount = async (req, res, next) => {
            const userId = req.params.userId;
            try {
                const count = await this.usersService.getFollowingsCount(userId);
                res.json({ count });
            }
            catch (err) {
                next(err);
            }
        };
        this.getFollowers = async (req, res, next) => {
            const userId = req.params.userId;
            const page = Number(req.query.page);
            const limit = Number(req.query.limit);
            try {
                const followers = await this.usersService.getFollowers(userId, { page, limit }, req.auth);
                res.json(followers);
            }
            catch (err) {
                next(err);
            }
        };
        this.getFollowersCount = async (req, res, next) => {
            const userId = req.params.userId;
            try {
                const count = await this.usersService.getFollowersCount(userId);
                res.json({ count });
            }
            catch (err) {
                next(err);
            }
        };
        this.changeAvatar = async (req, res, next) => {
            var _a;
            try {
                const user = await this.usersService.changeAvatar((_a = req.files) === null || _a === void 0 ? void 0 : _a.avatar, req.auth);
                res.json(user);
            }
            catch (err) {
                next(err);
            }
        };
        this.changeCoverPhoto = async (req, res, next) => {
            var _a;
            try {
                const user = await this.usersService.changeCoverPhoto((_a = req.files) === null || _a === void 0 ? void 0 : _a.coverPhoto, req.auth);
                res.json(user);
            }
            catch (err) {
                next(err);
            }
        };
        this.follow = async (req, res, next) => {
            try {
                const following = await this.usersService.follow(req.params.userId, req.auth);
                res.json(following);
            }
            catch (err) {
                next(err);
            }
        };
        this.unfollow = async (req, res, next) => {
            try {
                const unfollowing = await this.usersService.unfollow(req.params.userId, req.auth);
                res.json(unfollowing);
            }
            catch (err) {
                next(err);
            }
        };
    }
}
exports.default = UserController;
//# sourceMappingURL=user.controller.js.map