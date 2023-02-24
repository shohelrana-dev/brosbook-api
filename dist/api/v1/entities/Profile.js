"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const AbstractEntity_1 = require("./AbstractEntity");
const User_1 = tslib_1.__importDefault(require("./User"));
const typeorm_1 = require("typeorm");
const Media_1 = tslib_1.__importDefault(require("./Media"));
let Profile = class Profile extends AbstractEntity_1.AbstractEntity {
};
tslib_1.__decorate([
    (0, typeorm_1.Column)({ length: 16, nullable: true }),
    tslib_1.__metadata("design:type", String)
], Profile.prototype, "phone", void 0);
tslib_1.__decorate([
    (0, typeorm_1.OneToOne)(() => Media_1.default, { eager: true }),
    (0, typeorm_1.JoinColumn)(),
    tslib_1.__metadata("design:type", Media_1.default)
], Profile.prototype, "coverPhoto", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['male', 'female'],
        nullable: true
    }),
    tslib_1.__metadata("design:type", String)
], Profile.prototype, "gender", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    tslib_1.__metadata("design:type", String)
], Profile.prototype, "bio", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    tslib_1.__metadata("design:type", String)
], Profile.prototype, "location", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    tslib_1.__metadata("design:type", String)
], Profile.prototype, "birthdate", void 0);
tslib_1.__decorate([
    (0, typeorm_1.OneToOne)(() => User_1.default, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    tslib_1.__metadata("design:type", User_1.default)
], Profile.prototype, "user", void 0);
Profile = tslib_1.__decorate([
    (0, typeorm_1.Entity)('profile')
], Profile);
exports.default = Profile;
//# sourceMappingURL=Profile.js.map