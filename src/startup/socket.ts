import { Server } from "socket.io"
import http from "http"
import User from "@entities/User"
import UserService from "@modules/users/user.service"
import container from "../container"
import MediaService from "@services/media.service"
import NotificationService from "@modules/notifications/notification.service"


export default function socketHandler( server: http.Server ){
    //initialize io
    const io = new Server( server, {
        cors: {
            credentials: true,
            origin: process.env.CLIENT_URL,
            optionsSuccessStatus: 200
        }
    } )

    io.on( "connection", ( socket ) => {
        const userService = new UserService( container.get( MediaService ), container.get( NotificationService ) )
        let connectedUser: User

        socket.on( 'connect_user', async( user: User ) => {
            console.log( `${ user.username }: connected` )

            connectedUser = user

            //update user activity
            await userService.makeUserActive( user.id )
        } )

        socket.on( 'disconnect', async() => {
            if( ! connectedUser ) return

            console.log( `${ connectedUser?.username }: disconnected` )

            //update user activity
            await userService.makeUserInactive( connectedUser?.id )
        } )
    } )

    return io
}
