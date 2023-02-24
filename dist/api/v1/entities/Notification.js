"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = exports.NotificationTypes = void 0;
const tslib_1 = require("tslib");
const typeorm_1 = require("typeorm");
const AbstractEntity_1 = require("./AbstractEntity");
const Post_1 = tslib_1.__importDefault(require("./Post"));
const Comment_1 = tslib_1.__importDefault(require("./Comment"));
const User_1 = tslib_1.__importDefault(require("./User"));
var NotificationTypes;
(function (NotificationTypes) {
    NotificationTypes["LIKED_POST"] = "liked_post";
    NotificationTypes["COMMENTED_POST"] = "commented_post";
    NotificationTypes["LIKED_COMMENT"] = "liked_comment";
    NotificationTypes["FOLLOWED"] = "followed";
})(NotificationTypes = exports.NotificationTypes || (exports.NotificationTypes = {}));
let Notification = class Notification extends AbstractEntity_1.AbstractEntity {
    setIsRead() {
        this.isRead = !!this.readAt;
    }
};
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: NotificationTypes, nullable: false }),
    tslib_1.__metadata("design:type", String)
], Notification.prototype, "type", void 0);
tslib_1.__decorate([
    (0, typeorm_1.ManyToOne)(() => Post_1.default, { onDelete: "CASCADE" }),
    tslib_1.__metadata("design:type", Post_1.default)
], Notification.prototype, "post", void 0);
tslib_1.__decorate([
    (0, typeorm_1.ManyToOne)(() => Comment_1.default, { onDelete: "CASCADE" }),
    tslib_1.__metadata("design:type", Comment_1.default)
], Notification.prototype, "comment", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    tslib_1.__metadata("design:type", String)
], Notification.prototype, "readAt", void 0);
tslib_1.__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.default, { nullable: false }),
    tslib_1.__metadata("design:type", User_1.default)
], Notification.prototype, "recipient", void 0);
tslib_1.__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.default, { eager: true, nullable: false }),
    tslib_1.__metadata("design:type", User_1.default
    //virtual column
    )
], Notification.prototype, "initiator", void 0);
tslib_1.__decorate([
    (0, typeorm_1.AfterLoad)(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], Notification.prototype, "setIsRead", null);
Notification = tslib_1.__decorate([
    (0, typeorm_1.Entity)('notifications')
], Notification);
exports.Notification = Notification;
//# sourceMappingURL=Notification.js.map