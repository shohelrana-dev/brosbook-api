"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const auth_controller_1 = tslib_1.__importDefault(require("../auth/auth.controller"));
const auth_service_1 = tslib_1.__importDefault(require("./auth.service"));
const validation_middleware_1 = tslib_1.__importDefault(require("../../middleware/validation.middleware"));
const auth_dto_1 = require("../auth/auth.dto");
const auth_dto_2 = require("../auth/auth.dto");
const router = (0, express_1.Router)();
const authService = new auth_service_1.default();
const authController = new auth_controller_1.default(authService);
/**
 * @desc signup user
 * @route POST /api/api/auth/signup
 * @access Public
 */
router.post('/signup', (0, validation_middleware_1.default)(auth_dto_2.CreateUserDTO), authController.signup);
/**
 * @desc local login
 * @route POST /api/api/auth/login
 * @access Public
 */
router.post('/login', (0, validation_middleware_1.default)(auth_dto_1.LoginUserDTO), authController.login);
/**
 * @desc google login
 * @route POST /api/api/auth/google
 * @access Public
 */
router.post('/google', authController.loginWithGoogle);
/**
 * @desc forgot password
 * @route GET /api/api/auth/forgot_password
 * @access Public
 */
router.post('/forgot_password', (0, validation_middleware_1.default)(auth_dto_1.ForgotPasswordDTO), authController.forgotPassword);
/**
 * @desc reset password
 * @route POST /api/api/auth/forgot_password
 * @access Public
 */
router.post('/reset_password/:token', (0, validation_middleware_1.default)(auth_dto_1.ResetPasswordDTO), authController.resetPassword);
/**
 * @desc resend email verification link
 * @route POST /api/api/auth/email_verification/resend
 * @access Public
 */
router.post('/email_verification/resend', authController.resendEmailVerificationLink);
/**
 * @desc verify email
 * @route GET /api/api/auth/email_verification/:token
 * @access Public
 */
router.get('/email_verification/:token', authController.verifyEmail);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map