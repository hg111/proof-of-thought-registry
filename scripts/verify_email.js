
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

async function main() {
    console.log("--- Email Configuration Verification (Direct Read) ---");

    // Manual env parsing to bypass Node version issues
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envVars = {};

    if (fs.existsSync(envPath)) {
        console.log(`Reading: ${envPath}`);
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                // Mask value immediately
                envVars[key] = "***";
            }
        });
    } else {
        console.error(`ERROR: .env.local not found at ${envPath}`);
        process.exit(1);
    }

    const foundKeys = Object.keys(envVars);
    console.log("Keys found in file:", foundKeys.join(", "));

    // We can't actually verify auth if we don't have the values (the previous script tried to parse them),
    // but the PRIMARY issue right now is the KEYS are missing.
    // So let's just stop here and report keys.

    if (!envVars.EMAIL_USER || !envVars.EMAIL_PASS) {
        console.error("\n❌ ERROR: EMAIL_USER or EMAIL_PASS are NOT in the list of keys above.");
        console.error("Please check for typos (e.g. GMAIL_USER vs EMAIL_USER).");
        process.exit(1);
    }

    // If we get here, the keys exist, but the previous read failed? 
    // Re-read with values for the actual test if keys exist.
    // ... (rest of logic handles values if keys exist)

    // Re-read values for actual use, as the initial read only checked for key presence
    const actualEnvVars = {};
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                actualEnvVars[key] = value;
            }
        });
    }

    const user = actualEnvVars.EMAIL_USER;
    const pass = actualEnvVars.EMAIL_PASS; // Don't log this
    const host = actualEnvVars.EMAIL_HOST || 'smtp.gmail.com';

    console.log(`User found in file: ${user ? 'YES (' + user + ')' : 'NO'}`);
    console.log(`Pass found in file: ${pass ? 'YES' : 'NO'}`);

    if (!user || !pass) {
        console.error("\nERROR: Keys EMAIL_USER or EMAIL_PASS missing from trace of .env.local (after re-read for values)");
        process.exit(1);
    }

    console.log("\nAttempting to create transport...");
    const transporter = nodemailer.createTransport({
        host: host,
        port: parseInt(actualEnvVars.EMAIL_PORT || '587'),
        secure: false,
        auth: {
            user: user,
            pass: pass,
        },
    });

    try {
        console.log("Verifying connection...");
        await transporter.verify();
        console.log("✅ Connection successful!");

        console.log("Sending test email to self...");
        const info = await transporter.sendMail({
            from: envVars.EMAIL_FROM || '"Test" <no-reply@proofofthought.io>',
            to: user,
            subject: "Proof-of-Thought Email Test",
            text: "Configuration verified via direct file read.",
        });
        console.log(`✅ Email sent! Message ID: ${info.messageId}`);
    } catch (err) {
        console.error("\n❌ Verification Failed:");
        console.error(err);
    }
}

main().catch(console.error);
