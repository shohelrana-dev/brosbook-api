"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const HttpException_1 = tslib_1.__importDefault(require("../exceptions/HttpException"));
function errorMiddleware(error, req, res, next) {
    console.log(error);
    if (error instanceof HttpException_1.default) {
        return error.send(res);
    }
    res.status(500).json({
        // @ts-ignore
        message: (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error occurred.',
        statusCode: 500
    });
}
exports.default = errorMiddleware;
//# sourceMappingURL=error.middleware.js.map