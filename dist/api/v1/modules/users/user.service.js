"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const Relationship_1 = tslib_1.__importDefault(require("../../entities/Relationship"));
const User_1 = tslib_1.__importDefault(require("../../entities/User"));
const paginateMeta_1 = require("../../utils/paginateMeta");
const data_source_1 = require("../../../../config/data-source");
const BadRequestException_1 = tslib_1.__importDefault(require("../../exceptions/BadRequestException"));
const Media_1 = require("../../entities/Media");
const media_service_1 = tslib_1.__importDefault(require("../../services/media.service"));
const NotFoundException_1 = tslib_1.__importDefault(require("../../exceptions/NotFoundException"));
const is_empty_1 = tslib_1.__importDefault(require("is-empty"));
const Profile_1 = tslib_1.__importDefault(require("../../entities/Profile"));
const google_auth_library_1 = require("google-auth-library");
const UnauthorizedException_1 = tslib_1.__importDefault(require("../../exceptions/UnauthorizedException"));
const uuid_1 = require("uuid");
const notification_service_1 = tslib_1.__importDefault(require("../notifications/notification.service"));
const Notification_1 = require("../../entities/Notification");
const typeorm_1 = require("typeorm");
const cross_fetch_1 = tslib_1.__importDefault(require("cross-fetch"));
class UserService {
    constructor() {
        this.repository = data_source_1.appDataSource.getRepository(User_1.default);
        this.profileRepository = data_source_1.appDataSource.getRepository(Profile_1.default);
        this.relationshipRepository = data_source_1.appDataSource.getRepository(Relationship_1.default);
        this.mediaService = new media_service_1.default();
        this.notificationService = new notification_service_1.default();
    }
    async create(userData) {
        if ((0, is_empty_1.default)(userData))
            throw new BadRequestException_1.default('User data is empty.');
        let user = new User_1.default();
        user.firstName = userData.firstName;
        user.lastName = userData.lastName;
        user.email = userData.email;
        user.username = userData.username;
        user.password = userData.password;
        await this.repository.save(user);
        await this.profileRepository.create({ user }).save();
        return user;
    }
    async createWithGoogle(token) {
        if (!token)
            throw new BadRequestException_1.default('Token is empty.');
        const oAuthClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        let tokenPayload = null;
        try {
            const ticket = await oAuthClient.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            tokenPayload = ticket.getPayload();
        }
        catch (e) {
            throw new UnauthorizedException_1.default('Invalid access token.');
        }
        let user = await this.repository.findOneBy({ email: tokenPayload.email });
        //make user verified
        if (user && !user.hasEmailVerified) {
            user.emailVerifiedAt = new Date(Date.now()).toISOString();
            await this.repository.save(user);
        }
        if (user)
            return user;
        //create user
        user = new User_1.default();
        user.firstName = tokenPayload.given_name;
        user.lastName = tokenPayload.family_name;
        user.email = tokenPayload.email;
        user.password = (0, uuid_1.v4)();
        user = await this.repository.save(user);
        //save photo
        user.avatar = await this.mediaService.save({
            file: Buffer.from(await (await (0, cross_fetch_1.default)(tokenPayload.picture)).arrayBuffer()),
            source: Media_1.MediaSource.AVATAR,
            creatorId: user.id
        });
        await this.repository.save(user);
        await this.profileRepository.create({ user }).save();
        return user;
    }
    async getCurrentUser(auth) {
        return await this.repository.findOneOrFail({
            where: { id: auth.user.id },
            relations: { profile: true }
        });
    }
    async getUserById(userId, auth) {
        if (!userId)
            throw new BadRequestException_1.default("User id is empty.");
        const user = await this.repository.findOne({
            where: { id: userId },
            relations: { profile: true }
        });
        if (!user)
            throw new NotFoundException_1.default('User doesn\'t exists.');
        await user.setViewerProperties(auth);
        return user;
    }
    async getUserByUsername(username, auth) {
        if (!username)
            throw new BadRequestException_1.default("Username is empty.");
        const user = await this.repository.findOne({
            where: { username },
            relations: { profile: true }
        });
        if (!user)
            throw new NotFoundException_1.default('User doesn\'t exists.');
        await user.setViewerProperties(auth);
        return user;
    }
    async getFollowersCount(userId) {
        if (!userId)
            throw new BadRequestException_1.default("User id is empty.");
        return await Relationship_1.default.countBy({ following: { id: userId } });
    }
    async getFollowingsCount(userId) {
        if (!userId)
            throw new BadRequestException_1.default("User id is empty.");
        return await Relationship_1.default.countBy({ follower: { id: userId } });
    }
    async searchUsers(params, auth) {
        const key = params.key;
        const page = params.page || 1;
        const limit = params.limit || 16;
        const skip = limit * (page - 1);
        const [users, count] = await this.repository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.avatar', 'avatar')
            .where('user.id != :userId', { userId: auth.user.id })
            .andWhere(new typeorm_1.Brackets((qb) => {
            qb.where('user.firstName LIKE :key', { key: `%${key}%` });
            qb.orWhere('user.lastName LIKE :key', { key: `%${key}%` });
        }))
            .orderBy('user.createdAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();
        const formattedUsers = await Promise.all(users.map(user => user.setViewerProperties(auth)));
        return Object.assign({ items: formattedUsers }, (0, paginateMeta_1.paginateMeta)(count, page, limit));
    }
    async getSuggestions(params, auth) {
        const page = params.page || 1;
        const limit = params.limit || 6;
        const skip = limit * (page - 1);
        const currentUserFollowings = await this.relationshipRepository
            .createQueryBuilder('relationship')
            .leftJoin('relationship.follower', 'follower')
            .leftJoin('relationship.following', 'following')
            .where('follower.id = :userId', { userId: auth.user.id })
            .select('relationship.id')
            .addSelect('following.id')
            .getMany();
        let currentUserFollowingIds = currentUserFollowings.map(rel => rel.following.id);
        currentUserFollowingIds = (0, is_empty_1.default)(currentUserFollowings) ? [""] : currentUserFollowingIds;
        const [users, count] = await this.repository
            .createQueryBuilder('user')
            .leftJoin('user.followings', 'following')
            .leftJoin('user.followers', 'follower')
            .leftJoinAndSelect('user.avatar', 'avatar')
            .leftJoinAndSelect('user.profile', 'profile')
            .where('user.id != :userId', { userId: auth.user.id })
            .andWhere('user.id NOT IN (:...userIds)', { userIds: currentUserFollowingIds })
            .orderBy('user.createdAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();
        const formattedUsers = await Promise.all(users.map(user => user.setViewerProperties(auth)));
        return Object.assign({ items: formattedUsers }, (0, paginateMeta_1.paginateMeta)(count, page, limit));
    }
    async getFollowers(userId, params, auth) {
        if (!userId)
            throw new BadRequestException_1.default("User id is empty.");
        const page = params.page || 1;
        const limit = params.limit || 10;
        const skip = limit * (page - 1);
        const [relationships, count] = await this.relationshipRepository
            .createQueryBuilder('relationship')
            .leftJoin('relationship.follower', 'follower')
            .leftJoin('relationship.following', 'following')
            .leftJoinAndSelect('follower.avatar', 'followerAvatar')
            .leftJoinAndSelect('following.avatar', 'followingAvatar')
            .leftJoinAndSelect('follower.profile', 'followerProfile')
            .leftJoinAndSelect('following.profile', 'followingProfile')
            .where('following.id = :followingId', { followingId: userId })
            .select('relationship.id')
            .addSelect('follower')
            .addSelect('following')
            .take(limit)
            .skip(skip)
            .getManyAndCount();
        const followers = relationships.map(rel => rel.follower);
        const formattedFollowers = await Promise.all(followers.map(user => user.setViewerProperties(auth)));
        return Object.assign({ items: formattedFollowers }, (0, paginateMeta_1.paginateMeta)(count, page, limit));
    }
    async getFollowings(userId, params, auth) {
        if (!userId)
            throw new BadRequestException_1.default("User id is empty.");
        const page = params.page || 1;
        const limit = params.limit || 10;
        const skip = limit * (page - 1);
        const [relationships, count] = await this.relationshipRepository
            .createQueryBuilder('relationship')
            .leftJoin('relationship.following', 'following')
            .leftJoin('relationship.follower', 'follower')
            .leftJoinAndSelect('follower.avatar', 'followerAvatar')
            .leftJoinAndSelect('following.avatar', 'followingAvatar')
            .leftJoinAndSelect('follower.profile', 'followerProfile')
            .leftJoinAndSelect('following.profile', 'followingProfile')
            .where('follower.id = :followerId', { followerId: userId })
            .select('relationship.id')
            .addSelect('following')
            .addSelect('follower')
            .take(limit)
            .skip(skip)
            .getManyAndCount();
        const followings = relationships.map(rel => rel.following);
        const formattedFollowings = await Promise.all(followings.map(user => user.setViewerProperties(auth)));
        return Object.assign({ items: formattedFollowings }, (0, paginateMeta_1.paginateMeta)(count, page, limit));
    }
    async changeAvatar(avatar, auth) {
        if (!avatar)
            throw new BadRequestException_1.default("Avatar is empty.");
        const user = await this.repository.findOneBy({ id: auth.user.id });
        user.avatar = await this.mediaService.save({
            file: avatar.data,
            creatorId: auth.user.id,
            source: Media_1.MediaSource.AVATAR
        });
        return await this.repository.save(user);
    }
    async changeCoverPhoto(coverPhoto, auth) {
        if (!coverPhoto)
            throw new BadRequestException_1.default("Cover photo is empty.");
        const user = await this.repository.findOneBy({ id: auth.user.id });
        const profile = await this.profileRepository.findOneBy({ user: { id: auth.user.id } });
        if (!user || !profile)
            throw new BadRequestException_1.default("User does not exists.");
        profile.coverPhoto = await this.mediaService.save({
            file: coverPhoto.data,
            creatorId: auth.user.id,
            source: Media_1.MediaSource.COVER_PHOTO
        });
        await this.profileRepository.save(profile);
        user.profile = profile;
        return user;
    }
    async follow(targetUserId, auth) {
        if (!targetUserId)
            throw new BadRequestException_1.default('Target user id is empty.');
        const targetUser = await this.repository.findOneBy({ id: targetUserId });
        if (!targetUser)
            throw new BadRequestException_1.default('Target user does not exists.');
        await this.relationshipRepository.create({ follower: { id: auth.user.id }, following: targetUser }).save();
        targetUser.isViewerFollow = true;
        this.notificationService.create({
            initiatorId: auth.user.id,
            recipientId: targetUserId,
            type: Notification_1.NotificationTypes.FOLLOWED
        });
        return targetUser;
    }
    async unfollow(targetUserId, auth) {
        if (!targetUserId)
            throw new BadRequestException_1.default('Target user id is empty.');
        const targetUser = await this.repository.findOneBy({ id: targetUserId });
        if (!targetUser)
            throw new BadRequestException_1.default('Target user does not exists.');
        await this.relationshipRepository.delete({ follower: { id: auth.user.id }, following: { id: targetUser.id } });
        targetUser.isViewerFollow = false;
        return targetUser;
    }
}
exports.default = UserService;
//# sourceMappingURL=user.service.js.map