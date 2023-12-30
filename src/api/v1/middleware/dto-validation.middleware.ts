import { RequestHandler } from 'express'
import { validate } from "class-validator"
import { plainToInstance } from "class-transformer"
import { UnprocessableEntityException } from "node-http-exceptions"
import mapErrors from "@utils/mapErrors"

const dtoValidationMiddleware = ( type: any, skipMissingProperties = false ): RequestHandler => async( req, res, next ) => {
    const dtoObj = plainToInstance( type, req.body )
    const errors = await validate( dtoObj, { skipMissingProperties } )

    if( errors.length > 0 ){
        return next( new UnprocessableEntityException( 'Please fix errors below.', { errors: mapErrors( errors ) } ) )
    }
    next()
}

export default dtoValidationMiddleware