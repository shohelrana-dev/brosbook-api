import argon2 from 'argon2'
import isEmpty from 'is-empty'
import jwt, { JsonWebTokenError, JwtPayload, TokenExpiredError } from 'jsonwebtoken'
import {
    BadRequestException,
    ForbiddenException,
    InternalServerException,
    NotFoundException,
} from 'node-http-exceptions'

import { appDataSource } from '@config/datasource.config'
import User from '@entities/User'
import { CreateUserDTO, LoginUserDTO, ResetPasswordDTO } from '@modules/auth/auth.dto'
import UserService from '@modules/users/user.service'
import { EmailService } from '@services/email.service'
import { selectAllColumns } from '@utils/selectAllColumns'
import { AuthToken } from '@utils/types'
import verifyGoogleOAuthToken from '@utils/verifyGoogleOAuthToken'
import { inject, injectable } from 'inversify'

/**
 * Service for handling user authentication and authorization.
 */
@injectable()
export default class AuthService {
    private readonly userRepository = appDataSource.getRepository(User)

    constructor(
        @inject(UserService)
        private readonly userService: UserService
    ) {}

    /**
     * Signs up a new user and sends an email verification link.
     *
     * @param userData - The user data to sign up.
     * @returns The signed up user.
     * @throws BadRequestException if the user data is empty.
     */
    public async signup(userData: CreateUserDTO): Promise<User> {
        if (isEmpty(userData)) throw new BadRequestException('Signup user data is empty.')

        try {
            const user = await this.userService.create(userData)
            await EmailService.sendEmailVerificationLink(userData.email, user.username)
            return user
        } catch {
            throw new InternalServerException('Failed to create user.')
        }
    }

    /**
     * Logs in a user with the provided credentials.
     *
     * @param userData - The user credentials to log in.
     * @returns The login token and user data.
     * @throws BadRequestException if the user data is empty or invalid.
     */
    public async login(
        userData: LoginUserDTO
    ): Promise<AuthToken & { user: User; refreshToken: string }> {
        if (isEmpty(userData)) throw new BadRequestException('Login user data is empty.')

        const { username, password } = userData

        const user = await this.userRepository.findOne({
            where: [{ email: username }, { username }],
            select: selectAllColumns(this.userRepository),
        })

        if (!user) throw new BadRequestException('User not found with the email or username.')

        const isPasswordMatched = await argon2.verify(user.password, password)

        if (!isPasswordMatched) throw new BadRequestException('Invalid password.')

        delete user.password

        if (!user.hasEmailVerified) {
            throw new ForbiddenException(
                'Your email has not been verified yet. Please check your mailbox.',
                { user }
            )
        }

        const accessTokenData = AuthService.createAccessToken(user)
        const refreshToken = AuthService.createRefreshToken(user)

        return { user, ...accessTokenData, refreshToken }
    }

    /**
     * Logs in a user with a Google OAuth token.
     *
     * @param token - The Google OAuth token.
     * @returns The login token and user data.
     */
    public async loginWithGoogle(
        token: string
    ): Promise<AuthToken & { user: User; refreshToken: string }> {
        const tokenPayload = await verifyGoogleOAuthToken(token)

        let user = await this.userRepository.findOneBy({ email: tokenPayload.email })

        //make user email verified if not verified
        if (user && !user.hasEmailVerified) {
            user.emailVerifiedAt = new Date(Date.now())
            await this.userRepository.save(user)
        }

        if (!user) {
            //create new user
            user = await this.userService.createWithGoogleOAuthTokenPayload(tokenPayload)
        }

        const accessTokenData = AuthService.createAccessToken(user)
        const refreshToken = AuthService.createRefreshToken(user)

        return { user, ...accessTokenData, refreshToken }
    }

    /**
     * Refresh token with the provided refreshTOken.
     *
     * @param refreshToken
     * @returns AuthToken.
     * @throws Error if refreshToken is empty or invalid.
     */
    public async refreshToken(refreshToken: string): Promise<AuthToken> {
        if (!refreshToken) throw new ForbiddenException('Refresh token is empty.')

        try {
            const tokenPayload = jwt.verify(
                refreshToken,
                process.env['REFRESH_TOKEN_SECRET']
            ) as JwtPayload

            if (tokenPayload.type !== 'refresh') {
                throw new BadRequestException('Invalid refreshToken.')
            }

            try {
                const user = await this.userRepository.findOneByOrFail({ id: tokenPayload.id })
                return AuthService.createAccessToken(user)
            } catch {
                throw new NotFoundException('User not found with the token payload.')
            }
        } catch (err) {
            if (err instanceof TokenExpiredError) {
                throw new ForbiddenException('Token has been expired.')
            } else if (err instanceof JsonWebTokenError) {
                throw new ForbiddenException('Invalid token.')
            }
            throw err
        }
    }

    /**
     * Sends a password reset email to the user with the provided email address.
     *
     * @param email - The email address of the user to reset the password.
     * @throws BadRequestException if the user does not exist.
     */
    public async forgotPassword(email: string): Promise<void> {
        const user = await this.userRepository.findOneBy({ email })

        if (!user) throw new BadRequestException('User not found with the email.')

        try {
            await EmailService.sendResetPasswordLink(email)
        } catch {
            throw new InternalServerException('Failed to send password reset email.')
        }
    }

    /**
     * Resets the password of a user with the provided token.
     *
     * @param payload - The password reset token and new password.
     * @returns The updated user data.
     * @throws BadRequestException if the token is invalid or the user does not exist.
     */
    public async resetPassword(payload: ResetPasswordDTO): Promise<User> {
        const { password, token } = payload
        let email = null

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET) as any
            email = decoded.email
        } catch (e) {
            throw new BadRequestException('Invalid token.')
        }

        let user = await this.userRepository.findOneBy({ email: email })

        if (!user) throw new BadRequestException('User does not exists.')

        try {
            user.password = await argon2.hash(password)
            user = await this.userRepository.save(user)
            delete user.password

            return user
        } catch {
            throw new InternalServerException('Failed to reset password.')
        }
    }

    /**
     * Verifies the email address of a user with the provided token.
     *
     * @param token - The email verification token.
     * @returns The updated user data.
     * @throws BadRequestException if the token is invalid or the user does not exist or the email address is already verified.
     */
    public async verifyEmail(token: string): Promise<User> {
        let email = null

        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET) as any
            email = payload.email
        } catch (e) {
            throw new BadRequestException('Invalid token.')
        }

        let user = await this.userRepository.findOneBy({ email })

        if (!user) throw new BadRequestException('User does not exists.')

        if (user.hasEmailVerified) {
            throw new BadRequestException('The email address already verified')
        }

        try {
            user.emailVerifiedAt = new Date(Date.now())
            user = await this.userRepository.save(user)
            delete user.password

            return user
        } catch {
            throw new InternalServerException('Failed to verify email address.')
        }
    }

    /**
     * Resends an email verification link to the user with the provided email address.
     *
     * @param email - The email address of the user to resend the email verification link.
     * @throws BadRequestException if the user does not exist.
     */
    public async resendEmailVerificationLink(email: string) {
        const user = await this.userRepository.findOneBy({ email })

        if (!user) throw new BadRequestException('User does not exists.')

        try {
            await EmailService.sendEmailVerificationLink(user.email, user.username)
        } catch {
            throw new InternalServerException('Failed to resend email verification link.')
        }
    }

    /**
     * Creates a access token using JSON Web Token (JWT) for a given user
     *
     * @param user - The user object for which the token is being created
     * @returns AuthToken
     */
    private static createAccessToken(user: User): AuthToken {
        const tokenPayload = {
            id: user.id,
            username: user.username,
            email: user.email,
            type: 'access',
        }
        const accessTokenSecret = process.env['ACCESS_TOKEN_SECRET']
        const expiresIn = process.env['ACCESS_TOKEN_EXPIRES_IN'] || '30m'
        const tokenType = 'Bearer'

        const accessToken = jwt.sign(tokenPayload, accessTokenSecret, {
            expiresIn,
        })

        return {
            accessToken,
            tokenType,
            expiresIn,
        }
    }

    /**
     * Creates a refresh token using JSON Web Token (JWT) for a given user
     *
     * @param user - The user object for which the token is being created
     * @returns string
     */
    private static createRefreshToken(user: User): string {
        const tokenPayload = {
            id: user.id,
            username: user.username,
            email: user.email,
            type: 'refresh',
        }
        const refreshTokenSecret = process.env['REFRESH_TOKEN_SECRET']
        const expiresIn = process.env['REFRESH_TOKEN_EXPIRES_IN'] || '7d'

        const refreshToken = jwt.sign(tokenPayload, refreshTokenSecret, {
            expiresIn,
        })

        return refreshToken
    }
}
