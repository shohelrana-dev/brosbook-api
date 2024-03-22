import { Request } from 'express'

//extract authorization token from request
export default function extractAuthToken(req: Request): string | undefined {
    const authorization = req.headers['authorization'] as string

    if (authorization && authorization.startsWith('Bearer ')) {
        return authorization.split(' ')[1]
    }

    return req.cookies.accessToken
}
