"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const data_source_1 = require("../../../../config/data-source");
const Notification_1 = require("../../entities/Notification");
const paginateMeta_1 = require("../../utils/paginateMeta");
const BadRequestException_1 = tslib_1.__importDefault(require("../../exceptions/BadRequestException"));
const is_empty_1 = tslib_1.__importDefault(require("is-empty"));
const typeorm_1 = require("typeorm");
const express_1 = require("../../../../config/express");
class NotificationService {
    constructor() {
        this.repository = data_source_1.appDataSource.getRepository(Notification_1.Notification);
    }
    async getMany(params, auth) {
        const page = params.page || 1;
        const limit = params.limit || 12;
        const skip = limit * (page - 1);
        const [notifications, count] = await this.repository.findAndCount({
            relations: { initiator: true, post: true, comment: true },
            where: { recipient: { id: auth.user.id } },
            order: { createdAt: "DESC" },
            take: limit,
            skip
        });
        return Object.assign({ items: notifications }, (0, paginateMeta_1.paginateMeta)(count, page, limit));
    }
    async getUnreadCount(auth) {
        return await this.repository.countBy({
            recipient: { id: auth.user.id },
            readAt: (0, typeorm_1.IsNull)()
        });
    }
    async update(notificationId) {
        if (!notificationId)
            throw new BadRequestException_1.default('Notification id is empty.');
        const notification = await this.repository.findOneBy({ id: notificationId });
        if ((0, is_empty_1.default)(notification))
            throw new BadRequestException_1.default('Notification does not exists.');
        notification.readAt = new Date(Date.now()).toISOString();
        await this.repository.save(notification);
        return notification;
    }
    async readAll(auth) {
        await this.repository.update({
            recipient: { id: auth.user.id },
            readAt: (0, typeorm_1.IsNull)()
        }, {
            readAt: new Date(Date.now()).toISOString()
        });
        express_1.io.emit(`unread_notification_count_${auth.user.id}`, 0);
    }
    async create(payload) {
        if (!payload)
            throw new BadRequestException_1.default('Create notification payload is empty.');
        const isSameUserAndNotNeedNotification = payload.recipientId === payload.initiatorId;
        if (isSameUserAndNotNeedNotification)
            return;
        const notification = new Notification_1.Notification();
        notification.type = payload.type;
        notification.initiator = { id: payload.initiatorId };
        notification.recipient = { id: payload.recipientId };
        notification.post = { id: payload.postId };
        notification.comment = { id: payload.commentId };
        await this.repository.save(notification);
        const recipientUnreadNotificationCount = await this.repository.countBy({
            recipient: { id: payload.recipientId },
            readAt: (0, typeorm_1.IsNull)()
        });
        express_1.io.emit(`unread_notification_count_${payload.recipientId}`, recipientUnreadNotificationCount);
        return notification;
    }
}
exports.default = NotificationService;
//# sourceMappingURL=notification.service.js.map