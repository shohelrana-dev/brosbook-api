"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mapErrors = (errors) => {
    return errors.reduce((prev, err) => {
        prev[err.property] = Object.entries(err.constraints)[0][1];
        return prev;
    }, {});
};
exports.default = mapErrors;
//# sourceMappingURL=mapErrors.js.map