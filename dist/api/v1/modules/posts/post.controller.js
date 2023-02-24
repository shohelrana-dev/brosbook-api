"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PostController {
    constructor(postService) {
        this.postService = postService;
        this.create = async (req, res, next) => {
            var _a;
            const body = req.body.body;
            const image = (_a = req.files) === null || _a === void 0 ? void 0 : _a.image;
            const auth = req.auth;
            try {
                const post = await this.postService.create({ body, image }, auth);
                res.status(201).json(post);
            }
            catch (err) {
                next(err);
            }
        };
        this.getPostById = async (req, res, next) => {
            try {
                const post = await this.postService.getPostById(req.params.postId, req.auth);
                res.json(post);
            }
            catch (err) {
                next(err);
            }
        };
        this.delete = async (req, res, next) => {
            try {
                const post = await this.postService.delete(req.params.postId);
                res.json(post);
            }
            catch (err) {
                next(err);
            }
        };
        this.getMany = async (req, res, next) => {
            try {
                const posts = await this.postService.getMany(req.query, req.auth);
                res.json(posts);
            }
            catch (err) {
                next(err);
            }
        };
        this.getFeedPosts = async (req, res, next) => {
            try {
                const posts = await this.postService.getFeedPosts(req.query, req.auth);
                res.json(posts);
            }
            catch (err) {
                next(err);
            }
        };
        this.like = async (req, res, next) => {
            try {
                const post = await this.postService.like(req.params.postId, req.auth);
                res.json(post);
            }
            catch (err) {
                next(err);
            }
        };
        this.unlike = async (req, res, next) => {
            try {
                const post = await this.postService.unlike(req.params.postId, req.auth);
                res.json(post);
            }
            catch (err) {
                next(err);
            }
        };
    }
}
exports.default = PostController;
//# sourceMappingURL=post.controller.js.map