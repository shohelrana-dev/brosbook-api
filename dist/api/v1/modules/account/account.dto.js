"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProfileDTO = exports.ChangePasswordDTO = exports.ChangeUsernameDTO = void 0;
const tslib_1 = require("tslib");
const class_validator_1 = require("class-validator");
const customValidation_1 = require("../../utils/customValidation");
class ChangeUsernameDTO {
}
tslib_1.__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], ChangeUsernameDTO.prototype, "password", void 0);
tslib_1.__decorate([
    (0, class_validator_1.Validate)(customValidation_1.IsUsernameAlreadyExist),
    (0, class_validator_1.Length)(5, 20),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], ChangeUsernameDTO.prototype, "username", void 0);
exports.ChangeUsernameDTO = ChangeUsernameDTO;
class ChangePasswordDTO {
}
tslib_1.__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], ChangePasswordDTO.prototype, "currentPassword", void 0);
tslib_1.__decorate([
    (0, class_validator_1.Length)(6, 30),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], ChangePasswordDTO.prototype, "newPassword", void 0);
tslib_1.__decorate([
    (0, class_validator_1.Validate)(customValidation_1.MatchValue, ['newPassword'], { message: 'confirm new password and password should be same' }),
    (0, class_validator_1.Length)(6, 30),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], ChangePasswordDTO.prototype, "confirmNewPassword", void 0);
exports.ChangePasswordDTO = ChangePasswordDTO;
class UpdateProfileDTO {
}
tslib_1.__decorate([
    (0, class_validator_1.MaxLength)(20),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], UpdateProfileDTO.prototype, "firstName", void 0);
tslib_1.__decorate([
    (0, class_validator_1.MaxLength)(20),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], UpdateProfileDTO.prototype, "lastName", void 0);
tslib_1.__decorate([
    (0, class_validator_1.MaxLength)(2000),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], UpdateProfileDTO.prototype, "bio", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsPhoneNumber)('BD'),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], UpdateProfileDTO.prototype, "phone", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], UpdateProfileDTO.prototype, "location", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], UpdateProfileDTO.prototype, "birthdate", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsEnum)(['male', 'female']),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], UpdateProfileDTO.prototype, "gender", void 0);
exports.UpdateProfileDTO = UpdateProfileDTO;
//# sourceMappingURL=account.dto.js.map