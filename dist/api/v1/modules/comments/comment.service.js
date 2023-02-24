"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const Comment_1 = tslib_1.__importDefault(require("../../entities/Comment"));
const paginateMeta_1 = require("../../utils/paginateMeta");
const User_1 = tslib_1.__importDefault(require("../../entities/User"));
const BadRequestException_1 = tslib_1.__importDefault(require("../../exceptions/BadRequestException"));
const NotFoundException_1 = tslib_1.__importDefault(require("../../exceptions/NotFoundException"));
const data_source_1 = require("../../../../config/data-source");
const post_service_1 = tslib_1.__importDefault(require("../posts/post.service"));
const CommentLike_1 = tslib_1.__importDefault(require("../../entities/CommentLike"));
const notification_service_1 = tslib_1.__importDefault(require("../notifications/notification.service"));
const Notification_1 = require("../../entities/Notification");
const ForbiddenException_1 = tslib_1.__importDefault(require("../../exceptions/ForbiddenException"));
class CommentService {
    constructor() {
        this.repository = data_source_1.appDataSource.getRepository(Comment_1.default);
        this.likeRepository = data_source_1.appDataSource.getRepository(CommentLike_1.default);
        this.postService = new post_service_1.default();
        this.notificationService = new notification_service_1.default();
    }
    async getComments(postId, params, auth) {
        if (!postId)
            throw new BadRequestException_1.default("Post id is empty.");
        const page = params.page || 1;
        const limit = params.limit || 5;
        const skip = limit * (page - 1);
        const [comments, count] = await this.repository.findAndCount({
            where: { post: { id: postId } },
            order: { createdAt: 'DESC' },
            take: limit,
            skip
        });
        const formattedComments = await Promise.all(comments.map((comment) => comment.setViewerProperties(auth)));
        return Object.assign({ items: formattedComments }, (0, paginateMeta_1.paginateMeta)(count, page, limit));
    }
    async create({ postId, body }, auth) {
        if (!postId)
            throw new BadRequestException_1.default('Post id is empty.');
        if (!body)
            throw new BadRequestException_1.default('Comment body is empty.');
        const post = await this.postService.repository.findOneBy({ id: postId });
        if (!post)
            throw new BadRequestException_1.default('Post doesn\'t exists.');
        const author = await User_1.default.findOneBy({ id: auth.user.id });
        if (!author)
            throw new BadRequestException_1.default('Author doesn\'t exists.');
        const comment = new Comment_1.default();
        comment.author = author;
        comment.body = body;
        comment.post = post;
        await this.repository.save(comment);
        this.updatePostCommentsCount(post.id);
        this.notificationService.create({
            initiatorId: auth.user.id,
            recipientId: post.author.id,
            type: Notification_1.NotificationTypes.COMMENTED_POST,
            postId,
            commentId: comment.id
        });
        return comment;
    }
    async delete(commentId, auth) {
        if (!commentId)
            throw new BadRequestException_1.default("Comment id is empty.");
        const comment = await this.repository.findOne({
            where: { id: commentId },
            relations: { post: true }
        });
        if (!comment)
            throw new NotFoundException_1.default('comment doesn\'t exists.');
        if (auth.user.id !== comment.author.id && auth.user.id !== comment.post.author.id) {
            throw new ForbiddenException_1.default('You are not owner of the comment.');
        }
        await this.repository.delete({ id: comment.id });
        this.updatePostCommentsCount(comment.postId);
        return comment;
    }
    async like(commentId, auth) {
        if (!commentId)
            throw new BadRequestException_1.default("Comment id is empty.");
        const comment = await this.repository.findOne({
            where: { id: commentId },
            relations: { post: true }
        });
        if (!comment)
            throw new NotFoundException_1.default('Comment doesn\'t exists.');
        const like = new CommentLike_1.default();
        like.comment = comment;
        like.user = auth.user;
        await this.likeRepository.save(like);
        this.updateCommentLikesCount(comment.id);
        comment.isViewerLiked = true;
        comment.likesCount = Number(comment.likesCount) + 1;
        this.notificationService.create({
            initiatorId: auth.user.id,
            recipientId: comment.author.id,
            type: Notification_1.NotificationTypes.LIKED_COMMENT,
            postId: comment.post.id,
            commentId
        });
        return comment;
    }
    async unlike(commentId) {
        if (!commentId)
            throw new BadRequestException_1.default("Comment id is empty.");
        const comment = await this.repository.findOneBy({ id: commentId });
        if (!comment)
            throw new BadRequestException_1.default('Comment doesn\'t exists.');
        await this.likeRepository.delete({ comment: { id: comment.id } });
        this.updateCommentLikesCount(comment.id);
        comment.isViewerLiked = false;
        comment.likesCount = Number(comment.likesCount) - 1;
        return comment;
    }
    updateCommentLikesCount(commentId) {
        this.likeRepository.countBy({ comment: { id: commentId } }).then((count) => {
            this.repository.update({ id: commentId }, { likesCount: count });
        });
    }
    updatePostCommentsCount(postId) {
        this.repository.countBy({ post: { id: postId } }).then((count) => {
            this.postService.repository.update({ id: postId }, { commentsCount: count });
        });
    }
}
exports.default = CommentService;
//# sourceMappingURL=comment.service.js.map