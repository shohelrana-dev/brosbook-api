"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CommentController {
    constructor(commentService) {
        this.commentService = commentService;
        this.getMany = async (req, res, next) => {
            try {
                const comments = await this.commentService.getComments(req.params.postId, req.query, req.auth);
                res.json(comments);
            }
            catch (err) {
                next(err);
            }
        };
        this.create = async (req, res, next) => {
            try {
                const comment = await this.commentService.create({
                    postId: req.params.postId,
                    body: req.body.body
                }, req.auth);
                res.status(201).json(comment);
            }
            catch (err) {
                next(err);
            }
        };
        this.delete = async (req, res, next) => {
            try {
                const comment = await this.commentService.delete(req.params.commentId, req.auth);
                res.json(comment);
            }
            catch (err) {
                next(err);
            }
        };
        this.like = async (req, res, next) => {
            try {
                const comment = await this.commentService.like(req.params.commentId, req.auth);
                res.json(comment);
            }
            catch (err) {
                next(err);
            }
        };
        this.unlike = async (req, res, next) => {
            try {
                const comment = await this.commentService.unlike(req.params.commentId);
                res.json(comment);
            }
            catch (err) {
                next(err);
            }
        };
    }
}
exports.default = CommentController;
//# sourceMappingURL=comment.controller.js.map