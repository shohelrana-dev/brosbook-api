"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const UnauthorizedException_1 = tslib_1.__importDefault(require("../exceptions/UnauthorizedException"));
const authMiddleware = (req, _, next) => {
    if (req.auth.isAuthenticated) {
        return next();
    }
    next(new UnauthorizedException_1.default('You are not currently logged in.'));
};
exports.default = authMiddleware;
//# sourceMappingURL=auth.middleware.js.map