import { Server } from "socket.io"
import http from "http"


export default function socketHandler( server: http.Server ){
    //initialize io
    return new Server( server, {
        cors: {
            credentials: true,
            origin: process.env.CLIENT_URL,
            optionsSuccessStatus: 200
        }
    } )
}
