"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const typeorm_1 = require("typeorm");
const argon2_1 = tslib_1.__importDefault(require("argon2"));
const Profile_1 = tslib_1.__importDefault(require("./Profile"));
const AbstractEntity_1 = require("./AbstractEntity");
const Media_1 = tslib_1.__importDefault(require("./Media"));
const Relationship_1 = tslib_1.__importDefault(require("./Relationship"));
let User = class User extends AbstractEntity_1.AbstractEntity {
    async makePasswordHash() {
        this.password = await argon2_1.default.hash(this.password);
    }
    generateUsernameFromEmail() {
        if (!this.username) {
            const nameParts = this.email.split("@");
            this.username = nameParts[0].toLowerCase();
        }
    }
    setFullName() {
        this.fullName = `${this.firstName} ${this.lastName}`;
    }
    setEmailVerified() {
        this.hasEmailVerified = this.emailVerifiedAt !== null && !!this.emailVerifiedAt;
    }
    setDefaultAvatar() {
        if (!this.avatar) {
            this.avatar = { url: `${process.env.SERVER_URL}/avatar.png` };
        }
    }
    async setViewerProperties(auth) {
        const relationship = await Relationship_1.default.findOneBy({
            follower: { id: auth.user.id },
            following: { id: this.id }
        });
        this.isViewerFollow = Boolean(relationship);
        return this;
    }
};
tslib_1.__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: false }),
    tslib_1.__metadata("design:type", String)
], User.prototype, "firstName", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: false }),
    tslib_1.__metadata("design:type", String)
], User.prototype, "lastName", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 25, nullable: false }),
    tslib_1.__metadata("design:type", String)
], User.prototype, "username", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 50, nullable: false }),
    tslib_1.__metadata("design:type", String)
], User.prototype, "email", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: false, select: false }),
    tslib_1.__metadata("design:type", String)
], User.prototype, "password", void 0);
tslib_1.__decorate([
    (0, typeorm_1.OneToOne)(() => Media_1.default, { eager: true }),
    (0, typeorm_1.JoinColumn)(),
    tslib_1.__metadata("design:type", Media_1.default)
], User.prototype, "avatar", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: 0 }),
    tslib_1.__metadata("design:type", Number)
], User.prototype, "active", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    tslib_1.__metadata("design:type", String)
], User.prototype, "emailVerifiedAt", void 0);
tslib_1.__decorate([
    (0, typeorm_1.OneToOne)(() => Profile_1.default, (profile) => profile.user),
    tslib_1.__metadata("design:type", Profile_1.default)
], User.prototype, "profile", void 0);
tslib_1.__decorate([
    (0, typeorm_1.OneToMany)(() => Relationship_1.default, (relationship) => relationship.follower),
    tslib_1.__metadata("design:type", Array)
], User.prototype, "followers", void 0);
tslib_1.__decorate([
    (0, typeorm_1.OneToMany)(() => Relationship_1.default, (relationship) => relationship.following),
    tslib_1.__metadata("design:type", Array)
], User.prototype, "followings", void 0);
tslib_1.__decorate([
    (0, typeorm_1.BeforeInsert)(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], User.prototype, "makePasswordHash", null);
tslib_1.__decorate([
    (0, typeorm_1.BeforeInsert)(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], User.prototype, "generateUsernameFromEmail", null);
tslib_1.__decorate([
    (0, typeorm_1.AfterLoad)(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], User.prototype, "setFullName", null);
tslib_1.__decorate([
    (0, typeorm_1.AfterLoad)(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], User.prototype, "setEmailVerified", null);
tslib_1.__decorate([
    (0, typeorm_1.AfterLoad)(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], User.prototype, "setDefaultAvatar", null);
User = tslib_1.__decorate([
    (0, typeorm_1.Entity)('users')
], User);
exports.default = User;
//# sourceMappingURL=User.js.map