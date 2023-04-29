import Comment from "@entities/Comment"
import { paginateMeta } from "@utils/paginateMeta"
import { Auth, ListResponse, ListQueryParams } from "@interfaces/index.interfaces"
import User from "@entities/User"
import BadRequestException from "@exceptions/BadRequestException"
import NotFoundException from "@exceptions/NotFoundException"
import { appDataSource } from "@config/datasource.config"
import PostService from "@modules/posts/post.service"
import CommentLike from "@entities/CommentLike"
import NotificationService from "@modules/notifications/notification.service"
import { NotificationTypes } from "@entities/Notification"
import ForbiddenException from "@exceptions/ForbiddenException"
import { inject, injectable } from "inversify"

@injectable()
export default class CommentService {
    public readonly commentRepository = appDataSource.getRepository( Comment )
    public readonly likeRepository    = appDataSource.getRepository( CommentLike )

    constructor(
        @inject( PostService )
        public readonly postService: PostService,
        @inject( NotificationService )
        public readonly notificationService: NotificationService
    ){}

    public async getComments( postId: string, params: ListQueryParams, auth: Auth ): Promise<ListResponse<Comment>>{
        if( ! postId ) throw new BadRequestException( "Post id is empty." )

        const page  = params.page
        const limit = params.limit
        const skip  = limit * ( page - 1 )

        const [comments, count] = await this.commentRepository.findAndCount( {
            where: { post: { id: postId } },
            order: { createdAt: 'DESC' },
            take: limit,
            skip
        } )


        await this.formatComments( comments, auth )

        return { items: comments, ...paginateMeta( count, page, limit ) }
    }

    public async create( { postId, body }: { body: string, postId: string }, auth: Auth ): Promise<Comment>{
        if( ! postId ) throw new BadRequestException( 'Post id is empty.' )
        if( ! body ) throw new BadRequestException( 'Comment body is empty.' )

        const post = await this.postService.postRepository.findOneBy( { id: postId } )
        if( ! post ) throw new BadRequestException( 'Post does not exists.' )

        const author = await User.findOneBy( { id: auth.user.id } )
        if( ! author ) throw new BadRequestException( 'Author does not exists.' )


        const comment  = new Comment()
        comment.author = author
        comment.body   = body
        comment.post   = post
        await this.commentRepository.save( comment )

        this.updatePostCommentsCount( post.id )

        this.notificationService.create( {
            recipient: post.author,
            type: NotificationTypes.COMMENTED_POST,
            post,
            comment
        }, auth )

        return comment
    }

    public async delete( commentId: string, auth: Auth ): Promise<Comment>{
        if( ! commentId ) throw new BadRequestException( "Comment id is empty." )

        const comment = await this.commentRepository.findOne( {
            where: { id: commentId },
            relations: { post: true }
        } )

        if( ! comment ) throw new NotFoundException( 'comment does not exists.' )

        if( auth.user.id !== comment.author.id && auth.user.id !== comment.post.author.id ){
            throw new ForbiddenException( 'You are not owner of the comment.' )
        }

        await this.commentRepository.delete( { id: comment.id } )

        this.updatePostCommentsCount( comment.post.id )

        return comment
    }

    public async like( commentId: string, auth: Auth ): Promise<Comment>{
        if( ! commentId ) throw new BadRequestException( "Comment id is empty." )

        const comment = await this.commentRepository.findOne( {
            where: { id: commentId },
            relations: { post: true }
        } )

        if( ! comment ) throw new NotFoundException( 'Comment does not exists.' )

        const liked = await this.likeRepository.findOneBy( { comment: { id: commentId }, user: { id: auth.user.id } } )

        if( liked ) throw new BadRequestException('The user already liked the comment.')

        const like   = new CommentLike()
        like.comment = comment
        like.user    = auth.user as User
        await this.likeRepository.save( like )

        this.updateCommentLikesCount( comment.id )

        comment.isViewerLiked = true
        comment.likesCount    = Number( comment.likesCount ) + 1

        this.notificationService.create( {
            recipient: comment.author,
            type: NotificationTypes.LIKED_COMMENT,
            post: comment.post,
            comment
        }, auth )

        return comment
    }

    public async unlike( commentId: string, auth: Auth ): Promise<Comment>{
        if( ! commentId ) throw new BadRequestException( "Comment id is empty." )

        const comment = await this.commentRepository.findOneBy( { id: commentId } )

        if( ! comment ) throw new BadRequestException( 'Comment does not exists.' )

        const like = await this.likeRepository.findOneBy( { comment: { id: comment.id }, user: { id: auth.user.id } } )

        if( ! like ) throw new BadRequestException('The user did not like the comment.')

        await this.likeRepository.remove(like)

        this.updateCommentLikesCount( comment.id )

        comment.isViewerLiked = false
        comment.likesCount    = Number( comment.likesCount ) - 1

        this.notificationService.delete({ recipient: comment.author, comment, type: NotificationTypes.LIKED_COMMENT }, auth)

        return comment
    }

    private updateCommentLikesCount( commentId: string ){
        this.likeRepository.countBy( { comment: { id: commentId } } ).then( ( count ) => {
            this.commentRepository.update( { id: commentId }, { likesCount: count } )
        } )
    }

    private updatePostCommentsCount( postId: string ){
        this.commentRepository.countBy( { post: { id: postId } } ).then( ( count ) => {
            this.postService.postRepository.update( { id: postId }, { commentsCount: count } )
        } )
    }

    async formatComment( comment: Comment, auth: Auth ): Promise<Comment>{
        if( auth.isAuthenticated ){
            const like = await CommentLike.findOneBy( { user: { id: auth.user.id }, comment: { id: comment.id } } )

            comment.isViewerLiked = Boolean( like )
        } else{
            comment.isViewerLiked = false
        }

        return comment
    }

    async formatComments( comments: Comment[], auth: Auth ): Promise<Comment[]>{
        for ( const comment of comments ) {
            await this.formatComment( comment, auth )
        }

        return comments
    }
}