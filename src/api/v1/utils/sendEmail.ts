import nodemailer, {SentMessageInfo} from 'nodemailer'

const EMAIL_FROM = process.env.EMAIL_FROM
const EMAIL_USER = process.env.EMAIL_USER
const EMAIL_PASS = process.env.EMAIL_PASS

export default async function sendEmail(to: string, subject: string, html: string): Promise<SentMessageInfo> {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            secure: true,
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASS
            }
        })

        const mailOptions = {
            from: EMAIL_FROM,
            to,
            subject,
            html
        }

        return await transporter.sendMail(mailOptions)
    } catch (err) {
        console.log(err)
        throw new Error('Email could not be send')
    }
}