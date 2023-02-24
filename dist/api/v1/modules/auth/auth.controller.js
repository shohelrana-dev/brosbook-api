"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AuthController {
    constructor(authService) {
        this.authService = authService;
        this.signup = async (req, res, next) => {
            try {
                //create the user
                const user = await this.authService.signup(req.body);
                //send success response
                res.status(201).json(user);
            }
            catch (err) {
                next(err);
            }
        };
        this.login = async (req, res, next) => {
            try {
                //attempt login
                const loginData = await this.authService.login(req.body);
                res.json(loginData);
            }
            catch (err) {
                next(err);
            }
        };
        this.loginWithGoogle = async (req, res, next) => {
            try {
                const loginData = await this.authService.loginWithGoogle(req.body.token);
                res.json(loginData);
            }
            catch (err) {
                next(err);
            }
        };
        this.forgotPassword = async (req, res, next) => {
            try {
                await this.authService.forgotPassword(req.body.email);
                res.json({ message: `We've sent an email to ${req.body.email} with a link to get back into your account.` });
            }
            catch (err) {
                next(err);
            }
        };
        this.resetPassword = async (req, res, next) => {
            try {
                await this.authService.resetPassword(Object.assign(Object.assign({}, req.body), { token: req.params.token }));
                res.json({ message: 'Password has been changed' });
            }
            catch (err) {
                next(err);
            }
        };
        this.verifyEmail = async (req, res, next) => {
            try {
                const user = await this.authService.verifyEmail(req.params.token);
                res.json(user);
            }
            catch (err) {
                next(err);
            }
        };
        this.resendEmailVerificationLink = async (req, res, next) => {
            try {
                await this.authService.resendEmailVerificationLink(req.body.email);
                res.json({ message: 'Success resending email' });
            }
            catch (err) {
                next(err);
            }
        };
    }
}
exports.default = AuthController;
//# sourceMappingURL=auth.controller.js.map