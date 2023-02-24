"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const HttpException_1 = tslib_1.__importDefault(require("./HttpException"));
class UnprocessableEntityException extends HttpException_1.default {
    constructor(message, errors) {
        super(message);
        this.errors = errors;
        this.statusCode = 422;
        this.name = 'UnprocessableEntityException';
    }
    send(res) {
        res.status(this.statusCode).json({
            message: this.message,
            statusCode: this.statusCode,
            errors: this.errors
        });
    }
}
exports.default = UnprocessableEntityException;
//# sourceMappingURL=UnprocessableEntityException.js.map