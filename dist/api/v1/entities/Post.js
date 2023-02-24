"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const typeorm_1 = require("typeorm");
const Comment_1 = tslib_1.__importDefault(require("./Comment"));
const User_1 = tslib_1.__importDefault(require("./User"));
const PostLike_1 = tslib_1.__importDefault(require("./PostLike"));
const AbstractEntity_1 = require("./AbstractEntity");
const Media_1 = tslib_1.__importDefault(require("./Media"));
let Post = class Post extends AbstractEntity_1.AbstractEntity {
    async setViewerProperties(auth) {
        if (auth.isAuthenticated) {
            const like = await PostLike_1.default.findOneBy({ user: { id: auth.user.id }, post: { id: this.id } });
            this.isViewerLiked = Boolean(like);
        }
        else {
            this.isViewerLiked = false;
        }
        if (this.author) {
            await this.author.setViewerProperties(auth);
        }
        return this;
    }
};
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    tslib_1.__metadata("design:type", String)
], Post.prototype, "body", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    tslib_1.__metadata("design:type", Number)
], Post.prototype, "commentsCount", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    tslib_1.__metadata("design:type", Number)
], Post.prototype, "likesCount", void 0);
tslib_1.__decorate([
    (0, typeorm_1.OneToOne)(() => Media_1.default, { eager: true, nullable: true }),
    (0, typeorm_1.JoinColumn)(),
    tslib_1.__metadata("design:type", Media_1.default)
], Post.prototype, "image", void 0);
tslib_1.__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.default, { eager: true, nullable: false }),
    tslib_1.__metadata("design:type", User_1.default)
], Post.prototype, "author", void 0);
tslib_1.__decorate([
    (0, typeorm_1.OneToMany)(() => Comment_1.default, comment => comment.post),
    tslib_1.__metadata("design:type", Array)
], Post.prototype, "comments", void 0);
tslib_1.__decorate([
    (0, typeorm_1.OneToMany)(() => PostLike_1.default, like => like.post),
    tslib_1.__metadata("design:type", Array)
], Post.prototype, "likes", void 0);
Post = tslib_1.__decorate([
    (0, typeorm_1.Entity)('posts')
], Post);
exports.default = Post;
//# sourceMappingURL=Post.js.map