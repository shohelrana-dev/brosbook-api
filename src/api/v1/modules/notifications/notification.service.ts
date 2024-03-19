import { appDataSource } from '@config/datasource.config'
import Comment from '@entities/Comment'
import { Notification, NotificationTypes } from '@entities/Notification'
import Post from '@entities/Post'
import User from '@entities/User'
import SocketService from '@services/socket.service'
import { paginateMeta } from '@utils/paginateMeta'
import { Auth, ListQueryParams, ListResponse } from '@utils/types'
import { injectable } from 'inversify'
import { BadRequestException } from 'node-http-exceptions'
import { IsNull } from 'typeorm'

@injectable()
export default class NotificationService {
    public readonly notificationRepository = appDataSource.getRepository(Notification)

    async getNotifications(
        { page, limit }: ListQueryParams,
        auth: Auth
    ): Promise<ListResponse<Notification>> {
        const skip = limit * (page - 1)

        const [notifications, count] = await this.notificationRepository.findAndCount({
            relations: { initiator: true, post: true, comment: true },
            where: { recipient: { id: auth.user.id } },
            order: { createdAt: 'DESC' },
            take: limit,
            skip,
        })

        return { items: notifications, ...paginateMeta(count, page, limit) }
    }

    async getUnreadNotificationsCount(auth: Auth): Promise<number> {
        return await this.notificationRepository.countBy({
            recipient: { id: auth.user.id },
            readAt: IsNull(),
        })
    }

    async readNotifications(auth: Auth) {
        const notifications = await this.notificationRepository.findBy({
            recipient: { id: auth.user.id },
            readAt: IsNull(),
        })

        if (notifications && notifications.length > 0) {
            for (const notification of notifications) {
                notification.readAt = new Date(Date.now()).toISOString()
                await this.notificationRepository.save(notification)
            }
        }

        return notifications
    }

    async create(
        data: { recipient: User; post?: Post; comment?: Comment; type: NotificationTypes },
        auth: Auth
    ): Promise<Notification> {
        if (!data) throw new BadRequestException('Create notification payload is empty.')

        const { recipient, type, post, comment } = data
        const initiator = auth.user

        const isSameUserAndNotNeedNotification = recipient.id === initiator.id
        if (isSameUserAndNotNeedNotification) return

        const notification = new Notification()
        notification.type = type
        notification.initiator = initiator
        notification.recipient = recipient
        notification.post = post
        notification.comment = comment
        await this.notificationRepository.save(notification)

        const recipientUnreadNotificationCount = await this.notificationRepository.countBy({
            recipient: { id: recipient.id },
            readAt: IsNull(),
        })

        SocketService.emit(`notification.new.${recipient.id}`, notification)
        SocketService.emit(`notification.unread.count.${recipient.id}`, recipientUnreadNotificationCount)

        return notification
    }

    async delete(
        data: { recipient: User; post?: Post; comment?: Comment; type: NotificationTypes },
        auth: Auth
    ): Promise<Notification> {
        if (!data) throw new BadRequestException('Create notification payload is empty.')

        const { recipient, type, post, comment } = data

        const notification = await this.notificationRepository.findOneBy({
            initiator: { id: auth.user.id },
            recipient: { id: recipient.id },
            type: type,
            post: post ? { id: post.id } : null,
            comment: comment ? { id: comment.id } : null,
        })

        if (!notification) return

        await this.notificationRepository.remove(notification)

        return notification
    }
}
