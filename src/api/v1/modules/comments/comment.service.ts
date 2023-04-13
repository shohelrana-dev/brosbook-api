import Comment from "@entities/Comment"
import { paginateMeta } from "@utils/paginateMeta"
import { Auth, ListResponse, ListQueryParams } from "@interfaces/index.interfaces"
import User from "@entities/User"
import BadRequestException from "@exceptions/BadRequestException"
import NotFoundException from "@exceptions/NotFoundException"
import { appDataSource } from "@config/data-source"
import PostService from "@modules/posts/post.service"
import CommentLike from "@entities/CommentLike"
import NotificationService from "@modules/notifications/notification.service"
import { NotificationTypes } from "@entities/Notification"
import ForbiddenException from "@exceptions/ForbiddenException"

export default class CommentService {
    public readonly commentRepository   = appDataSource.getRepository( Comment )
    public readonly likeRepository      = appDataSource.getRepository( CommentLike )
    public readonly postService         = new PostService()
    public readonly notificationService = new NotificationService()

    public async getComments( postId: string, params: ListQueryParams, auth: Auth ): Promise<ListResponse<Comment>>{
        if( ! postId ) throw new BadRequestException( "Post id is empty." )

        const page  = params.page || 1
        const limit = params.limit || 5
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
        if( ! post ) throw new BadRequestException( 'Post doesn\'t exists.' )

        const author = await User.findOneBy( { id: auth.user.id } )
        if( ! author ) throw new BadRequestException( 'Author doesn\'t exists.' )


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

        if( ! comment ) throw new NotFoundException( 'comment doesn\'t exists.' )

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

        if( ! comment ) throw new NotFoundException( 'Comment doesn\'t exists.' )

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

    public async unlike( commentId: string ): Promise<Comment>{
        if( ! commentId ) throw new BadRequestException( "Comment id is empty." )

        const comment = await this.commentRepository.findOneBy( { id: commentId } )

        if( ! comment ) throw new BadRequestException( 'Comment doesn\'t exists.' )

        await this.likeRepository.delete( { comment: { id: comment.id } } )

        this.updateCommentLikesCount( comment.id )

        comment.isViewerLiked = false
        comment.likesCount    = Number( comment.likesCount ) - 1

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