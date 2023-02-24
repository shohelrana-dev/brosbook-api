"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const auth_middleware_1 = tslib_1.__importDefault(require("../../middleware/auth.middleware"));
const account_controller_1 = tslib_1.__importDefault(require("../account/account.controller"));
const account_service_1 = tslib_1.__importDefault(require("./account.service"));
const validation_middleware_1 = tslib_1.__importDefault(require("../../middleware/validation.middleware"));
const account_dto_1 = require("../account/account.dto");
const router = (0, express_1.Router)();
const accountService = new account_service_1.default();
const accountController = new account_controller_1.default(accountService);
/**
 * @desc Update user account profile
 * @route PUT /api/api/account/profile
 * @access Private
 */
router.put('/profile', auth_middleware_1.default, (0, validation_middleware_1.default)(account_dto_1.UpdateProfileDTO), accountController.updateProfile);
/**
 * @desc change account username
 * @route PUT /api/api/account/username
 * @access Private
 */
router.put('/username', auth_middleware_1.default, (0, validation_middleware_1.default)(account_dto_1.ChangeUsernameDTO), accountController.changeUsername);
/**
 * @desc change account password
 * @route PUT /api/api/account/password
 * @access Private
 */
router.put('/password', auth_middleware_1.default, (0, validation_middleware_1.default)(account_dto_1.ChangePasswordDTO), accountController.changePassword);
exports.default = router;
//# sourceMappingURL=account.routes.js.map