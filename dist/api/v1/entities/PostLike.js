"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const typeorm_1 = require("typeorm");
const AbstractEntity_1 = require("./AbstractEntity");
const Post_1 = tslib_1.__importDefault(require("./Post"));
const User_1 = tslib_1.__importDefault(require("./User"));
let PostLike = class PostLike extends AbstractEntity_1.AbstractEntity {
};
tslib_1.__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.default, { eager: true, onDelete: "CASCADE" }),
    tslib_1.__metadata("design:type", User_1.default)
], PostLike.prototype, "user", void 0);
tslib_1.__decorate([
    (0, typeorm_1.ManyToOne)(() => Post_1.default, { eager: true, onDelete: "CASCADE" }),
    tslib_1.__metadata("design:type", Post_1.default)
], PostLike.prototype, "post", void 0);
PostLike = tslib_1.__decorate([
    (0, typeorm_1.Entity)('post_likes')
], PostLike);
exports.default = PostLike;
//# sourceMappingURL=PostLike.js.map