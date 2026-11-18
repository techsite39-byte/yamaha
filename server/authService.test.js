import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';

const authTestDirectory = await mkdtemp(join(tmpdir(), 'yamaha-auth-store-test-'));
const authStorePath = join(authTestDirectory, 'admin-auth.json');
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = '';
process.env.ADMIN_AUTH_STORE_PATH = authStorePath;
delete process.env.ADMIN_BOOTSTRAP_EMAIL;
delete process.env.ADMIN_BOOTSTRAP_PASSWORD;

const {
  readAuthStore,
  validateAdminBootstrapConfig,
  verifyAdminCredentials,
} = await import('./authService.js');

after(async () => {
  delete process.env.ADMIN_AUTH_STORE_PATH;
  await rm(authTestDirectory, { recursive: true, force: true });
});

function clearBootstrapEnvironment() {
  delete process.env.ADMIN_BOOTSTRAP_EMAIL;
  delete process.env.ADMIN_BOOTSTRAP_PASSWORD;
}

test('empty auth store returns no seeded administrator and does not write without bootstrap settings', async () => {
  clearBootstrapEnvironment();

  const store = await readAuthStore();

  assert.deepEqual(store.adminUsers, []);
  assert.deepEqual(store.sessions, []);
  assert.equal(existsSync(authStorePath), false);
});

test('bootstrap configuration requires both variables, rejects production, and enforces password length', async () => {
  process.env.ADMIN_BOOTSTRAP_EMAIL = 'bootstrap@example.invalid';
  delete process.env.ADMIN_BOOTSTRAP_PASSWORD;
  assert.throws(
    () => validateAdminBootstrapConfig({ production: false }),
    /Set both ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD/,
  );

  process.env.ADMIN_BOOTSTRAP_PASSWORD = 'short';
  assert.throws(
    () => validateAdminBootstrapConfig({ production: true }),
    /cannot be set in production/,
  );

  assert.throws(
    () => validateAdminBootstrapConfig({ production: false }),
    /at least 12 characters/,
  );

  process.env.ADMIN_BOOTSTRAP_PASSWORD = 'test-bootstrap-password-2026';
  assert.equal(validateAdminBootstrapConfig({ production: false }).email, 'bootstrap@example.invalid');
  clearBootstrapEnvironment();
});

test('non-production bootstrap creates one salted administrator and authenticates without logging credentials', async () => {
  process.env.ADMIN_BOOTSTRAP_EMAIL = 'bootstrap@example.invalid';
  process.env.ADMIN_BOOTSTRAP_PASSWORD = 'test-bootstrap-password-2026';

  const store = await readAuthStore();
  assert.equal(store.adminUsers.length, 1);
  assert.equal(store.adminUsers[0].email, 'bootstrap@example.invalid');
  assert.equal(store.adminUsers[0].salt.length, 32);
  assert.equal(typeof store.adminUsers[0].passwordHash, 'string');

  const verified = await verifyAdminCredentials('BOOTSTRAP@example.invalid', 'test-bootstrap-password-2026');
  assert.equal(verified.email, 'bootstrap@example.invalid');

  clearBootstrapEnvironment();
});

test('existing auth-store content is preserved exactly and is not reseeded', async () => {
  clearBootstrapEnvironment();
  const existingStore = {
    adminUsers: [{ id: 'existing-id', email: 'existing@example.invalid', role: 'Admin' }],
    sessions: [{ token: 'temporary-test-session', userId: 'existing-id' }],
    extension: { retained: true },
  };
  const serializedStore = `${JSON.stringify(existingStore, null, 2)}\n`;
  await writeFile(authStorePath, serializedStore, 'utf8');

  const store = await readAuthStore();

  assert.deepEqual(store, existingStore);
  assert.equal(await readFile(authStorePath, 'utf8'), serializedStore);
  await unlink(authStorePath);
});
