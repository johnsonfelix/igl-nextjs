import nodemailer from 'nodemailer';

function isDummyEmail(email: string): boolean {
    if (!email) return true;
    const lower = email.toLowerCase().trim();
    
    return (
        !lower.includes('@') ||
        lower.includes('test') ||
        lower.includes('example') ||
        lower.includes('fake') ||
        lower.includes('dummy') ||
        !lower.includes('.')
    );
}

export async function sendEmail({
    to,
    subject,
    html,
}: {
    to: string;
    subject: string;
    html: string;
}) {
    
    if (isDummyEmail(to)) {
        console.log(`[EMAIL_SEND_SKIP] Blocked sending to invalid/dummy email: ${to}`);
        return;
    }

    
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.log('---------------------------------------------------');
        console.log('MOCK EMAIL SEND (No SMTP Configured):');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log('Body:', html);
        console.log('---------------------------------------------------');
        return;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, 
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const fromAddress = process.env.SMTP_FROM || '"Support" <sales@igla.asia>';

    console.log(`[EMAIL_SEND] Sending from ${fromAddress} to ${to}`);

    await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html,
    });
}
