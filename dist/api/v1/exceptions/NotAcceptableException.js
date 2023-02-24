"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const HttpException_1 = tslib_1.__importDefault(require("./HttpException"));
class NotAcceptableException extends HttpException_1.default {
    constructor(message) {
        super(message);
        this.statusCode = 406;
        this.name = 'NotAcceptableException';
    }
}
exports.default = NotAcceptableException;
//# sourceMappingURL=NotAcceptableException.js.map