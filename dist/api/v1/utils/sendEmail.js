"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const nodemailer_1 = tslib_1.__importDefault(require("nodemailer"));
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const EMAIL_FROM = process.env.EMAIL_FROM;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const sendEmail = async (to, subject, html) => {
    try {
        const transporter = nodemailer_1.default.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            secure: true,
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASS,
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET
            }
        });
        const mailOptions = {
            from: EMAIL_FROM,
            to,
            subject,
            html
        };
        return await transporter.sendMail(mailOptions);
    }
    catch (err) {
        console.log(err);
        throw new Error('Email could not be send');
    }
};
exports.default = sendEmail;
//# sourceMappingURL=sendEmail.js.map