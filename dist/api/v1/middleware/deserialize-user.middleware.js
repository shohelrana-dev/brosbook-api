"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const jsonwebtoken_1 = tslib_1.__importDefault(require("jsonwebtoken"));
async function deserializeUserMiddleware(req, _, next) {
    let jwt_token = '';
    const { access_token } = req.cookies;
    const { authorization } = req.headers;
    req.auth = {};
    req.auth.isAuthenticated = false;
    req.auth.user = {};
    if (authorization) {
        jwt_token = authorization.split(' ')[1];
    }
    else if (access_token) {
        jwt_token = access_token;
    }
    else {
        return next();
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(jwt_token, process.env.JWT_SECRET);
        if (decoded) {
            req.auth.isAuthenticated = true;
            req.auth.user = decoded;
        }
    }
    catch (err) {
    }
    next();
}
exports.default = deserializeUserMiddleware;
//# sourceMappingURL=deserialize-user.middleware.js.map