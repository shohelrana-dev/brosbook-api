import AuthService from "./auth.service"
import { inject } from "inversify"
import {controller, httpGet, httpPost} from "inversify-express-utils"
import dtoValidationMiddleware from "@middleware/dto-validation.middleware"
import { CreateUserDTO, ForgotPasswordDTO, LoginUserDTO, ResetPasswordDTO } from "@modules/auth/auth.dto"
import { Request, Response } from "express"
import User from "@entities/User"
import { LoginTokenPayload } from "@utils/types"

/**
 * @class AuthController
 * @desc Responsible for handling API requests for the
 * /auth route.
 **/
@controller( '/auth' )
export default class AuthController {
    constructor(
        @inject( AuthService )
        private readonly authService: AuthService
    ){}

    @httpPost( '/signup', dtoValidationMiddleware( CreateUserDTO ) )
    public async signup( req: Request, res: Response ): Promise<Response<User>>{
        const user = await this.authService.signup( req.body )

        return res.status( 201 ).json( user )
    }

    @httpPost( '/login', dtoValidationMiddleware( LoginUserDTO ) )
    public async login( req: Request ): Promise<LoginTokenPayload>{
        return await this.authService.login( req.body )
    }

    @httpPost( '/google' )
    public async loginWithGoogle( req: Request ): Promise<LoginTokenPayload>{
        return await this.authService.loginWithGoogle( req.body.token )
    }

    @httpPost( '/forgot_password', dtoValidationMiddleware( ForgotPasswordDTO ) )
    public async forgotPassword( req: Request ): Promise<{ message: string }>{
        const email = req.body.email

        await this.authService.forgotPassword( email )

        return {
            message: `We've sent an email to ${ email } with a link to get back into your account.`
        }
    }

    @httpPost( '/reset_password/:token', dtoValidationMiddleware( ResetPasswordDTO ) )
    public async resetPassword( req: Request ): Promise<{ message: string }>{
        await this.authService.resetPassword( { ...req.body, token: req.params.token } )

        return { message: 'Password has been changed' }
    }

    @httpPost( '/email_verification/resend' )
    public async resendEmailVerificationLink( req: Request ): Promise<{ message: string }>{
        await this.authService.resendEmailVerificationLink( req.body.email )

        return { message: 'Email has been resent' }
    }

    @httpGet( '/email_verification/:token' )
    public async verifyEmail( req: Request ): Promise<User>{
        return await this.authService.verifyEmail( req.params.token )
    }
}