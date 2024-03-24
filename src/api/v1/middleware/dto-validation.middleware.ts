import mapErrors from '@utils/mapErrors'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { RequestHandler } from 'express'
import { UnprocessableEntityException } from 'node-http-exceptions'

const dtoValidationMiddleware =
    (type: any, skipMissingProperties = false): RequestHandler =>
    async (req, res, next) => {
        const dtoObj = plainToInstance(type, req.body)
        const errors = await validate(dtoObj, { skipMissingProperties })

        if (errors.length > 0) {
            return next(
                new UnprocessableEntityException('Please fix all validation errors.', {
                    errors: mapErrors(errors),
                })
            )
        }
        next()
    }

export default dtoValidationMiddleware
