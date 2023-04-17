import { Server } from "http"
import { Server as SocketIOServer } from "socket.io"
import { inject } from "inversify"
import UserService from "@modules/users/user.service"
import User from "@entities/User"
import { Socket } from "dgram"

export default class SocketService {
    public readonly io: SocketIOServer
    public client: Socket
    private connectedUser: User

    constructor(
        server: Server,
        @inject( UserService )
        private readonly userService: UserService
    ){
        this.io = new SocketIOServer( server, {
            cors: {
                credentials: true,
                origin: process.env.CLIENT_URL,
                optionsSuccessStatus: 200
            }
        } )

        this.io.on( 'connection', ( client ) => {
            this.connectedUser(client)
        } )
    }

    connectUser(client: Socket){
        this.io.on( 'connect_user', async( user: User ) => {
            console.log( `${ user.username }: connected` )

            this.connectedUser = user

            //update user activity
            await this.userService.makeUserActive( user.id )
        } )
    }

    disconnectUser(){
        this.io.on( 'dis', async( user: User ) => {
            console.log( `${ user.username }: connected` )

            this.connectedUser = user

            //update user activity
            await this.userService.makeUserActive( user.id )
        } )
    }
}