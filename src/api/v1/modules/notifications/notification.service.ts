import { appDataSource } from '@config/datasource.config'
import { Notification } from '@entities/Notification'
import User from '@entities/User'
import SocketService from '@services/socket.service'
import { paginateMeta } from '@utils/paginateMeta'
import { Auth, ListQueryParams, NotificationPayload } from '@utils/types'
import { injectable } from 'inversify'
import { BadRequestException } from 'node-http-exceptions'
import { IsNull } from 'typeorm'

/**
 * @class NotificationService
 * @desc Service for handling notification related operations.
 */
@injectable()
export default class NotificationService {
    public readonly notificationRepository = appDataSource.getRepository(Notification)

    public async getNotifications({ page, limit }: ListQueryParams, auth: Auth) {
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

    public async getUnreadNotificationsCount(auth: Auth) {
        return await this.notificationRepository.countBy({
            recipient: { id: auth.user.id },
            readAt: IsNull(),
        })
    }

    public async readNotifications(auth: Auth) {
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

    public async create(payload: NotificationPayload, auth: Auth) {
        if (!payload) throw new BadRequestException('Create notification payload is empty.')

        const { recipient, type, post, comment } = payload
        const initiator = auth.user as User

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

    public async delete(payload: NotificationPayload, auth: Auth) {
        if (!payload) throw new BadRequestException('Create notification payload is empty.')

        const { recipient, type, post, comment } = payload

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
