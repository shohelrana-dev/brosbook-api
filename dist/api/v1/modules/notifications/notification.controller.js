"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class NotificationController {
    constructor(notificationService) {
        this.notificationService = notificationService;
        this.getMany = async (req, res, next) => {
            try {
                const notifications = await this.notificationService.getMany(req.query, req.auth);
                res.json(notifications);
            }
            catch (err) {
                next(err);
            }
        };
        this.getUnreadCount = async (req, res, next) => {
            try {
                const count = await this.notificationService.getUnreadCount(req.auth);
                res.json({ count });
            }
            catch (err) {
                next(err);
            }
        };
        this.readAll = async (req, res, next) => {
            try {
                await this.notificationService.readAll(req.auth);
                res.json();
            }
            catch (err) {
                next(err);
            }
        };
    }
}
exports.default = NotificationController;
//# sourceMappingURL=notification.controller.js.map