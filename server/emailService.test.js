import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isSmtpConfigured,
  getSmtpStatus,
  buildPasswordResetHtml,
  buildPasswordResetText,
  sendPasswordResetEmail,
  verifySmtpConnection,
} from './emailService.js';

test('Email Service: isSmtpConfigured checks placeholder and real credentials', () => {
  const origUser = process.env.SMTP_USER;
  const origPass = process.env.SMTP_PASS;

  try {
    // 1. Missing credentials
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    assert.equal(isSmtpConfigured(), false, 'Missing credentials must return false');

    // 2. Placeholder credentials
    process.env.SMTP_USER = 'your_email@gmail.com';
    process.env.SMTP_PASS = 'your_gmail_app_password';
    assert.equal(isSmtpConfigured(), false, 'Placeholder credentials must return false');

    // 3. Real credentials
    process.env.SMTP_USER = 'testadmin@vathilaimotors.com';
    process.env.SMTP_PASS = 'abcd efgh ijkl mnop';
    assert.equal(isSmtpConfigured(), true, 'Valid credentials must return true');
  } finally {
    if (origUser !== undefined) process.env.SMTP_USER = origUser;
    else delete process.env.SMTP_USER;
    if (origPass !== undefined) process.env.SMTP_PASS = origPass;
    else delete process.env.SMTP_PASS;
  }
});

test('Email Service: getSmtpStatus returns sanitized status without passwords', () => {
  const origUser = process.env.SMTP_USER;
  const origPass = process.env.SMTP_PASS;
  const origHost = process.env.SMTP_HOST;
  const origPort = process.env.SMTP_PORT;

  try {
    process.env.SMTP_USER = 'yourssanjay63@gmail.com';
    process.env.SMTP_PASS = 'super_secret_password_123';
    process.env.SMTP_HOST = 'smtp.gmail.com';
    process.env.SMTP_PORT = '587';

    const status = getSmtpStatus();
    assert.equal(status.host, 'smtp.gmail.com');
    assert.equal(status.port, 587);
    assert.equal(status.secure, false);
    assert.equal(status.user, 'yourssanjay63@gmail.com');
    assert.equal('pass' in status, false, 'Password must never be exposed');
    assert.equal('password' in status, false, 'Password must never be exposed');
  } finally {
    if (origUser !== undefined) process.env.SMTP_USER = origUser;
    else delete process.env.SMTP_USER;
    if (origPass !== undefined) process.env.SMTP_PASS = origPass;
    else delete process.env.SMTP_PASS;
    if (origHost !== undefined) process.env.SMTP_HOST = origHost;
    else delete process.env.SMTP_HOST;
    if (origPort !== undefined) process.env.SMTP_PORT = origPort;
    else delete process.env.SMTP_PORT;
  }
});

test('Email Service: buildPasswordResetHtml contains code, branding and security notice', () => {
  const html = buildPasswordResetHtml({
    name: 'Sanjay',
    code: '749201',
    expiresMinutes: 15,
  });

  assert.ok(html.includes('749201'), 'HTML must contain the 6-digit code');
  assert.ok(html.includes('Sanjay'), 'HTML must contain the administrator name');
  assert.ok(html.includes('VATHILAI MOTORS'), 'HTML must contain dealership branding');
  assert.ok(html.includes('15 minutes'), 'HTML must display validity window');
  assert.ok(html.includes('Security Notice'), 'HTML must contain security notice');
  assert.ok(html.includes('081444 45566'), 'HTML must contain dealership phone number');
});

test('Email Service: buildPasswordResetText contains code and plain text notice', () => {
  const text = buildPasswordResetText({
    name: 'Sanjay',
    code: '582194',
    expiresMinutes: 15,
  });

  assert.ok(text.includes('582194'), 'Text must contain code');
  assert.ok(text.includes('VATHILAI MOTORS'), 'Text must contain dealership branding');
  assert.ok(text.includes('15 minutes'), 'Text must display validity window');
});

test('Email Service: sendPasswordResetEmail validates recipient and SMTP configuration', async () => {
  const origUser = process.env.SMTP_USER;
  const origPass = process.env.SMTP_PASS;

  try {
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    // Missing to
    await assert.rejects(
      async () => {
        await sendPasswordResetEmail({ to: '', code: '123456' });
      },
      /Recipient email address is required/
    );

    // Unconfigured SMTP
    await assert.rejects(
      async () => {
        await sendPasswordResetEmail({ to: 'admin@example.com', code: '123456' });
      },
      /SMTP email is not configured/
    );
  } finally {
    if (origUser !== undefined) process.env.SMTP_USER = origUser;
    else delete process.env.SMTP_USER;
    if (origPass !== undefined) process.env.SMTP_PASS = origPass;
    else delete process.env.SMTP_PASS;
  }
});
