"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HttpException extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
    send(res) {
        res.status(this.statusCode).json({
            message: this.message || 'Something went wrong, Please try again',
            statusCode: this.statusCode || 500
        });
    }
}
exports.default = HttpException;
//# sourceMappingURL=HttpException.js.map