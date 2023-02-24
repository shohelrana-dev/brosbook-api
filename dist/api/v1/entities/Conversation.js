"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const typeorm_1 = require("typeorm");
const AbstractEntity_1 = require("./AbstractEntity");
const User_1 = tslib_1.__importDefault(require("./User"));
const Message_1 = tslib_1.__importDefault(require("./Message"));
let Conversation = class Conversation extends AbstractEntity_1.AbstractEntity {
};
tslib_1.__decorate([
    (0, typeorm_1.Column)({ length: 48, nullable: true }),
    tslib_1.__metadata("design:type", String)
], Conversation.prototype, "lastMessageId", void 0);
tslib_1.__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.default),
    tslib_1.__metadata("design:type", User_1.default)
], Conversation.prototype, "user1", void 0);
tslib_1.__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.default),
    tslib_1.__metadata("design:type", User_1.default)
], Conversation.prototype, "user2", void 0);
tslib_1.__decorate([
    (0, typeorm_1.OneToMany)(() => Message_1.default, message => message.conversation),
    tslib_1.__metadata("design:type", Array)
], Conversation.prototype, "messages", void 0);
tslib_1.__decorate([
    (0, typeorm_1.OneToOne)(() => Message_1.default),
    (0, typeorm_1.JoinColumn)({ name: 'lastMessageId' }),
    tslib_1.__metadata("design:type", Message_1.default
    //virtual column
    )
], Conversation.prototype, "lastMessage", void 0);
Conversation = tslib_1.__decorate([
    (0, typeorm_1.Entity)('conversations')
], Conversation);
exports.default = Conversation;
//# sourceMappingURL=Conversation.js.map