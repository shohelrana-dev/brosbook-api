declare namespace Express {
    export interface Request {
        auth: {
            user?: {
                id: string
                email: string
                username: string
                avatar: { url: string }
            }
            isAuthenticated: boolean
            isTokenExpired: boolean
        }
    }
}
