import container from '@core/container'
import Message from '@entities/Message'
import User from '@entities/User'
import UserService from '@modules/users/user.service'
import { Server as HttpServer } from 'http'
import { Socket, Server as SocketIOServer } from 'socket.io'

export default class SocketService {
    private static io: SocketIOServer
    private static connectedSockets = new Map<string, Socket>()

    public static start(server: HttpServer) {
        SocketService.io = new SocketIOServer(server, {
            cors: {
                origin: process.env.CLIENT_URL,
                optionsSuccessStatus: 200,
            },
        })

        SocketService.io.on('connection', SocketService.onConnection)
    }

    public static emit(event: string, data: any) {
        if (event === 'message.new' || event === 'message.update' || event === 'message.seen') {
            SocketService.emitMessage(event, data)
            return
        }

        SocketService.io.emit(event, data)
    }

    private static onConnection(socket: Socket) {
        const userService = container.get(UserService)
        let connectedUser: User

        socket.on('user.connect', async (user: User) => {
            if (!user?.id) return

            console.log(`${user.username}: connected`)

            //store user socket
            SocketService.connectedSockets.set(user.id, socket)
            connectedUser = user

            //update user status
            try {
                await userService.makeUserActive(user.id)
            } catch (err) {
                console.log(err)
            }
        })

        socket.on('disconnect', async () => {
            SocketService.connectedSockets.delete(connectedUser?.id!)

            if (!connectedUser?.id) return

            console.log(`${connectedUser.username}: disconnected`)

            //update user status
            try {
                await userService.makeUserInactive(connectedUser.id)
            } catch (err) {
                console.log(err)
            }
        })
    }

    private static emitMessage(event: string, message: Message) {
        if (!message?.id) throw new Error('Message data is empty.')
        if (!message.sender?.id) throw new Error('Message sender is empty.')
        if (!message.recipient?.id) throw new Error('Message recipient is empty.')

        const senderSocket = SocketService.connectedSockets.get(message.sender.id)
        const recipientSocket = SocketService.connectedSockets.get(message.recipient.id)

        if (senderSocket) senderSocket.emit(event, message)
        if (recipientSocket) recipientSocket.emit(event, message)
    }
}
