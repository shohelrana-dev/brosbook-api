"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.io = void 0;
const tslib_1 = require("tslib");
//dependencies
require("reflect-metadata");
const express_1 = tslib_1.__importDefault(require("express"));
const morgan_1 = tslib_1.__importDefault(require("morgan"));
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
const cors_1 = tslib_1.__importDefault(require("cors"));
const path_1 = tslib_1.__importDefault(require("path"));
const cookie_parser_1 = tslib_1.__importDefault(require("cookie-parser"));
const http_1 = tslib_1.__importDefault(require("http"));
//env config
dotenv_1.default.config();
//internal import
const not_found_middleware_1 = tslib_1.__importDefault(require("../api/v1/middleware/not-found.middleware"));
const error_middleware_1 = tslib_1.__importDefault(require("../api/v1/middleware/error.middleware"));
const deserialize_user_middleware_1 = tslib_1.__importDefault(require("../api/v1/middleware/deserialize-user.middleware"));
const socket_1 = tslib_1.__importDefault(require("../startup/socket"));
const express_fileupload_1 = tslib_1.__importDefault(require("express-fileupload"));
const routes_1 = tslib_1.__importDefault(require("../startup/routes"));
//Application
const app = (0, express_1.default)();
//create src
const server = http_1.default.createServer(app);
exports.server = server;
//socket src init
exports.io = (0, socket_1.default)(server);
//initial configs
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cors_1.default)({
    credentials: true,
    origin: true,
    optionsSuccessStatus: 200
}));
app.use((0, cookie_parser_1.default)());
app.use((0, express_fileupload_1.default)());
//static path
app.use(express_1.default.static(path_1.default.resolve(__dirname, '../../public')));
//deserialize current user
app.use(deserialize_user_middleware_1.default);
//app routes
app.use(routes_1.default);
// handle error
app.use(not_found_middleware_1.default);
app.use(error_middleware_1.default);
//# sourceMappingURL=express.js.map