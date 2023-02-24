"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const typeorm_1 = require("typeorm");
const AbstractEntity_1 = require("./AbstractEntity");
const Post_1 = tslib_1.__importDefault(require("./Post"));
const User_1 = tslib_1.__importDefault(require("./User"));
const CommentLike_1 = tslib_1.__importDefault(require("./CommentLike"));
let Comment = class Comment extends AbstractEntity_1.AbstractEntity {
    async setViewerProperties(auth) {
        const like = await CommentLike_1.default.findOneBy({ user: { id: auth.user.id }, comment: { id: this.id } });
        this.isViewerLiked = Boolean(like);
        if (this.author) {
            await this.author.setViewerProperties(auth);
        }
        return this;
    }
};
tslib_1.__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    tslib_1.__metadata("design:type", String)
], Comment.prototype, "postId", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    tslib_1.__metadata("design:type", String)
], Comment.prototype, "body", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    tslib_1.__metadata("design:type", Number)
], Comment.prototype, "likesCount", void 0);
tslib_1.__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.default, { eager: true }),
    tslib_1.__metadata("design:type", User_1.default)
], Comment.prototype, "author", void 0);
tslib_1.__decorate([
    (0, typeorm_1.ManyToOne)(() => Post_1.default, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: 'postId', referencedColumnName: 'id' }),
    tslib_1.__metadata("design:type", Post_1.default)
], Comment.prototype, "post", void 0);
tslib_1.__decorate([
    (0, typeorm_1.OneToMany)(() => CommentLike_1.default, like => like.comment),
    tslib_1.__metadata("design:type", Array)
], Comment.prototype, "likes", void 0);
Comment = tslib_1.__decorate([
    (0, typeorm_1.Entity)('comments')
], Comment);
exports.default = Comment;
//# sourceMappingURL=Comment.js.map