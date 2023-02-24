"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const AbstractEntity_1 = require("./AbstractEntity");
const typeorm_1 = require("typeorm");
const User_1 = tslib_1.__importDefault(require("./User"));
let Relationship = class Relationship extends AbstractEntity_1.AbstractEntity {
};
tslib_1.__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.default, user => user.followings, { eager: true }),
    (0, typeorm_1.JoinColumn)(),
    tslib_1.__metadata("design:type", User_1.default)
], Relationship.prototype, "following", void 0);
tslib_1.__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.default, user => user.followers, { eager: true }),
    (0, typeorm_1.JoinColumn)(),
    tslib_1.__metadata("design:type", User_1.default)
], Relationship.prototype, "follower", void 0);
Relationship = tslib_1.__decorate([
    (0, typeorm_1.Entity)('relationships')
], Relationship);
exports.default = Relationship;
//# sourceMappingURL=Relationship.js.map