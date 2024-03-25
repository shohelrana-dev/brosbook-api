import { APP_NAME, EMAIL_SECRET_KEY } from '@utils/constants'
import sendEmail from '@utils/sendEmail'
import { SendVerficationLinkPayload } from '@utils/types'
import jwt from 'jsonwebtoken'

export class EmailService {
    private static brandingColor = '#14cb15'

    public static async sendEmailVerificationLink({ email, username }: SendVerficationLinkPayload) {
        const token = jwt.sign({ email }, EMAIL_SECRET_KEY)
        const url = `${process.env.CLIENT_URL}/auth/email_verification/${token}`
        const subject = `[${APP_NAME}] Please verify your email address`

        const html = /*html*/ `
                <div style="max-width: 520px; margin: auto; margin-top: 20px;">
                    <h1 style="font-weight: normal;">Almost done, @<strong>${username}</strong></h1>
                    <div style="border: 1px solid #ddd; border-radius: 10px; padding: 25px;">
                        <div style="margin-bottom: 25px">
                            <p style="margin: 0;">To secure your ${APP_NAME} account, we just need to verify your email address:</p>
                            <strong><a href="mailto:${email}" style="text-decoration: none;">${email}</a> </strong>
                        </div>
                        <div>
                            <a href="${url}" 
                                style="display: inline-block; background: ${EmailService.brandingColor}; color: #fff; padding: 10px 25px; border-radius: 5px; text-decoration: none;">
                                Verify email address
                            </a>
                        </div>
                    </div>
                    <p>This will let you receive notifications and password resets from ${APP_NAME}.</p>
                </div>
            `

        await sendEmail(email, subject, html)
    }

    public static async sendResetPasswordLink(email: string) {
        const token = jwt.sign({ email }, EMAIL_SECRET_KEY)
        const url = `${process.env.CLIENT_URL}/auth/reset_password/${token}`
        const subject = `[${APP_NAME}] Please reset your password`

        const html = /*html*/ `
                <div style="max-width: 520px; margin: auto; margin-top: 20px;">
                    <h1 style="font-weight: bold;">Reset your ${APP_NAME} password</h1>
                    <div style="border: 1px solid #ddd; border-radius: 10px; padding: 25px;">
                        <h2 style="font-weight: bold; text-align: center; margin-top: 0;">Reset password</h2>
                        <div>
                            <p style="margin-top: 0; margin-bottom: 5px;">Sorry to hear you’re having trouble logging into ${APP_NAME}. </p>
                            <p style="margin-top: 0; margin-bottom: 5px;">We got a message that you forgot your password.</p>
                            <p style="margin-top: 0; margin-bottom: 5px;">If this was you, you can reset your password following the button.</p>
                        </div>
                        <div style="text-align: center; margin-top: 28px;">
                            <a href="${url}" 
                                style="display: inline-block; background: ${EmailService.brandingColor}; color: #fff; padding: 10px 25px; border-radius: 5px; text-decoration: none;">
                                <strong>Reset your password</strong>
                            </a>
                        </div>
                    </div>
                    <p>Didn’t request this change? You can ignore this email.</p>
                </div>
            `

        await sendEmail(email, subject, html)
    }
}
