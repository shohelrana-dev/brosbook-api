//dependencies
import 'reflect-metadata'
import express from 'express'
import morgan from 'morgan'
import dotenv from "dotenv"
import cors from 'cors'
import path from "path"
import cookieParser from "cookie-parser"

//env config
dotenv.config()


//internal import
import notFoundMiddleware from "@middleware/not-found.middleware"
import errorMiddleware from '@middleware/error.middleware'
import deserializeUserMiddleware from '@middleware/deserialize-user.middleware'
import fileUpload from "express-fileupload"
import { InversifyExpressServer } from "inversify-express-utils"
import container from "../container"
import { createServer } from "http"
import socketInit from "@startup/socket"

export const server = new InversifyExpressServer( container, null, { rootPath: '/api/v1' } )

server.setConfig( app => {
    //apply initial configurations
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
} ).setErrorConfig( ( app ) => {
    // handle error
    app.use( notFoundMiddleware )
    app.use( errorMiddleware )
} )

//build the app from the configured server instance
const app = server.build()

//create a http server instance
const serverInstance = createServer( app )

//initialize socket
export const io = socketInit( serverInstance )

//export the http server instance
export default serverInstance