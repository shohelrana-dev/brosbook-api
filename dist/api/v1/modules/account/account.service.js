"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const argon2_1 = tslib_1.__importDefault(require("argon2"));
const Profile_1 = tslib_1.__importDefault(require("../../entities/Profile"));
const BadRequestException_1 = tslib_1.__importDefault(require("../../exceptions/BadRequestException"));
const UnprocessableEntityException_1 = tslib_1.__importDefault(require("../../exceptions/UnprocessableEntityException"));
const is_empty_1 = tslib_1.__importDefault(require("is-empty"));
const user_service_1 = tslib_1.__importDefault(require("../users/user.service"));
const selectAllColumns_1 = require("../../utils/selectAllColumns");
class AccountService {
    constructor() {
        this.userService = new user_service_1.default();
    }
    async updateProfile(userData, auth) {
        if ((0, is_empty_1.default)(userData))
            throw new BadRequestException_1.default('User data is empty');
        const { firstName, lastName, bio, phone, location, birthdate, gender } = userData;
        const user = await this.userService.repository.findOneBy({ id: auth.user.id });
        if (!user)
            throw new BadRequestException_1.default('User doesn\'t exists.');
        const profile = await Profile_1.default.findOneBy({ user: { id: user.id } });
        profile.bio = bio;
        profile.phone = phone;
        profile.location = location;
        profile.birthdate = birthdate;
        profile.gender = gender;
        await this.userService.profileRepository.save(profile);
        user.firstName = firstName;
        user.lastName = lastName;
        user.profile = profile;
        await this.userService.repository.save(user);
        return user;
    }
    async changeUsername(changeUsernameData, auth) {
        if ((0, is_empty_1.default)(changeUsernameData))
            throw new BadRequestException_1.default('Change username data is empty');
        const { username, password } = changeUsernameData;
        const user = await this.userService.repository.findOne({
            where: { id: auth.user.id },
            select: (0, selectAllColumns_1.selectAllColumns)(this.userService.repository)
        });
        if (!user)
            throw new BadRequestException_1.default("User doesn't exists.");
        const isPasswordMatching = await argon2_1.default.verify(user.password, password);
        if (!isPasswordMatching)
            throw new UnprocessableEntityException_1.default("Invalid Password.");
        user.username = username;
        await this.userService.repository.save(user);
        delete user.password;
        return user;
    }
    async changePassword(changePasswordData, auth) {
        if ((0, is_empty_1.default)(changePasswordData))
            throw new BadRequestException_1.default('Change password data is empty');
        const { currentPassword, newPassword } = changePasswordData;
        const user = await this.userService.repository.findOne({
            where: { id: auth.user.id },
            select: (0, selectAllColumns_1.selectAllColumns)(this.userService.repository)
        });
        if (!user)
            throw new BadRequestException_1.default("User doesn't exists.");
        const isPasswordMatching = await argon2_1.default.verify(user.password, currentPassword);
        if (!isPasswordMatching)
            throw new UnprocessableEntityException_1.default("Current password invalid.");
        user.password = await argon2_1.default.hash(newPassword);
        await this.userService.repository.save(user);
        delete user.password;
        return user;
    }
}
exports.default = AccountService;
//# sourceMappingURL=account.service.js.map