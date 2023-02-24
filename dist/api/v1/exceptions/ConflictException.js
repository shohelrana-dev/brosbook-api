"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const HttpException_1 = tslib_1.__importDefault(require("./HttpException"));
class ConflictException extends HttpException_1.default {
    constructor(message) {
        super(message);
        this.statusCode = 409;
        this.name = 'ConflictException';
    }
}
exports.default = ConflictException;
//# sourceMappingURL=ConflictException.js.map