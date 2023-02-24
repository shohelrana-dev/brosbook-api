"use strict";
var CommentLike_1;
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const typeorm_1 = require("typeorm");
const AbstractEntity_1 = require("./AbstractEntity");
const User_1 = tslib_1.__importDefault(require("./User"));
const Comment_1 = tslib_1.__importDefault(require("./Comment"));
const data_source_1 = require("../../../config/data-source");
let CommentLike = CommentLike_1 = class CommentLike extends AbstractEntity_1.AbstractEntity {
    updateCommentLikesCount() {
        const commentRepo = data_source_1.appDataSource.getRepository(Comment_1.default);
        const commentLikesRepo = data_source_1.appDataSource.getRepository(CommentLike_1);
        commentLikesRepo.countBy({ comment: { id: this.comment.id } }).then((count) => {
            commentRepo.update({ id: this.comment.id }, { likesCount: count });
        });
    }
};
tslib_1.__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.default),
    tslib_1.__metadata("design:type", User_1.default)
], CommentLike.prototype, "user", void 0);
tslib_1.__decorate([
    (0, typeorm_1.ManyToOne)(() => Comment_1.default, { onDelete: "CASCADE" }),
    tslib_1.__metadata("design:type", Comment_1.default)
], CommentLike.prototype, "comment", void 0);
tslib_1.__decorate([
    (0, typeorm_1.AfterInsert)(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], CommentLike.prototype, "updateCommentLikesCount", null);
CommentLike = CommentLike_1 = tslib_1.__decorate([
    (0, typeorm_1.Entity)('comment_likes')
], CommentLike);
exports.default = CommentLike;
//# sourceMappingURL=CommentLike.js.map