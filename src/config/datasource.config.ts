import path from 'path'
import { DataSource } from 'typeorm'

const databaseType: any = process.env.DATABASE_TYPE || 'postgres'
const databaseUrl = process.env.DATABASE_URL
const databaseSync: boolean = Number(process.env.DATABASE_SYNC) === 1

export const appDataSource = new DataSource({
    type: databaseType,
    url: databaseUrl,
    ssl: { rejectUnauthorized: false },
    synchronize: databaseSync,
    logging: false,
    entities: [path.join(__dirname, '/../**/entities/*.{ts,js}')],
    migrations: [path.join(__dirname, '/../**/migrations/*.{ts,js}')],
    migrationsRun: false,
    migrationsTableName: 'history',
})
