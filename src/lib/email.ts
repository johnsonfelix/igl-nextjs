import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendEmail({
    to,
    subject,
    html,
}: {
    to: string;
    subject: string;
    html: string;
}) {
    // If no SMTP credentials, just log (for dev)
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.log('---------------------------------------------------');
        console.log('MOCK EMAIL SEND (No SMTP Configured):');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log('Body:', html);
        console.log('---------------------------------------------------');
        return;
    }

    await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Support" <no-reply@logistics.com>',
        to,
        subject,
        html,
    });
}
