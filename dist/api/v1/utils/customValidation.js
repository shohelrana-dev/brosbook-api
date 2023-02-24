"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsPasswordValid = exports.MatchValue = exports.IsUsernameOrEmailNotExist = exports.IsEmailAlreadyExist = exports.IsUsernameAlreadyExist = void 0;
const tslib_1 = require("tslib");
const class_validator_1 = require("class-validator");
const User_1 = tslib_1.__importDefault(require("../entities/User"));
const argon2_1 = tslib_1.__importDefault(require("argon2"));
let IsUsernameAlreadyExist = class IsUsernameAlreadyExist {
    async validate(username, args) {
        try {
            await User_1.default.findOneByOrFail({ username });
            return false;
        }
        catch (e) {
            return true;
        }
    }
    defaultMessage(validationArguments) {
        return 'username already taken';
    }
};
IsUsernameAlreadyExist = tslib_1.__decorate([
    (0, class_validator_1.ValidatorConstraint)({ async: true })
], IsUsernameAlreadyExist);
exports.IsUsernameAlreadyExist = IsUsernameAlreadyExist;
let IsEmailAlreadyExist = class IsEmailAlreadyExist {
    async validate(email, args) {
        try {
            await User_1.default.findOneByOrFail({ email });
            return false;
        }
        catch (e) {
            return true;
        }
    }
    defaultMessage(validationArguments) {
        return 'already have an account with the email address';
    }
};
IsEmailAlreadyExist = tslib_1.__decorate([
    (0, class_validator_1.ValidatorConstraint)({ async: true })
], IsEmailAlreadyExist);
exports.IsEmailAlreadyExist = IsEmailAlreadyExist;
let IsUsernameOrEmailNotExist = class IsUsernameOrEmailNotExist {
    async validate(username, args) {
        try {
            await User_1.default.findOneOrFail({
                where: [{ username }, { email: username }]
            });
            return true;
        }
        catch (e) {
            return false;
        }
    }
    defaultMessage(validationArguments) {
        return 'account doesn\'t exist with this username or email';
    }
};
IsUsernameOrEmailNotExist = tslib_1.__decorate([
    (0, class_validator_1.ValidatorConstraint)({ async: true })
], IsUsernameOrEmailNotExist);
exports.IsUsernameOrEmailNotExist = IsUsernameOrEmailNotExist;
let MatchValue = class MatchValue {
    async validate(value, args) {
        const [propertyName] = args.constraints;
        if (value === args.object[propertyName]) {
            return true;
        }
        return false;
    }
    defaultMessage(args) {
        return `should be same as ${args.constraints[0]}`;
    }
};
MatchValue = tslib_1.__decorate([
    (0, class_validator_1.ValidatorConstraint)({ async: true })
], MatchValue);
exports.MatchValue = MatchValue;
let IsPasswordValid = class IsPasswordValid {
    async validate(password, args) {
        const { username } = args.object;
        try {
            const user = await User_1.default.findOneOrFail({
                where: [{ username }, { email: username }],
                select: ["id", "password"]
            });
            const isPasswordMatched = await argon2_1.default.verify(user.password, password);
            if (isPasswordMatched) {
                return true;
            }
            return false;
        }
        catch (e) {
            return false;
        }
    }
    defaultMessage(validationArguments) {
        return 'invalid password';
    }
};
IsPasswordValid = tslib_1.__decorate([
    (0, class_validator_1.ValidatorConstraint)({ async: true })
], IsPasswordValid);
exports.IsPasswordValid = IsPasswordValid;
//# sourceMappingURL=customValidation.js.map