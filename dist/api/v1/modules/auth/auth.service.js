"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const argon2_1 = tslib_1.__importDefault(require("argon2"));
const jsonwebtoken_1 = tslib_1.__importDefault(require("jsonwebtoken"));
const is_empty_1 = tslib_1.__importDefault(require("is-empty"));
const User_1 = tslib_1.__importDefault(require("../../entities/User"));
const BadRequestException_1 = tslib_1.__importDefault(require("../../exceptions/BadRequestException"));
const email_service_1 = require("../../services/email.service");
const user_service_1 = tslib_1.__importDefault(require("../users/user.service"));
const selectAllColumns_1 = require("../../utils/selectAllColumns");
class AuthService {
    constructor() {
        this.userService = new user_service_1.default();
        this.emailService = new email_service_1.EmailService();
    }
    async signup(userData) {
        if ((0, is_empty_1.default)(userData))
            throw new BadRequestException_1.default('Signup user data is empty.');
        const user = await this.userService.create(userData);
        this.emailService.sendEmailVerificationLink(userData.email, user.username);
        return user;
    }
    async login(userData) {
        if ((0, is_empty_1.default)(userData))
            throw new BadRequestException_1.default('Login user data is empty.');
        const { username, password } = userData;
        const user = await this.userService.repository.findOne({
            where: [
                { email: username },
                { username }
            ],
            select: (0, selectAllColumns_1.selectAllColumns)(this.userService.repository)
        });
        if (!user)
            throw new BadRequestException_1.default('User not found with the email or username.');
        const isPasswordMatched = await argon2_1.default.verify(user.password, password);
        if (!isPasswordMatched)
            throw new BadRequestException_1.default('Invalid password.');
        delete user.password;
        if (!user.hasEmailVerified) {
            return { access_token: null, expires_in: null, user, message: 'Email was not verified. ' };
        }
        return AuthService.createJwtLoginToken(user);
    }
    async loginWithGoogle(token) {
        const user = await this.userService.createWithGoogle(token);
        return AuthService.createJwtLoginToken(user);
    }
    async forgotPassword(email) {
        const user = await User_1.default.findOneBy({ email });
        if (!user)
            throw new BadRequestException_1.default('User not found with the email.');
        this.emailService.sendResetPasswordLink(email);
    }
    async resetPassword(payload) {
        const { password, token } = payload;
        let email = null;
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            email = decoded.email;
        }
        catch (e) {
            throw new BadRequestException_1.default('Invalid token.');
        }
        let user = await this.userService.repository.findOneBy({ email: email });
        if (!user)
            throw new BadRequestException_1.default('User doesn\'t exists.');
        user.password = await argon2_1.default.hash(password);
        user = await this.userService.repository.save(user);
        delete user.password;
        return user;
    }
    async verifyEmail(token) {
        let email = null;
        try {
            const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            email = payload.email;
        }
        catch (e) {
            throw new BadRequestException_1.default('Invalid token.');
        }
        let user = await this.userService.repository.findOneBy({ email });
        if (!user)
            throw new BadRequestException_1.default('User doesn\'t exists.');
        if (user.hasEmailVerified) {
            throw new BadRequestException_1.default('The email address already verified');
        }
        user.emailVerifiedAt = new Date(Date.now()).toISOString();
        user = await this.userService.repository.save(user);
        delete user.password;
        return user;
    }
    async resendEmailVerificationLink(email) {
        const user = await this.userService.repository.findOneBy({ email });
        if (!user)
            throw new BadRequestException_1.default('User doesn\'t exists.');
        this.emailService.sendEmailVerificationLink(user.email, user.username);
    }
    static createJwtLoginToken(user) {
        const dataStoredInToken = {
            id: user.id,
            username: user.username,
            email: user.email
        };
        const secretKey = process.env.JWT_SECRET;
        const expires_in = process.env.JWT_EXPIRY || '1h';
        let access_token = jsonwebtoken_1.default.sign(dataStoredInToken, secretKey, { expiresIn: expires_in });
        return { access_token, expires_in, token_type: 'Bearer', user };
    }
}
exports.default = AuthService;
//# sourceMappingURL=auth.service.js.map