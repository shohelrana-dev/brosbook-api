"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const HttpException_1 = tslib_1.__importDefault(require("./HttpException"));
class NotFoundException extends HttpException_1.default {
    constructor(message) {
        super(message);
        this.statusCode = 404;
        this.name = 'NotFoundException';
    }
}
exports.default = NotFoundException;
//# sourceMappingURL=NotFoundException.js.map