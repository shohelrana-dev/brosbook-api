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
    public readonly notificationRepository = appDataSource.getRepository( Notification )

    async getMany( params: ListQueryParams, auth: Auth ): Promise<ListResponse<Notification>>{
        const page  = params.page || 1
        const limit = params.limit || 12
        const skip  = limit * ( page - 1 )

        const [notifications, count] = await this.notificationRepository.findAndCount( {
            relations: { initiator: true, post: true, comment: true },
            where: { recipient: { id: auth.user.id } },
            order: { createdAt: "DESC" },
            take: limit,
            skip
        } )

        return { items: notifications, ...paginateMeta( count, page, limit ) }
    }

    async getUnreadCount( auth: Auth ): Promise<number>{
        return await this.notificationRepository.countBy( {
            recipient: { id: auth.user.id },
            readAt: IsNull()
        } )
    }

    async update( notificationId: string ): Promise<Notification>{
        if( ! notificationId ) throw new BadRequestException( 'Notification id is empty.' )

        const notification = await this.notificationRepository.findOneBy( { id: notificationId } )

        if( isEmpty( notification ) ) throw new BadRequestException( 'Notification does not exists.' )

        notification.readAt = new Date( Date.now() ).toISOString()
        await this.notificationRepository.save( notification )

        return notification
    }

    async readAll( auth: Auth ){
        await this.notificationRepository.update( {
            recipient: { id: auth.user.id },
            readAt: IsNull()
        }, {
            readAt: new Date( Date.now() ).toISOString()
        } )

        io.emit( `notification.unread.count.${ auth.user.id }`, 0 )
    }

    async create( data: { recipient: User, post?: Post, comment?: Comment, type: NotificationTypes }, auth: Auth ): Promise<Notification>{
        if( ! data ) throw new BadRequestException( 'Create notification payload is empty.' )

        const { recipient, type, post, comment } = data
        const initiator                          = auth.user

        const isSameUserAndNotNeedNotification = recipient.id === initiator.id
        if( isSameUserAndNotNeedNotification ) return

        const notification     = new Notification()
        notification.type      = type
        notification.initiator = initiator
        notification.recipient = recipient
        notification.post      = post
        notification.comment   = comment
        await this.notificationRepository.save( notification )

        const recipientUnreadNotificationCount = await this.notificationRepository.countBy( {
            recipient: { id: recipient.id },
            readAt: IsNull()
        } )

        io.emit( `notification.new.${ recipient.id }`, notification )
        io.emit( `notification.unread.count.${ recipient.id }`, recipientUnreadNotificationCount )

        return notification
    }
}