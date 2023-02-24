"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appDataSource = void 0;
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const typeorm_1 = require("typeorm");
const dbConnection = process.env.DB_CONNECTION || 'mysql';
const host = process.env.DB_HOST || 'localhost';
const port = Number(process.env.DB_PORT) || 3306;
const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const database = process.env.DB_DATABASE;
const dbSynchronize = Boolean(process.env.DB_SYNCHRONIZE);
exports.appDataSource = new typeorm_1.DataSource({
    type: dbConnection,
    host: host,
    port: port,
    username: username,
    password: password,
    database: database,
    ssl: { rejectUnauthorized: false },
    synchronize: dbSynchronize,
    logging: false,
    migrationsRun: false,
    entities: [
        path_1.default.join(__dirname, '/../api/v1/entities/**/*.{ts,js}')
    ]
});
//# sourceMappingURL=data-source.js.map