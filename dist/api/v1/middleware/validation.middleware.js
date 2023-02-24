"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const UnprocessableEntityException_1 = tslib_1.__importDefault(require("../exceptions/UnprocessableEntityException"));
const mapErrors_1 = tslib_1.__importDefault(require("../utils/mapErrors"));
const validationMiddleware = (type) => async (req, res, next) => {
    const errors = await (0, class_validator_1.validate)((0, class_transformer_1.plainToInstance)(type, req.body));
    if (errors.length > 0) {
        return next(new UnprocessableEntityException_1.default('Please fix errors below.', (0, mapErrors_1.default)(errors)));
    }
    next();
};
exports.default = validationMiddleware;
//# sourceMappingURL=validation.middleware.js.map