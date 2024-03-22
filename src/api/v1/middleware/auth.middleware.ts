//dependencies
import { NextFunction, Request, Response } from 'express'
import { ForbiddenException, UnauthorizedException } from 'node-http-exceptions'

export default function authMiddleware(req: Request, _: Response, next: NextFunction) {
    if (req.auth.isAuthenticated) {
        return next()
    } else if (req.auth.isTokenExpired) {
        throw new ForbiddenException('Session has been expired.')
    }
    throw new UnauthorizedException('You are not currently logged in.')
}
