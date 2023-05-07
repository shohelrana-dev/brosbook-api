declare namespace Express {
    export interface Request {
        auth: {
            user?: any
            isAuthenticated: boolean
        }
    }
}