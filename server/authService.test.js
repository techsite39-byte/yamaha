import test from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyAdminCredentials,
  createAdminSession,
  getAdminSession,
  revokeAdminSession,
  generatePasswordResetCode,
  resetAdminPassword,
  DEFAULT_ADMIN,
} from './authService.js';

test('Auth Service: verify default admin credentials', async () => {
  // Correct credentials
  const valid = await verifyAdminCredentials('yourssanjay63@gmail.com', 'admin123456#');
  assert.ok(valid, 'Admin credentials should match');
  assert.equal(valid.email, 'yourssanjay63@gmail.com');
  assert.equal(valid.role, 'Super Admin');

  // Case-insensitive email check
  const validUpper = await verifyAdminCredentials('YOURSSANJAY63@GMAIL.COM', 'admin123456#');
  assert.ok(validUpper, 'Email matching should be case-insensitive');

  // Invalid password
  const invalidPass = await verifyAdminCredentials('yourssanjay63@gmail.com', 'wrongpassword');
  assert.equal(invalidPass, null, 'Wrong password should return null');

  // Invalid email
  const invalidEmail = await verifyAdminCredentials('unknown@gmail.com', 'admin123456#');
  assert.equal(invalidEmail, null, 'Unknown email should return null');
});

test('Auth Service: session lifecycle', async () => {
  const user = { id: 'adm-1', email: 'yourssanjay63@gmail.com', name: 'Sanjay', role: 'Super Admin' };
  const session = await createAdminSession(user, { rememberMe: true });
  assert.ok(session.token);
  assert.equal(session.user.email, 'yourssanjay63@gmail.com');

  const retrieved = await getAdminSession(session.token);
  assert.ok(retrieved);
  assert.equal(retrieved.user.email, 'yourssanjay63@gmail.com');

  await revokeAdminSession(session.token);
  const afterRevoke = await getAdminSession(session.token);
  assert.equal(afterRevoke, null, 'Revoked session should return null');
});

test('Auth Service: forgot password and reset flow', async () => {
  const { code, email } = await generatePasswordResetCode('yourssanjay63@gmail.com');
  assert.ok(code);
  assert.equal(code.length, 6);
  assert.equal(email, 'yourssanjay63@gmail.com');

  // Attempt reset with wrong code
  await assert.rejects(
    async () => {
      await resetAdminPassword('yourssanjay63@gmail.com', '000000', 'newpass123');
    },
    /Invalid verification reset code/
  );

  // Reset with correct code
  const resetRes = await resetAdminPassword('yourssanjay63@gmail.com', code, 'newSecret987#');
  assert.equal(resetRes.success, true);

  // Verify new password works
  const validNew = await verifyAdminCredentials('yourssanjay63@gmail.com', 'newSecret987#');
  assert.ok(validNew, 'New password should verify successfully');

  // Old password should now fail
  const oldPass = await verifyAdminCredentials('yourssanjay63@gmail.com', 'admin123456#');
  assert.equal(oldPass, null, 'Old password must no longer work');

  // Reset back to required admin123456# for tests and user
  const { code: code2 } = await generatePasswordResetCode('yourssanjay63@gmail.com');
  await resetAdminPassword('yourssanjay63@gmail.com', code2, 'admin123456#');
  const restored = await verifyAdminCredentials('yourssanjay63@gmail.com', 'admin123456#');
  assert.ok(restored, 'Restored password should verify successfully');
});

test('Auth Service: full Users & Roles CRUD with real login access', async () => {
  const {
    listAdminUsers,
    createAdminUser,
    updateAdminUser,
    deleteAdminUser,
  } = await import('./authService.js');

  // 1. List users - must include Sanjay
  const initialUsers = await listAdminUsers();
  assert.ok(Array.isArray(initialUsers));
  const sanjay = initialUsers.find((u) => u.email.toLowerCase() === 'yourssanjay63@gmail.com');
  assert.ok(sanjay, 'Primary admin Sanjay must exist in users list');
  assert.equal(sanjay.name, 'Sanjay');
  assert.equal(sanjay.role, 'Super Admin');
  assert.equal('passwordHash' in sanjay, false, 'Passwords must not be exposed');
  assert.equal('salt' in sanjay, false, 'Salts must not be exposed');

  // 2. Create new administrator
  const testEmail = `newadmin_${Date.now()}@vathilaimotors.com`;
  const created = await createAdminUser({
    name: 'Showroom Manager',
    email: testEmail,
    password: 'managerPassword2026#',
    role: 'Admin',
    status: 'Active',
  });

  assert.ok(created.id);
  assert.equal(created.name, 'Showroom Manager');
  assert.equal(created.email, testEmail);
  assert.equal(created.role, 'Admin');
  assert.equal(created.status, 'Active');

  // 3. Newly created administrator can immediately authenticate and log in
  const authResult = await verifyAdminCredentials(testEmail, 'managerPassword2026#');
  assert.ok(authResult, 'New admin should be able to log in with provided password');
  assert.equal(authResult.email, testEmail);

  // 4. Update user role and password
  const updated = await updateAdminUser(created.id, {
    name: 'Senior Showroom Manager',
    role: 'Editor',
    password: 'updatedPassword999#',
  });
  assert.equal(updated.name, 'Senior Showroom Manager');
  assert.equal(updated.role, 'Editor');

  // New password must work, old password must fail
  const oldLogin = await verifyAdminCredentials(testEmail, 'managerPassword2026#');
  assert.equal(oldLogin, null, 'Old password must fail');
  const newLogin = await verifyAdminCredentials(testEmail, 'updatedPassword999#');
  assert.ok(newLogin, 'Updated password must work');

  // 5. Suspended user cannot log in
  await updateAdminUser(created.id, { status: 'Suspended' });
  await assert.rejects(
    async () => {
      await verifyAdminCredentials(testEmail, 'updatedPassword999#');
    },
    /suspended/
  );

  // 6. Delete admin user
  const delRes = await deleteAdminUser(created.id, 'adm-1');
  assert.equal(delRes.success, true);

  // Primary Super Admin cannot be deleted
  await assert.rejects(
    async () => {
      await deleteAdminUser(sanjay.id, 'other-id');
    },
    /Cannot delete the primary Super Administrator/
  );
});
