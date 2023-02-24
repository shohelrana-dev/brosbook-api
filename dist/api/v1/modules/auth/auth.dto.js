"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetPasswordDTO = exports.ForgotPasswordDTO = exports.LoginUserDTO = exports.CreateUserDTO = void 0;
const tslib_1 = require("tslib");
const class_validator_1 = require("class-validator");
const customValidation_1 = require("../../utils/customValidation");
class CreateUserDTO {
}
tslib_1.__decorate([
    (0, class_validator_1.MaxLength)(48),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], CreateUserDTO.prototype, "firstName", void 0);
tslib_1.__decorate([
    (0, class_validator_1.MaxLength)(48),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], CreateUserDTO.prototype, "lastName", void 0);
tslib_1.__decorate([
    (0, class_validator_1.Validate)(customValidation_1.IsUsernameAlreadyExist),
    (0, class_validator_1.Length)(5, 20),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], CreateUserDTO.prototype, "username", void 0);
tslib_1.__decorate([
    (0, class_validator_1.Validate)(customValidation_1.IsEmailAlreadyExist),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], CreateUserDTO.prototype, "email", void 0);
tslib_1.__decorate([
    (0, class_validator_1.Length)(6, 30),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], CreateUserDTO.prototype, "password", void 0);
exports.CreateUserDTO = CreateUserDTO;
class LoginUserDTO {
}
tslib_1.__decorate([
    (0, class_validator_1.Validate)(customValidation_1.IsUsernameOrEmailNotExist),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], LoginUserDTO.prototype, "username", void 0);
tslib_1.__decorate([
    (0, class_validator_1.Validate)(customValidation_1.IsPasswordValid),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], LoginUserDTO.prototype, "password", void 0);
exports.LoginUserDTO = LoginUserDTO;
class ForgotPasswordDTO {
}
tslib_1.__decorate([
    (0, class_validator_1.Validate)(customValidation_1.IsUsernameOrEmailNotExist),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], ForgotPasswordDTO.prototype, "email", void 0);
exports.ForgotPasswordDTO = ForgotPasswordDTO;
class ResetPasswordDTO {
}
tslib_1.__decorate([
    (0, class_validator_1.Length)(6, 30),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], ResetPasswordDTO.prototype, "password", void 0);
tslib_1.__decorate([
    (0, class_validator_1.Validate)(customValidation_1.MatchValue, ['password'], { message: 'confirm password and password should be same' }),
    (0, class_validator_1.Length)(6, 30),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], ResetPasswordDTO.prototype, "confirmPassword", void 0);
exports.ResetPasswordDTO = ResetPasswordDTO;
//# sourceMappingURL=auth.dto.js.map