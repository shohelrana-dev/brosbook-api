declare namespace Express {
    export interface Request {
        auth: {
            user?: {
                id: string
                email: string
                username: string
            }
            isAuthenticated: boolean
            isTokenExpired: boolean
        }
    }
}
