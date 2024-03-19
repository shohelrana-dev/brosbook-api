import { appDataSource } from '@config/datasource.config'
import { MediaSource } from '@entities/Media'
import { NotificationTypes } from '@entities/Notification'
import Post from '@entities/Post'
import PostLike from '@entities/PostLike'
import User from '@entities/User'
import NotificationService from '@modules/notifications/notification.service'
import UserService from '@modules/users/user.service'
import MediaService from '@services/media.service'
import { paginateMeta } from '@utils/paginateMeta'
import { Auth, ListResponse, PostsQueryParams } from '@utils/types'
import { UploadedFile } from 'express-fileupload'
import { inject, injectable } from 'inversify'
import isEmpty from 'is-empty'
import { BadRequestException, NotFoundException } from 'node-http-exceptions'

@injectable()
export default class PostService {
    public readonly postRepository = appDataSource.getRepository(Post)
    public readonly likeRepository = appDataSource.getRepository(PostLike)

    constructor(
        @inject(NotificationService)
        public readonly notificationService: NotificationService,
        @inject(UserService)
        public readonly userService: UserService,
        @inject(MediaService)
        private readonly mediaService: MediaService
    ) {}

    public async create(postData: { body?: string; image: UploadedFile }, auth: Auth): Promise<Post> {
        if (isEmpty(postData)) throw new BadRequestException('Post data is empty.')

        const { image, body } = postData

        if (image) {
            //save image
            const savedImage = await this.mediaService.save({
                file: image.data,
                creator: auth.user,
                source: MediaSource.POST,
            })

            //save post
            const post = new Post()
            post.author = auth.user as User
            post.image = savedImage
            post.body = body

            return await this.postRepository.save(post)
        }

        //save post
        const post = new Post()
        post.author = auth.user as User
        post.body = body

        return await this.postRepository.save(post)
    }

    public async getPostById(postId: string, auth: Auth): Promise<Post> {
        if (!postId) throw new BadRequestException('Post id is empty.')

        const post = await this.postRepository.findOneBy({ id: postId })

        if (!post) throw new NotFoundException('Post does not exists.')

        await this.formatPost(post, auth)

        return post
    }

    public async delete(postId: string): Promise<Post> {
        if (!postId) throw new BadRequestException('Post id is empty.')

        const post = await this.postRepository.findOneBy({ id: postId })

        if (!post) throw new NotFoundException('Post does not exists.')

        await this.postRepository.remove(post)

        if (post.image) {
            this.mediaService.delete(post.image.id)
        }

        return post
    }

    public async getPosts(params: PostsQueryParams, auth: Auth): Promise<ListResponse<Post>> {
        const { authorId, page, limit } = params
        const skip = limit * (page - 1)

        if (authorId) {
            return await this.getUserPosts(params, auth)
        }

        const [posts, count] = await this.postRepository
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .leftJoinAndSelect('author.avatar', 'avatar')
            .leftJoinAndSelect('post.image', 'image')
            .orderBy('post.createdAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount()

        await this.formatPosts(posts, auth)

        return { items: posts, ...paginateMeta(count, page, limit) }
    }

    public async getUserPosts(params: PostsQueryParams, auth: Auth): Promise<ListResponse<Post>> {
        const authorId = params.authorId
        const page = params.page || 1
        const limit = params.limit || 6
        const skip = limit * (page - 1)

        if (!authorId) throw new BadRequestException('Author id is empty.')

        const user = await User.findOneBy({ id: authorId })
        if (!user) throw new BadRequestException("User doesn't exists.")

        const [posts, count] = await this.postRepository
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .leftJoinAndSelect('author.avatar', 'avatar')
            .leftJoinAndSelect('post.image', 'image')
            .where('author.id = :authorId', { authorId })
            .orderBy('post.createdAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount()

        await this.formatPosts(posts, auth)

        return { items: posts, ...paginateMeta(count, page, limit) }
    }

    public async getFeedPosts(
        { page, limit }: PostsQueryParams,
        auth: Auth
    ): Promise<ListResponse<Post>> {
        if (!auth.isAuthenticated) {
            return this.getPosts({ page, limit }, auth)
        }
        const skip = limit * (page - 1)

        const [posts, count] = await this.postRepository
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .leftJoin('author.followers', 'follower')
            .leftJoinAndSelect('author.avatar', 'avatar')
            .leftJoinAndSelect('post.image', 'image')
            .where('follower.id = :followerId', { followerId: auth.user.id })
            .orderBy('post.createdAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount()

        await this.formatPosts(posts, auth)

        return { items: posts, ...paginateMeta(count, page, limit) }
    }

    public async like(postId: string, auth: Auth): Promise<Post> {
        if (!postId) throw new BadRequestException('Post id is empty.')

        const post = await this.postRepository.findOneBy({ id: postId })

        if (!post) throw new BadRequestException('Post does not exists.')

        const liked = await this.likeRepository.findOneBy({
            post: { id: post.id },
            user: { id: auth.user.id },
        })

        if (liked) throw new BadRequestException('The user already liked the post.')

        const like = new PostLike()
        like.post = post
        like.user = auth.user as User
        await this.likeRepository.save(like)

        this.updatePostLikesCount(post)

        post.isViewerLiked = true
        post.likesCount = Number(post.likesCount) + 1

        this.notificationService.create(
            {
                recipient: post.author,
                type: NotificationTypes.LIKED_POST,
                post,
            },
            auth
        )

        return post
    }

    public async unlike(postId: string, auth: Auth): Promise<Post> {
        if (!postId) throw new BadRequestException('Post id is empty.')

        const post = await this.postRepository.findOneBy({ id: postId })

        if (!post) throw new BadRequestException('Post does not exists.')

        const like = await this.likeRepository.findOneBy({
            post: { id: post.id },
            user: { id: auth.user.id },
        })

        if (!like) throw new BadRequestException('The user did not like the post.')

        await this.likeRepository.remove(like)

        this.updatePostLikesCount(post)

        post.isViewerLiked = false
        post.likesCount = Number(post.likesCount) - 1

        this.notificationService.delete(
            { recipient: post.author, post, type: NotificationTypes.LIKED_POST },
            auth
        )

        return post
    }

    private updatePostLikesCount(post: Post) {
        this.likeRepository.countBy({ post: { id: post.id } }).then((count) => {
            this.postRepository.update({ id: post.id }, { likesCount: count })
        })
    }

    async formatPost(post: Post, auth: Auth): Promise<Post> {
        if (auth.isAuthenticated) {
            const like = await PostLike.findOneBy({ user: { id: auth.user.id }, post: { id: post.id } })

            post.isViewerLiked = Boolean(like)
        } else {
            post.isViewerLiked = false
        }

        if (post.author) {
            await this.userService.formatUser(post.author, auth)
        }

        return post
    }

    async formatPosts(posts: Post[], auth: Auth): Promise<Post[]> {
        for (const post of posts) {
            await this.formatPost(post, auth)
        }

        return posts
    }
}
