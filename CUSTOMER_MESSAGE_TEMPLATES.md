# Sudha Collections customer message templates

Open **Admin → Homepage CMS → Template Management**.

1. Create a template with a name, email subject and common message.
2. Use `{{name}}` for the customer's name and `{{store}}` for Sudha Collections.
3. Save the template, search for customers and select recipients (up to 50 per email request).
4. Review the preview, then choose **Review email → Send email**, or **Open WhatsApp** beside a selected customer.

Email uses the existing `SMTP_USER`, `SMTP_PASSWORD` and optional `SMTP_FROM_NAME` server settings. Each recipient receives an individual email. Results distinguish email-server acceptance, failure and an unconfirmed in-progress request; acceptance is not a delivery receipt. Retrying the same request does not resend it. Failed recipients can be prepared as a new request.

WhatsApp uses a prepared chat link and requires the admin to press Send in WhatsApp. No WhatsApp Business API credentials are required, and automatic WhatsApp broadcasts are not included.

Only active ADMIN and SUPER_ADMIN accounts can manage templates or send email. Recipients must be active customer accounts. The app uses the customer's profile phone or their default saved-address phone.

Deployment: apply Prisma migrations and regenerate the Prisma client. Restart an existing dev server if it retains an older generated client.

Validation: `node --import tsx --test tests/message-templates.test.ts` uses a mocked mail service and sends no real customer messages.
