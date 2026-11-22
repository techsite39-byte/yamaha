import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';

const authTestDirectory = await mkdtemp(join(tmpdir(), 'yamaha-reset-route-test-'));
const authStorePath = join(authTestDirectory, 'admin-auth.json');

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = '';
process.env.ADMIN_AUTH_STORE_PATH = authStorePath;
delete process.env.ADMIN_BOOTSTRAP_EMAIL;
delete process.env.ADMIN_BOOTSTRAP_PASSWORD;
delete process.env.SMTP_USER;
delete process.env.SMTP_PASS;

const {
  app,
  setPasswordResetActivityLoggerForTests,
  setPasswordResetDeliveryForTests,
} = await import('./index.js');
const { hashPassword, readAuthStore } = await import('./authService.js');

const knownEmail = 'route-known@example.invalid';
const unknownEmail = 'route-unknown@example.invalid';
const knownPassword = randomBytes(24).toString('hex');
const knownSalt = randomBytes(16).toString('hex');

async function writeKnownAdminStore() {
  await writeFile(authStorePath, JSON.stringify({
    adminUsers: [{
      id: 'temporary-reset-route-admin',
      name: 'Temporary Route Administrator',
      email: knownEmail,
      role: 'Super Admin',
      status: 'Active',
      passwordHash: hashPassword(knownPassword, knownSalt),
      salt: knownSalt,
      resetCode: null,
      resetExpires: null,
    }],
    sessions: [],
  }, null, 2), 'utf8');
}

async function closeServer(server) {
  const closed = new Promise((resolveClose, rejectClose) => {
    server.close((error) => error ? rejectClose(error) : resolveClose());
  });
  server.closeAllConnections?.();
  await closed;
}

after(async () => {
  setPasswordResetDeliveryForTests(null);
  setPasswordResetActivityLoggerForTests(null);
  delete process.env.ADMIN_AUTH_STORE_PATH;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;
  await rm(authTestDirectory, { recursive: true, force: true });
});

test('forgot-password is account-neutral and unconfigured SMTP clears pending code without leaking', async () => {
  await writeKnownAdminStore();
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;

  const capturedLogs = [];
  const originalLog = console.log;
  const originalError = console.error;
  console.log = (...parts) => capturedLogs.push(parts.join(' '));
  console.error = (...parts) => capturedLogs.push(parts.join(' '));

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolveListen) => server.once('listening', resolveListen));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const known = await fetch(`${base}/api/admin/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: knownEmail }),
    });
    const knownBody = await known.json();

    const unknown = await fetch(`${base}/api/admin/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: unknownEmail }),
    });
    const unknownBody = await unknown.json();

    assert.equal(known.status, 200);
    assert.equal(unknown.status, 200);
    assert.equal(JSON.stringify(knownBody) === JSON.stringify(unknownBody), true);
    assert.equal('code' in knownBody, false);
    assert.equal('email' in knownBody, false);
    assert.equal(capturedLogs.some((line) => /\b[0-9]{6}\b/.test(line)), false);

    const store = await readAuthStore();
    const user = store.adminUsers.find((candidate) => candidate.email === knownEmail);
    assert.equal(user.resetCode === null, true);
    assert.equal(user.resetExpires, null);
  } finally {
    console.log = originalLog;
    console.error = originalError;
    await closeServer(server);
  }
});

test('SMTP send failure clears pending code and the response stays account-neutral', async () => {
  await writeKnownAdminStore();
  process.env.SMTP_USER = 'test-sender@example.invalid';
  process.env.SMTP_PASS = 'test-only-not-a-real-secret';

  let deliveryObserved = false;
  let attemptedCode = null;
  const capturedLogs = [];
  const originalError = console.error;
  console.error = (...parts) => capturedLogs.push(parts.join(' '));
  setPasswordResetDeliveryForTests(async ({ code }) => {
    deliveryObserved = true;
    attemptedCode = code;
    throw new Error('controlled delivery failure');
  });

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolveListen) => server.once('listening', resolveListen));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await fetch(`${base}/api/admin/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: knownEmail }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(deliveryObserved, true);
    assert.equal(typeof body.message, 'string');
    assert.equal('code' in body, false);
    assert.equal('email' in body, false);
    assert.equal(typeof attemptedCode === 'string', true);
    assert.equal(JSON.stringify(body).includes(attemptedCode), false);
    assert.equal(capturedLogs.some((line) => line.includes(attemptedCode)), false);

    const store = await readAuthStore();
    const user = store.adminUsers.find((candidate) => candidate.email === knownEmail);
    assert.equal(user.resetCode === null, true);
    assert.equal(user.resetExpires, null);
  } finally {
    setPasswordResetDeliveryForTests(null);
    console.error = originalError;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    await closeServer(server);
  }
});

test('mocked SMTP success keeps the pending code internal and does not expose it', async () => {
  await writeKnownAdminStore();
  process.env.SMTP_USER = 'test-sender@example.invalid';
  process.env.SMTP_PASS = 'test-only-not-a-real-secret';
  setPasswordResetActivityLoggerForTests(async () => {});

  let deliveryCode = null;
  setPasswordResetDeliveryForTests(async ({ code }) => {
    deliveryCode = typeof code === 'string' ? code : null;
  });

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolveListen) => server.once('listening', resolveListen));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await fetch(`${base}/api/admin/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: knownEmail }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(/^[0-9]{6}$/.test(deliveryCode || ''), true);
    assert.equal('code' in body, false);
    assert.equal('email' in body, false);

    const store = await readAuthStore();
    const user = store.adminUsers.find((candidate) => candidate.email === knownEmail);
    assert.equal(user.resetCode === deliveryCode, true);
  } finally {
    setPasswordResetDeliveryForTests(null);
    setPasswordResetActivityLoggerForTests(null);
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    await closeServer(server);
  }
});

test('reset-password failures use the same public response for unknown accounts and invalid codes', async () => {
  await writeKnownAdminStore();

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolveListen) => server.once('listening', resolveListen));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const reset = (email) => fetch(`${base}/api/admin/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        code: '000000',
        newPassword: randomBytes(24).toString('hex'),
      }),
    });
    const known = await reset(knownEmail);
    const knownBody = await known.json();
    const unknown = await reset(unknownEmail);
    const unknownBody = await unknown.json();

    assert.equal(known.status, 400);
    assert.equal(unknown.status, 400);
    assert.equal(JSON.stringify(knownBody) === JSON.stringify(unknownBody), true);
  } finally {
    await closeServer(server);
  }
});

test('per-IP forgot-password and reset-verification limits are bounded', async () => {
  await writeKnownAdminStore();
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolveListen) => server.once('listening', resolveListen));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    let limitedRequestReached = false;
    for (let attempt = 0; attempt < 7; attempt += 1) {
      const response = await fetch(`${base}/api/admin/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unknownEmail }),
      });
      if (response.status === 429) limitedRequestReached = true;
    }
    assert.equal(limitedRequestReached, true);

    let limitedVerificationReached = false;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const response = await fetch(`${base}/api/admin/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: knownEmail,
          code: '000000',
          newPassword: randomBytes(24).toString('hex'),
        }),
      });
      if (response.status === 429) limitedVerificationReached = true;
    }
    assert.equal(limitedVerificationReached, true);
  } finally {
    await closeServer(server);
  }
});
