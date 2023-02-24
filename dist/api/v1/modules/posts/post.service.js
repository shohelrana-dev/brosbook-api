"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const is_empty_1 = tslib_1.__importDefault(require("is-empty"));
const Post_1 = tslib_1.__importDefault(require("../../entities/Post"));
const PostLike_1 = tslib_1.__importDefault(require("../../entities/PostLike"));
const paginateMeta_1 = require("../../utils/paginateMeta");
const Media_1 = require("../../entities/Media");
const NotFoundException_1 = tslib_1.__importDefault(require("../../exceptions/NotFoundException"));
const Relationship_1 = tslib_1.__importDefault(require("../../entities/Relationship"));
const BadRequestException_1 = tslib_1.__importDefault(require("../../exceptions/BadRequestException"));
const media_service_1 = tslib_1.__importDefault(require("../../services/media.service"));
const User_1 = tslib_1.__importDefault(require("../../entities/User"));
const data_source_1 = require("../../../../config/data-source");
const Comment_1 = tslib_1.__importDefault(require("../../entities/Comment"));
const notification_service_1 = tslib_1.__importDefault(require("../notifications/notification.service"));
const Notification_1 = require("../../entities/Notification");
class PostService {
    constructor() {
        this.repository = data_source_1.appDataSource.getRepository(Post_1.default);
        this.likeRepository = data_source_1.appDataSource.getRepository(PostLike_1.default);
        this.commentRepository = data_source_1.appDataSource.getRepository(Comment_1.default);
        this.mediaService = new media_service_1.default();
        this.notificationService = new notification_service_1.default();
    }
    async create(postData, auth) {
        if ((0, is_empty_1.default)(postData))
            throw new BadRequestException_1.default('Post data is empty.');
        const { image, body } = postData;
        if (image) {
            //save image
            const savedImage = await this.mediaService.save({
                file: image.data,
                creatorId: auth.user.id,
                source: Media_1.MediaSource.POST
            });
            //save post
            const post = new Post_1.default();
            post.author = auth.user;
            post.image = savedImage;
            post.body = body;
            return await this.repository.save(post);
        }
        //save post
        const post = new Post_1.default();
        post.author = auth.user;
        post.body = body;
        return await this.repository.save(post);
    }
    async getPostById(postId, auth) {
        if (!postId)
            throw new BadRequestException_1.default("Post id is empty.");
        const post = await this.repository.findOneBy({ id: postId });
        if (!post)
            throw new NotFoundException_1.default('Post doesn\'t exists.');
        await post.setViewerProperties(auth);
        return post;
    }
    async delete(postId) {
        if (!postId)
            throw new BadRequestException_1.default("Post id is empty.");
        const post = await this.repository.findOneBy({ id: postId });
        if (!post)
            throw new NotFoundException_1.default('Post doesn\'t exists.');
        await this.repository.delete({ id: post.id });
        if (post.image) {
            this.mediaService.delete(post.image.id);
        }
        return post;
    }
    async getMany(params, auth) {
        if (params.userId) {
            return await this.getUserPosts(params, auth);
        }
        const page = params.page || 1;
        const limit = params.limit || 6;
        const skip = limit * (page - 1);
        const [posts, count] = await this.repository
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .leftJoinAndSelect('author.avatar', 'avatar')
            .leftJoinAndSelect('post.image', 'image')
            .orderBy('post.createdAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();
        const formattedPosts = await Promise.all(posts.map(post => post.setViewerProperties(auth)));
        return Object.assign({ items: formattedPosts }, (0, paginateMeta_1.paginateMeta)(count, page, limit));
    }
    async getUserPosts(params, auth) {
        const userId = params.userId;
        const page = params.page || 1;
        const limit = params.limit || 6;
        const skip = limit * (page - 1);
        if (!userId)
            throw new BadRequestException_1.default("User id is empty.");
        const user = await User_1.default.findOneBy({ id: userId });
        if (!user)
            throw new BadRequestException_1.default("User doesn't exists.");
        const [posts, count] = await this.repository
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .leftJoinAndSelect('author.avatar', 'avatar')
            .leftJoinAndSelect('post.image', 'image')
            .where('author.id = :authorId', { authorId: userId })
            .orderBy('post.createdAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();
        const formattedPosts = await Promise.all(posts.map((post => post.setViewerProperties(auth))));
        return Object.assign({ items: formattedPosts }, (0, paginateMeta_1.paginateMeta)(count, page, limit));
    }
    async getFeedPosts(params, auth) {
        const page = params.page || 1;
        const limit = params.limit || 6;
        const skip = limit * (page - 1);
        const relationships = await Relationship_1.default.findBy({ follower: { id: auth.user.id } });
        let followingAuthorIds = relationships.map(rel => rel.following.id);
        const [posts, count] = await this.repository
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .leftJoinAndSelect('author.avatar', 'avatar')
            .leftJoinAndSelect('post.image', 'image')
            .where('author.id != :authorId', { authorId: auth.user.id })
            .andWhere('author.id IN (:authorIds)', { authorIds: followingAuthorIds })
            .orderBy('post.createdAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();
        const formattedPosts = await Promise.all(posts.map(post => post.setViewerProperties(auth)));
        return Object.assign({ items: formattedPosts }, (0, paginateMeta_1.paginateMeta)(count, page, limit));
    }
    async like(postId, auth) {
        if (!postId)
            throw new BadRequestException_1.default("Post id is empty.");
        const post = await this.repository.findOneBy({ id: postId });
        if (!post)
            throw new BadRequestException_1.default('Post doesn\'t exists.');
        const like = new PostLike_1.default();
        like.post = post;
        like.user = auth.user;
        await this.likeRepository.save(like);
        this.updatePostLikesCount(post);
        post.isViewerLiked = true;
        post.likesCount = Number(post.likesCount) + 1;
        this.notificationService.create({
            initiatorId: auth.user.id,
            recipientId: post.author.id,
            type: Notification_1.NotificationTypes.LIKED_POST,
            postId
        });
        return post;
    }
    async unlike(postId, auth) {
        if (!postId)
            throw new BadRequestException_1.default("Post id is empty.");
        const post = await this.repository.findOneBy({ id: postId });
        if (!post)
            throw new BadRequestException_1.default('Post doesn\'t exists.');
        await this.likeRepository.delete({ post: { id: post.id }, user: { id: auth.user.id } });
        this.updatePostLikesCount(post);
        post.isViewerLiked = false;
        post.likesCount = Number(post.likesCount) - 1;
        return post;
    }
    updatePostLikesCount(post) {
        this.likeRepository.countBy({ post: { id: post.id } }).then((count) => {
            this.repository.update({ id: post.id }, { likesCount: count });
        });
    }
}
exports.default = PostService;
//# sourceMappingURL=post.service.js.map