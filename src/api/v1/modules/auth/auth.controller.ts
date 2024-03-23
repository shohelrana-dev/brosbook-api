import User from '@entities/User'
import dtoValidationMiddleware from '@middleware/dto-validation.middleware'
import loginLimiterMiddleware from '@middleware/login-limiter.middleware'
import { CreateUserDTO, ForgotPasswordDTO, LoginUserDTO, ResetPasswordDTO } from '@modules/auth/auth.dto'
import convertToMilliseconds from '@utils/convertToMilliseconds'
import { AuthToken } from '@utils/types'
import { Request, Response } from 'express'
import { inject } from 'inversify'
import { controller, httpGet, httpPost } from 'inversify-express-utils'
import AuthService from './auth.service'

/**
 * @class AuthController
 * @desc Responsible for handling API requests for the
 * /auth route.
 **/
@controller('/auth')
export default class AuthController {
    constructor(
        @inject(AuthService)
        private readonly authService: AuthService
    ) {}

    @httpPost('/signup', dtoValidationMiddleware(CreateUserDTO))
    public async signup(req: Request, res: Response): Promise<Response<User>> {
        const user = await this.authService.signup(req.body)

        return res.status(201).json(user)
    }

    @httpPost('/login', loginLimiterMiddleware, dtoValidationMiddleware(LoginUserDTO))
    public async login(req: Request, res: Response): Promise<Response> {
        const { refreshToken, ...rest } = await this.authService.login(req.body)

        // Creates Secure Cookie with refresh token
        res.cookie('__refresh_token', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: convertToMilliseconds(process.env['REFRESH_TOKEN_EXPIRES_IN']),
        })

        return res.json(rest)
    }

    @httpPost('/google')
    public async loginWithGoogle(req: Request, res: Response): Promise<Response> {
        const { refreshToken, ...rest } = await this.authService.loginWithGoogle(req.body.token)

        // Creates Secure Cookie with refresh token
        res.cookie('__refresh_token', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: convertToMilliseconds(process.env['REFRESH_TOKEN_EXPIRES_IN']),
        })

        return res.json(rest)
    }

    @httpGet('/logout')
    public async logout(_: Request, res: Response): Promise<Response> {
        // clear refresh token cookie
        res.clearCookie('__refresh_token', {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
        })

        return res.json({ message: 'Logged out.' })
    }

    @httpGet('/refresh_token')
    public async refreshToken(req: Request): Promise<AuthToken> {
        return await this.authService.refreshToken(req.cookies['__refresh_token'])
    }

    @httpPost('/forgot_password', dtoValidationMiddleware(ForgotPasswordDTO))
    public async forgotPassword(req: Request): Promise<{ message: string }> {
        const email = req.body.email

        await this.authService.forgotPassword(email)

        return {
            message: `An email has been sent to your email to reset your password.`,
        }
    }

    @httpPost('/reset_password/:token', dtoValidationMiddleware(ResetPasswordDTO))
    public async resetPassword(req: Request): Promise<{ message: string }> {
        await this.authService.resetPassword({ ...req.body, token: req.params.token })

        return { message: 'Password has been changed' }
    }

    @httpPost('/email_verification/resend')
    public async resendEmailVerificationLink(req: Request): Promise<{ message: string }> {
        await this.authService.resendEmailVerificationLink(req.body.email)

        return { message: 'Email has been resent' }
    }

    @httpGet('/email_verification/:token')
    public async verifyEmail(req: Request): Promise<User> {
        return await this.authService.verifyEmail(req.params.token)
    }
}
