import { NextFunction, Request } from 'express'
import rateLimit, { Options } from 'express-rate-limit'
import { httpStatus } from 'node-http-exceptions'

const loginLimiterMiddleware = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 3, // Limit each IP to 5 login requests per `window` per minute
    message: {
        message: 'Too many login attempts from this IP, please try again after a 60 second pause',
        statusCode: httpStatus.TOO_MANY_REQUESTS,
    },
    handler: (req: Request, res: any, next: NextFunction, options: Options) => {
        console.log(
            `Too Many Requests: ${options.message.message}\t${req.method}\t${req.url}\t${req.headers.origin}`,
            'errLog.log'
        )
        res.status(options.statusCode).send(options.message)
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

export default loginLimiterMiddleware
