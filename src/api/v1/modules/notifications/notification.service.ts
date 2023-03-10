import { appDataSource } from "@config/data-source"
import { Notification, NotificationTypes } from "@entities/Notification"
import { Auth, ListQueryParams, ListResponse } from "@interfaces/index.interfaces"
import { paginateMeta } from "@utils/paginateMeta"
import BadRequestException from "@exceptions/BadRequestException"
import isEmpty from "is-empty"
import User from "@entities/User"
import Post from "@entities/Post"
import Comment from "@entities/Comment"
import { IsNull } from "typeorm"
import { io } from "@config/express"

export default class NotificationService {
    public readonly repository = appDataSource.getRepository( Notification )

    async getMany( params: ListQueryParams, auth: Auth ): Promise<ListResponse<Notification>>{
        const page  = params.page || 1
        const limit = params.limit || 12
        const skip  = limit * ( page - 1 )

        const [notifications, count] = await this.repository.findAndCount( {
            relations: { initiator: true, post: true, comment: true },
            where: { recipient: { id: auth.user.id } },
            order: { createdAt: "DESC" },
            take: limit,
            skip
        } )

        return { items: notifications, ...paginateMeta( count, page, limit ) }
    }

    async getUnreadCount( auth: Auth ): Promise<number>{
        return await this.repository.countBy( {
            recipient: { id: auth.user.id },
            readAt: IsNull()
        } )
    }

    async update( notificationId: string ): Promise<Notification>{
        if( ! notificationId ) throw new BadRequestException( 'Notification id is empty.' )

        const notification = await this.repository.findOneBy( { id: notificationId } )

        if( isEmpty( notification ) ) throw new BadRequestException( 'Notification does not exists.' )

        notification.readAt = new Date( Date.now() ).toISOString()
        await this.repository.save( notification )

        return notification
    }

    async readAll( auth: Auth ){
        await this.repository.update( {
            recipient: { id: auth.user.id },
            readAt: IsNull()
        }, {
            readAt: new Date( Date.now() ).toISOString()
        } )

        io.emit( `notification.unread.count.${ auth.user.id }`, 0 )
    }

    async create( payload: { initiatorId: string, recipientId: string, postId?: string, commentId?: string, type: NotificationTypes } ): Promise<Notification>{
        if( ! payload ) throw new BadRequestException( 'Create notification payload is empty.' )

        const isSameUserAndNotNeedNotification = payload.recipientId === payload.initiatorId
        if( isSameUserAndNotNeedNotification ) return

        const notification     = new Notification()
        notification.type      = payload.type
        notification.initiator = { id: payload.initiatorId } as User
        notification.recipient = { id: payload.recipientId } as User
        notification.post      = { id: payload.postId } as Post
        notification.comment   = { id: payload.commentId } as Comment
        await this.repository.save( notification )

        const recipientUnreadNotificationCount = await this.repository.countBy( {
            recipient: { id: payload.recipientId },
            readAt: IsNull()
        } )

        io.emit( `notification.unread.count.${ payload.recipientId }`, recipientUnreadNotificationCount )

        return notification
    }
}