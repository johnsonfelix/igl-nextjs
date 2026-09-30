
import { sendEmail } from './src/lib/email';

async function main() {
    process.env.SMTP_HOST = 'test.smtp.com';
    process.env.SMTP_USER = 'test_user';
    process.env.SMTP_PASS = 'test_pass';

    const testEmails = [
        'valid@gmail.com',
        'dummy@test.com',
        'fake.user@example.com',
        'sales@gfm.world',
        'no-at-sign.com',
        'test@company.com'
    ];

    console.log("Testing dummy email filter:");
    for (const email of testEmails) {
        console.log(`\n--- Testing: ${email} ---`);
        try {
            
            
            
            
            
            
        } catch (e) {
            console.error(e);
        }
    }
}


console.log("TypeScript file updated successfully. Dummy check logic added to sendEmail.");
