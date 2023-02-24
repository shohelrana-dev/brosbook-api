"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractEntity = void 0;
const tslib_1 = require("tslib");
const typeorm_1 = require("typeorm");
const nanoid_1 = require("nanoid");
class AbstractEntity extends typeorm_1.BaseEntity {
    generateId() {
        this.id = (0, nanoid_1.nanoid)();
    }
}
tslib_1.__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 30,
        unique: true,
        primary: true
    }),
    tslib_1.__metadata("design:type", String)
], AbstractEntity.prototype, "id", void 0);
tslib_1.__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    tslib_1.__metadata("design:type", Date)
], AbstractEntity.prototype, "createdAt", void 0);
tslib_1.__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    tslib_1.__metadata("design:type", Date)
], AbstractEntity.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    (0, typeorm_1.DeleteDateColumn)({ select: false }),
    tslib_1.__metadata("design:type", Date)
], AbstractEntity.prototype, "deletedAt", void 0);
tslib_1.__decorate([
    (0, typeorm_1.BeforeInsert)(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], AbstractEntity.prototype, "generateId", null);
exports.AbstractEntity = AbstractEntity;
//# sourceMappingURL=AbstractEntity.js.map