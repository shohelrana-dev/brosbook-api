"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
function socketHandler(server) {
    //initialize io
    return new socket_io_1.Server(server, {
        cors: {
            credentials: true,
            origin: process.env.CLIENT_URL,
            optionsSuccessStatus: 200
        }
    });
}
exports.default = socketHandler;
//# sourceMappingURL=socket.js.map