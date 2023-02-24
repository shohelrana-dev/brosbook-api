"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaSource = void 0;
const tslib_1 = require("tslib");
const typeorm_1 = require("typeorm");
const AbstractEntity_1 = require("./AbstractEntity");
const User_1 = tslib_1.__importDefault(require("./User"));
var MediaSource;
(function (MediaSource) {
    MediaSource["CONVERSATION"] = "conversation";
    MediaSource["POST"] = "post";
    MediaSource["AVATAR"] = "avatar";
    MediaSource["COVER_PHOTO"] = "cover_photo";
    MediaSource["COMMENT"] = "comment";
})(MediaSource = exports.MediaSource || (exports.MediaSource = {}));
let Media = class Media extends AbstractEntity_1.AbstractEntity {
};
tslib_1.__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    tslib_1.__metadata("design:type", String)
], Media.prototype, "name", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    tslib_1.__metadata("design:type", String)
], Media.prototype, "url", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ nullable: false, length: 12 }),
    tslib_1.__metadata("design:type", String)
], Media.prototype, "format", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: false }),
    tslib_1.__metadata("design:type", Number)
], Media.prototype, "width", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: false }),
    tslib_1.__metadata("design:type", Number)
], Media.prototype, "height", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true }),
    tslib_1.__metadata("design:type", Number)
], Media.prototype, "size", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: MediaSource }),
    tslib_1.__metadata("design:type", String)
], Media.prototype, "source", void 0);
tslib_1.__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.default),
    (0, typeorm_1.JoinColumn)(),
    tslib_1.__metadata("design:type", User_1.default)
], Media.prototype, "creator", void 0);
Media = tslib_1.__decorate([
    (0, typeorm_1.Entity)('media')
], Media);
exports.default = Media;
//# sourceMappingURL=Media.js.map