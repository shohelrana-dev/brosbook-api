import {Server as HttpServer} from 'http'
import {Server as SocketIOServer, Socket} from 'socket.io'
import UserService from "@modules/users/user.service"
import User from "@entities/User"
import container from "@core/container"

export default class SocketService {
    private static io: SocketIOServer

    public static start(server: HttpServer) {
        this.io = new SocketIOServer(server, {
            cors: {
                credentials: true,
                origin: process.env.CLIENT_URL,
                optionsSuccessStatus: 200
            }
        })

        this.updateUserStatus()
    }

    public static emit(event: string, ...args: any[]) {
        this.io.emit(event, ...args)
    }

    private static updateUserStatus() {
        const userService = container.get(UserService)

        this.io.on('connection', (socket: Socket) => {
            let connectedUser: User | undefined

            socket.on('connect_user', async (user: User) => {
                console.log(`${user.username}: connected`)

                connectedUser = user

                //update user status
                try{
                    await userService.makeUserActive(user.id)
                }catch(err){
                    console.log(err)
                }
            })

            socket.on('disconnect', async () => {
                if (!connectedUser) return

                console.log(`${connectedUser?.username}: disconnected`)

                //update user status
                try{
                    await userService.makeUserInactive(connectedUser?.id)
                }catch(err){
                    console.log(err)
                }
            })
        })
    }
}