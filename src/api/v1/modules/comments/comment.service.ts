import Comment from "@entities/Comment"
import { paginateMeta } from "@utils/paginateMeta"
import { Auth, ListResponse, ListQueryParams } from "@interfaces/index.interfaces"
import User from "@entities/User"
import BadRequestException from "@exceptions/BadRequestException"
import NotFoundException from "@exceptions/NotFoundException"
import Post from "@entities/Post"
import { appDataSource } from "@config/data-source"
import PostService from "@modules/posts/post.service"
import CommentLike from "@entities/CommentLike"
import NotificationService from "@modules/notifications/notification.service"
import { NotificationTypes } from "@entities/Notification";

export default class CommentService {
    public readonly repository          = appDataSource.getRepository( Comment )
    public readonly likeRepository      = appDataSource.getRepository( CommentLike )
    public readonly postService         = new PostService()
    public readonly notificationService = new NotificationService()

    public async getComments( postId: string, params: ListQueryParams, auth: Auth ): Promise<ListResponse<Comment>>{
        if( ! postId ) throw new BadRequestException( "Post id is empty." )

        const page  = params.page || 1
        const limit = params.limit || 5
        const skip  = limit * ( page - 1 )

        const [comments, count] = await this.repository.findAndCount( {
            where: { post: { id: postId } },
            order: { createdAt: 'DESC' },
            take: limit,
            skip
        } )


        const formattedComments = await Promise.all( comments.map( ( comment ) => comment.setViewerProperties( auth ) ) )

        return { items: formattedComments, ...paginateMeta( count, page, limit ) }
    }

    public async create( { postId, body }: { body: string, postId: string }, auth: Auth ): Promise<Comment>{
        if( ! postId ) throw new BadRequestException( 'Post id is empty.' )
        if( ! body ) throw new BadRequestException( 'Comment body is empty.' )

        const post = await this.postService.repository.findOneBy( { id: postId } )
        if( ! post ) throw new BadRequestException( 'Post doesn\'t exists.' )

        const author = await User.findOneBy( { id: auth.user.id } )
        if( ! author ) throw new BadRequestException( 'Author doesn\'t exists.' )


        const comment  = new Comment()
        comment.author = author
        comment.body   = body
        comment.post   = post
        await this.repository.save( comment )

        this.updatePostCommentsCount( post.id )

        this.notificationService.create( {
            initiatorId: auth.user.id,
            recipientId: post.author.id,
            type: NotificationTypes.COMMENTED_POST,
            postId,
            commentId: comment.id
        } )

        return comment
    }

    public async delete( commentId: string ): Promise<Comment>{
        if( ! commentId ) throw new BadRequestException( "Comment id is empty." )

        const comment = await this.repository.findOneBy( { id: commentId } )

        if( ! comment ) throw new NotFoundException( 'comment doesn\'t exists.' )

        await this.repository.delete( { id: comment.id } )

        this.updatePostCommentsCount( comment.postId )

        return comment
    }

    public async like( commentId: string, auth: Auth ): Promise<Comment>{
        if( ! commentId ) throw new BadRequestException( "Comment id is empty." )

        const comment = await this.repository.findOne( {
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
            initiatorId: auth.user.id,
            recipientId: comment.author.id,
            type: NotificationTypes.LIKED_COMMENT,
            postId: comment.post.id,
            commentId
        } )

        return comment
    }

    public async unlike( commentId: string ): Promise<Comment>{
        if( ! commentId ) throw new BadRequestException( "Comment id is empty." )

        const comment = await this.repository.findOneBy( { id: commentId } )

        if( ! comment ) throw new BadRequestException( 'Comment doesn\'t exists.' )

        await this.likeRepository.delete( { comment: { id: comment.id } } )

        this.updateCommentLikesCount( comment.id )

        comment.isViewerLiked = false
        comment.likesCount    = Number( comment.likesCount ) - 1

        return comment
    }

    private updateCommentLikesCount( commentId: string ){
        this.likeRepository.countBy( { comment: { id: commentId } } ).then( ( count ) => {
            this.repository.update( { id: commentId }, { likesCount: count } )
        } )
    }

    private updatePostCommentsCount( postId: string ){
        this.repository.countBy( { post: { id: postId } } ).then( ( count ) => {
            this.postService.repository.update( { id: postId }, { commentsCount: count } )
        } )
    }
}