import path from 'path'
import { DataSource } from 'typeorm'

const dbConnection: any      = process.env.DB_CONNECTION || 'postgres'
const host: string           = process.env.DB_HOST || '127.0.0.1'
const port: number           = Number( process.env.DB_PORT ) || 3306
const username: string       = process.env.DB_USERNAME!
const password: string       = process.env.DB_PASSWORD!
const database: string       = process.env.DB_DATABASE!
const dbSynchronize: boolean = Boolean( process.env.DB_SYNCHRONIZE )

export const appDataSource = new DataSource( {
    type: dbConnection,
    host: host,
    port: port,
    username: username,
    password: password,
    database: database,
    ssl: { rejectUnauthorized:false },
    synchronize: dbSynchronize,
    logging: false,
    migrationsRun: false,
    entities: [
        path.join( __dirname, '/../api/v1/entities/**/*.{ts,js}' )
    ]
} )