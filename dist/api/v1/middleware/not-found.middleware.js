"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NotFoundException_1 = tslib_1.__importDefault(require("../exceptions/NotFoundException"));
const notFoundMiddleware = async (_, __, next) => {
    next(new NotFoundException_1.default('The route is not available'));
};
exports.default = notFoundMiddleware;
//# sourceMappingURL=not-found.middleware.js.map