import { Server as SocketIOServer } from "socket.io"
import User from "@entities/User"
import { Socket } from "dgram"

export default class SocketService {
    public readonly io: SocketIOServer
    public client: Socket
    private connectedUser: User
}