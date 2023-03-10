//dependencies
import 'reflect-metadata'
import express, { Application } from 'express'
import morgan                   from 'morgan'
import dotenv                   from "dotenv"
import cors                     from 'cors'
import path                     from "path"
import cookieParser             from "cookie-parser"
import http                     from "http"

//env config
dotenv.config()


//internal import
import notFoundMiddleware        from "@middleware/not-found.middleware"
import errorMiddleware           from '@middleware/error.middleware'
import deserializeUserMiddleware from '@middleware/deserialize-user.middleware'
import socketInit                from "@startup/socket"
import fileUpload                from "express-fileupload"
import routes                    from '@startup/routes'

//Application
const app: Application = express()

//create src
const server    = http.createServer( app )
//socket src init
export const io = socketInit( server )

//initial configs
app.use( morgan( 'dev' ) )
app.use( express.json() )
app.use( express.urlencoded( { extended: false } ) )
app.use( cors( {
    credentials: true,
    origin: true,
    optionsSuccessStatus: 200
} ) )
app.use( cookieParser() )
app.use( fileUpload() )

//static path
app.use( express.static( path.resolve( __dirname, '../../public' ) ) )

//deserialize current user
app.use( deserializeUserMiddleware )

//app routes
app.use( routes )

// handle error
app.use( notFoundMiddleware )
app.use( errorMiddleware )

export { server }