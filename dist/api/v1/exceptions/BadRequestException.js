"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const HttpException_1 = tslib_1.__importDefault(require("./HttpException"));
class BadRequestException extends HttpException_1.default {
    constructor(message) {
        super(message);
        this.statusCode = 400;
        this.name = 'BadRequestException';
    }
}
exports.default = BadRequestException;
//# sourceMappingURL=BadRequestException.js.map