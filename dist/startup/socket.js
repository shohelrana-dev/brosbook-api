"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const socket_io_1 = require("socket.io");
const user_service_1 = tslib_1.__importDefault(require("../api/v1/modules/users/user.service"));
function socketHandler(server) {
    //initialize io
    const io = new socket_io_1.Server(server, {
        cors: {
            credentials: true,
            origin: process.env.CLIENT_URL,
            optionsSuccessStatus: 200
        }
    });
    io.on("connection", (socket) => {
        const userService = new user_service_1.default();
        let connectedUser;
        socket.on('connect_user', async (user) => {
            console.log(`${user.username}: connected`);
            connectedUser = user;
            //update user activity
            await userService.makeUserActive(user.id);
        });
        socket.on('disconnect', async () => {
            if (!connectedUser)
                return;
            console.log(`${connectedUser === null || connectedUser === void 0 ? void 0 : connectedUser.username}: disconnected`);
            //update user activity
            await userService.makeUserInactive(connectedUser === null || connectedUser === void 0 ? void 0 : connectedUser.id);
        });
    });
    return io;
}
exports.default = socketHandler;
//# sourceMappingURL=socket.js.map