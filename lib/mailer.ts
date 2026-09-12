import nodemailer from "nodemailer";

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || "Sudha Collections";

if (!SMTP_USER || !SMTP_PASSWORD) {
  throw new Error(
    "Missing SMTP_USER or SMTP_PASSWORD env vars. See EMAIL_SETUP.md for how to generate a Gmail App Password."
  );
}

// Gmail SMTP over the standard submission port. App Passwords work with
// this exact host/port/secure combination — don't change these for Gmail.
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // STARTTLS, not implicit TLS — correct for port 587
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD,
  },
});

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends an email and never throws — logs failures instead. Email delivery
 * should never be allowed to break registration, checkout, or admin actions
 * just because SMTP hiccupped.
 */
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"${SMTP_FROM_NAME}" <${SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error(`Failed to send email to ${to} ("${subject}"):`, err);
    return false;
  }
}
