import { LoginTicket, OAuth2Client, TokenPayload } from 'google-auth-library'
import { BadRequestException, UnauthorizedException } from 'node-http-exceptions'

const googleClientId = process.env['GOOGLE_CLIENT_ID']

export default async function verifyGoogleOAuthToken(token: string): Promise<TokenPayload> {
    if (!token) throw new BadRequestException('Google OAuth token is empty.')

    const oAuthClient = new OAuth2Client(googleClientId)

    try {
        const ticket: LoginTicket = await oAuthClient.verifyIdToken({
            idToken: token,
            audience: googleClientId,
        })

        return ticket.getPayload()
    } catch (err) {
        throw new UnauthorizedException('Invalid google oAuth token.')
    }
}
