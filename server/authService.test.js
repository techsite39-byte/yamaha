import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
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
  createAdminSession,
  createAdminUser,
  deleteAdminUser,
  generatePasswordResetCode,
  getAdminSession,
  hashPassword,
  listAdminUsers,
  readAuthStore,
  resetAdminPassword,
  revokeAdminSession,
  updateAdminUser,
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

const primaryAdmin = {
  id: 'temporary-primary-admin',
  name: 'Temporary Administrator',
  email: 'primary@example.invalid',
  password: randomBytes(24).toString('hex'),
  salt: randomBytes(16).toString('hex'),
};

async function writePrimaryAdminStore() {
  clearBootstrapEnvironment();
  await writeFile(authStorePath, JSON.stringify({
    adminUsers: [{
      ...primaryAdmin,
      role: 'Super Admin',
      status: 'Active',
      passwordHash: hashPassword(primaryAdmin.password, primaryAdmin.salt),
      resetCode: null,
      resetExpires: null,
    }],
    sessions: [],
  }, null, 2), 'utf8');
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
  const existingStore = {
    adminUsers: [{ id: 'existing-id', email: 'existing@example.invalid', role: 'Admin' }],
    sessions: [{ token: 'temporary-test-session', userId: 'existing-id' }],
    extension: { retained: true },
  };
  const serializedStore = `${JSON.stringify(existingStore, null, 2)}\n`;
  await writeFile(authStorePath, serializedStore, 'utf8');
  process.env.ADMIN_BOOTSTRAP_EMAIL = 'bootstrap@example.invalid';
  process.env.ADMIN_BOOTSTRAP_PASSWORD = randomBytes(24).toString('hex');

  const store = await readAuthStore();

  assert.deepEqual(store, existingStore);
  assert.equal(await readFile(authStorePath, 'utf8'), serializedStore);
  clearBootstrapEnvironment();
  await unlink(authStorePath);
});

test('existing native credential and session behavior remains available in non-production', async () => {
  await writePrimaryAdminStore();

  const valid = await verifyAdminCredentials(primaryAdmin.email.toUpperCase(), primaryAdmin.password);
  assert.equal(valid.email, primaryAdmin.email);
  assert.equal(valid.role, 'Super Admin');
  assert.equal(await verifyAdminCredentials(primaryAdmin.email, randomBytes(24).toString('hex')), null);

  const session = await createAdminSession(valid);
  assert.ok(session.token);
  assert.equal((await getAdminSession(session.token)).user.email, primaryAdmin.email);

  await revokeAdminSession(session.token);
  assert.equal(await getAdminSession(session.token), null);
});

test('existing password-reset service behavior remains available in isolated test storage', async () => {
  await writePrimaryAdminStore();
  const { code } = await generatePasswordResetCode(primaryAdmin.email);
  const replacementPassword = randomBytes(24).toString('hex');

  await resetAdminPassword(primaryAdmin.email, code, replacementPassword);
  assert.equal(
    (await verifyAdminCredentials(primaryAdmin.email, replacementPassword)).email,
    primaryAdmin.email,
  );
  assert.equal(await verifyAdminCredentials(primaryAdmin.email, primaryAdmin.password), null);
});

test('password reset codes are cryptographically formatted, expire at the boundary, and are single use', async () => {
  await writePrimaryAdminStore();
  const generated = await generatePasswordResetCode(primaryAdmin.email);

  assert.equal(/^[0-9]{6}$/.test(generated.code), true);
  assert.equal(generated.code.length, 6);

  const store = await readAuthStore();
  const user = store.adminUsers.find((candidate) => candidate.email === primaryAdmin.email);
  user.resetExpires = new Date(Date.now()).toISOString();
  await writeFile(authStorePath, JSON.stringify(store, null, 2), 'utf8');

  await assert.rejects(
    () => resetAdminPassword(primaryAdmin.email, generated.code, randomBytes(24).toString('hex')),
    /expired/,
  );

  await writePrimaryAdminStore();
  const secondGenerated = await generatePasswordResetCode(primaryAdmin.email);
  const firstReplacement = randomBytes(24).toString('hex');
  await resetAdminPassword(primaryAdmin.email, secondGenerated.code, firstReplacement);

  await assert.rejects(
    () => resetAdminPassword(primaryAdmin.email, secondGenerated.code, randomBytes(24).toString('hex')),
    /Invalid verification reset code/,
  );
});

test('existing administrator CRUD and last-Super-Admin protection remain functional', async () => {
  await writePrimaryAdminStore();

  const initialUsers = await listAdminUsers();
  assert.equal(initialUsers.length, 1);
  assert.equal('passwordHash' in initialUsers[0], false);
  assert.equal('salt' in initialUsers[0], false);

  const newPassword = randomBytes(24).toString('hex');
  const created = await createAdminUser({
    name: 'Temporary Showroom Manager',
    email: 'manager@example.invalid',
    password: newPassword,
  });
  assert.equal((await verifyAdminCredentials(created.email, newPassword)).email, created.email);

  const updatedPassword = randomBytes(24).toString('hex');
  await updateAdminUser(created.id, {
    name: 'Updated Showroom Manager',
    role: 'Editor',
    password: updatedPassword,
  });
  assert.equal(await verifyAdminCredentials(created.email, newPassword), null);
  assert.equal((await verifyAdminCredentials(created.email, updatedPassword)).role, 'Editor');

  await updateAdminUser(created.id, { status: 'Suspended' });
  await assert.rejects(
    () => verifyAdminCredentials(created.email, updatedPassword),
    /suspended/,
  );
  assert.deepEqual(await deleteAdminUser(created.id, primaryAdmin.id), { success: true });

  await assert.rejects(
    () => deleteAdminUser(primaryAdmin.id, 'another-admin'),
    /last Super Administrator/,
  );
});
