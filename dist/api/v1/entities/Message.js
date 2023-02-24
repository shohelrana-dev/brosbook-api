"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageType = void 0;
const tslib_1 = require("tslib");
const AbstractEntity_1 = require("./AbstractEntity");
const typeorm_1 = require("typeorm");
const Reaction_1 = tslib_1.__importDefault(require("./Reaction"));
const Conversation_1 = tslib_1.__importDefault(require("./Conversation"));
const User_1 = tslib_1.__importDefault(require("./User"));
const Media_1 = tslib_1.__importDefault(require("./Media"));
var MessageType;
(function (MessageType) {
    MessageType["IMAGE"] = "image";
    MessageType["FILE"] = "file";
    MessageType["TEXT"] = "text";
    MessageType["EMOJI"] = "emoji";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
let Message = class Message extends AbstractEntity_1.AbstractEntity {
};
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    tslib_1.__metadata("design:type", String)
], Message.prototype, "body", void 0);
tslib_1.__decorate([
    (0, typeorm_1.OneToOne)(() => Media_1.default, { eager: true }),
    (0, typeorm_1.JoinColumn)(),
    tslib_1.__metadata("design:type", Media_1.default)
], Message.prototype, "image", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: MessageType, default: MessageType.TEXT }),
    tslib_1.__metadata("design:type", String)
], Message.prototype, "type", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    tslib_1.__metadata("design:type", Date)
], Message.prototype, "seenAt", void 0);
tslib_1.__decorate([
    (0, typeorm_1.ManyToOne)(() => Conversation_1.default, conversation => conversation.messages, { eager: true, onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)(),
    tslib_1.__metadata("design:type", Conversation_1.default)
], Message.prototype, "conversation", void 0);
tslib_1.__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.default, { eager: true }),
    (0, typeorm_1.JoinColumn)(),
    tslib_1.__metadata("design:type", User_1.default)
], Message.prototype, "sender", void 0);
tslib_1.__decorate([
    (0, typeorm_1.OneToMany)(() => Reaction_1.default, reaction => reaction.message, { eager: true }),
    tslib_1.__metadata("design:type", Array)
], Message.prototype, "reactions", void 0);
Message = tslib_1.__decorate([
    (0, typeorm_1.Entity)('messages')
], Message);
exports.default = Message;
//# sourceMappingURL=Message.js.map