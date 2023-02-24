"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const AbstractEntity_1 = require("./AbstractEntity");
const typeorm_1 = require("typeorm");
const Message_1 = tslib_1.__importDefault(require("./Message"));
const User_1 = tslib_1.__importDefault(require("./User"));
let Reaction = class Reaction extends AbstractEntity_1.AbstractEntity {
};
tslib_1.__decorate([
    (0, typeorm_1.Column)({ nullable: false, length: 48 }),
    tslib_1.__metadata("design:type", String)
], Reaction.prototype, "messageId", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ length: 10, nullable: false }),
    tslib_1.__metadata("design:type", String)
], Reaction.prototype, "name", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    tslib_1.__metadata("design:type", String)
], Reaction.prototype, "url", void 0);
tslib_1.__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.default, { eager: true }),
    (0, typeorm_1.JoinColumn)(),
    tslib_1.__metadata("design:type", User_1.default)
], Reaction.prototype, "sender", void 0);
tslib_1.__decorate([
    (0, typeorm_1.ManyToOne)(() => Message_1.default, message => message.reactions),
    (0, typeorm_1.JoinColumn)({ name: 'messageId' }),
    tslib_1.__metadata("design:type", Message_1.default)
], Reaction.prototype, "message", void 0);
Reaction = tslib_1.__decorate([
    (0, typeorm_1.Entity)('reactions')
], Reaction);
exports.default = Reaction;
//# sourceMappingURL=Reaction.js.map