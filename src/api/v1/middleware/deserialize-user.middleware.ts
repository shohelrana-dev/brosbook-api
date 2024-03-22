import extractAuthToken from '@utils/extractAuthToken'
import { Auth } from '@utils/types'
import { NextFunction, Request, Response } from 'express'
import jwt, { JwtPayload, TokenExpiredError } from 'jsonwebtoken'

export default async function deserializeUserMiddleware(req: Request, _: Response, next: NextFunction) {
    const token = extractAuthToken(req)

    //set initial empty auth object in req object
    req.auth = {} as Auth

    if (!token) return next()

    try {
        const decoded = jwt.verify(token, process.env['ACCESS_TOKEN_SECRET']) as JwtPayload

        if (decoded) {
            req.auth.isAuthenticated = true
            req.auth.user = {
                id: decoded.id,
                email: decoded.email,
                username: decoded.username,
            }
        }
    } catch (err) {
        if (err instanceof TokenExpiredError) {
            req.auth.isTokenExpired = true
        }
        console.log('JWT error: ', err.message)
    }

    return next()
}
