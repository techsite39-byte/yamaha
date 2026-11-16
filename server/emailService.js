import nodemailer from 'nodemailer';

function getSmtpCredentials() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const user = (process.env.SMTP_USER || process.env.SMTP_EMAIL || process.env.smtp_email || '').trim();
  const pass = (process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.smtp_pass || '').trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE).toLowerCase() === 'true' || port === 465;
  const from = process.env.SMTP_FROM || (user ? `Vathilai Motors Security <${user}>` : null);

  return { host, user, pass, port, secure, from };
}

/**
 * Returns whether SMTP credentials have been configured in environment variables.
 */
export function isSmtpConfigured() {
  const { host, user, pass } = getSmtpCredentials();

  // Guard against default placeholders
  if (!user || !pass) return false;
  if (user.includes('your_email') || pass.includes('your_gmail_app_password') || pass.includes('your_app_password')) {
    return false;
  }
  return Boolean(host && user && pass);
}

/**
 * Returns the sanitized SMTP configuration details (without exposing password).
 */
export function getSmtpStatus() {
  const { host, user, port, secure, from } = getSmtpCredentials();
  const configured = isSmtpConfigured();
  return {
    configured,
    host,
    port,
    secure,
    user: user || null,
    from,
  };
}

/**
 * Creates a Nodemailer transporter using configured SMTP settings.
 */
export function createMailTransporter() {
  const { host, user, pass, port, secure } = getSmtpCredentials();

  const options = {
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    // Useful timeouts so email operations do not hang requests indefinitely
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  };

  // Gmail service shortcut if specified or gmail host
  if (process.env.SMTP_SERVICE === 'gmail' || host === 'smtp.gmail.com') {
    options.service = 'gmail';
  }

  return nodemailer.createTransport(options);
}

/**
 * Generates the responsive HTML template for password reset email.
 */
export function buildPasswordResetHtml({ name = 'Administrator', code, expiresMinutes = 15 }) {
  const cleanCode = String(code || '');
  const digits = cleanCode.split('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Vathilai Motors Administrator Password</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #070B14;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #E2E8F0;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #070B14;
      padding: 40px 16px;
    }
    .main {
      max-width: 560px;
      margin: 0 auto;
      background: #0D1626;
      border: 1px solid rgba(22, 141, 226, 0.35);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #09172B 0%, #002B49 100%);
      padding: 32px 28px 24px;
      text-align: center;
      border-bottom: 2px solid #0879D1;
    }
    .eyebrow {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      color: #38BDF8;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 1px;
      color: #FFFFFF;
      margin: 0 0 4px 0;
    }
    .brand-sub {
      font-size: 12px;
      color: #94A3B8;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 17px;
      font-weight: 600;
      color: #FFFFFF;
      margin-top: 0;
      margin-bottom: 14px;
    }
    .text {
      font-size: 14px;
      line-height: 1.6;
      color: #CBD5E1;
      margin-bottom: 24px;
    }
    .code-box {
      background: #060B14;
      border: 1px solid #1E3A5F;
      border-radius: 10px;
      padding: 24px 16px;
      text-align: center;
      margin-bottom: 24px;
    }
    .code-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: #64748B;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .code-digits {
      font-family: 'Courier New', Courier, monospace;
      font-size: 34px;
      font-weight: 800;
      letter-spacing: 10px;
      color: #38BDF8;
      padding-left: 10px;
      margin: 0;
    }
    .expiry-pill {
      display: inline-block;
      margin-top: 14px;
      padding: 4px 12px;
      border-radius: 9999px;
      background: rgba(22, 141, 226, 0.15);
      border: 1px solid rgba(22, 141, 226, 0.4);
      font-size: 12px;
      font-weight: 600;
      color: #38BDF8;
    }
    .security-notice {
      background: rgba(239, 68, 68, 0.08);
      border-left: 3px solid #EF4444;
      padding: 12px 16px;
      border-radius: 4px;
      font-size: 12.5px;
      color: #FCA5A5;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .footer {
      background: #080D1A;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding: 20px 28px;
      text-align: center;
      font-size: 11px;
      color: #64748B;
      line-height: 1.6;
    }
    .footer strong {
      color: #94A3B8;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main">
      <div class="header">
        <div class="eyebrow">AUTHORISED YAMAHA DEALER · BATLAGUNDU</div>
        <h1 class="brand-title">VATHILAI MOTORS</h1>
        <div class="brand-sub">DEALERSHIP ADMINISTRATION PORTAL</div>
      </div>
      <div class="content">
        <p class="greeting">Hello ${name},</p>
        <p class="text">
          A request has been initiated to reset your <strong>Vathilai Motors Administrator</strong> password.
          Please use the 6-digit verification code below to authorize this password update.
        </p>

        <div class="code-box">
          <div class="code-label">One-Time Verification Code</div>
          <div class="code-digits">${cleanCode}</div>
          <div class="expiry-pill">Valid for ${expiresMinutes} minutes</div>
        </div>

        <div class="security-notice">
          <strong>Security Notice:</strong> If you did not request this password reset, please disregard this email. Your existing password remains secure and no changes have been applied to your account.
        </div>

        <p class="text" style="margin-bottom: 0; font-size: 13px; color: #94A3B8;">
          This code can only be used once. Never share this code with anyone.
        </p>
      </div>

      <div class="footer">
        <strong>Vathilai Motors — Authorised Yamaha Two-Wheeler Dealership</strong><br>
        Parimalam Theatre Complex, Main Road, Opp. Union Office Madurai, Batlagundu, Tamil Nadu – 624202<br>
        Contact Dealership: 081444 45566 · Instagram: @vathilaimotors
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Builds plain text email fallback.
 */
export function buildPasswordResetText({ name = 'Administrator', code, expiresMinutes = 15 }) {
  return `VATHILAI MOTORS — AUTHORISED YAMAHA DEALER
ADMINISTRATOR PASSWORD RESET REQUEST

Hello ${name},

A request was initiated to reset your Vathilai Motors Administrator password.

Your 6-digit verification code is:
${code}

This code is valid for ${expiresMinutes} minutes.

Security Notice:
If you did not request this password reset, please ignore this email. Your current password remains secure. Never share this verification code with anyone.

---
Vathilai Motors — Yamaha Dealership
Parimalam Theatre Complex, Batlagundu, Tamil Nadu – 624202
Phone: 081444 45566
`;
}

/**
 * Sends the password reset verification email using configured SMTP.
 *
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.code - 6-digit verification code
 * @param {string} [params.name] - Administrator name
 * @param {number} [params.expiresMinutes=15] - Code validity window in minutes
 * @returns {Promise<{ success: boolean, messageId?: string, accepted?: string[] }>}
 */
export async function sendPasswordResetEmail({ to, code, name = 'Administrator', expiresMinutes = 15 }) {
  const recipient = String(to || '').trim();
  if (!recipient) {
    throw new Error('Recipient email address is required.');
  }

  if (!isSmtpConfigured()) {
    throw new Error('SMTP email is not configured in server/.env (missing SMTP_USER or SMTP_PASS).');
  }

  const transporter = createMailTransporter();
  const { from } = getSmtpCredentials();
  const fromAddress = from || `Vathilai Motors Security <${recipient}>`;

  const mailOptions = {
    from: fromAddress,
    to: recipient,
    subject: `Your Vathilai Motors Admin Reset Code: ${code}`,
    text: buildPasswordResetText({ name, code, expiresMinutes }),
    html: buildPasswordResetHtml({ name, code, expiresMinutes }),
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[SMTP] Password reset email sent to ${recipient}. MessageId: ${info.messageId}`);

  return {
    success: true,
    messageId: info.messageId,
    accepted: info.accepted,
  };
}

/**
 * Verifies connection to the SMTP server.
 */
export async function verifySmtpConnection() {
  if (!isSmtpConfigured()) {
    return {
      connected: false,
      message: 'SMTP credentials not configured (SMTP_USER / SMTP_PASS missing).',
    };
  }

  try {
    const transporter = createMailTransporter();
    await transporter.verify();
    return {
      connected: true,
      message: 'SMTP server connection verified successfully.',
    };
  } catch (error) {
    return {
      connected: false,
      message: error.message || 'SMTP connection failed.',
      code: error.code || 'SMTP_CONNECT_FAILED',
    };
  }
}
