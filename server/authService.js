import { randomBytes, randomInt, createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const testAuthFilePath = process.env.NODE_ENV === 'test' && process.env.ADMIN_AUTH_STORE_PATH;
const authFilePath = testAuthFilePath
  ? resolve(testAuthFilePath)
  : join(__dirname, 'data', 'adminAuth.json');

let mongoDbRef = null;

export function setAuthMongoDatabase(db) {
  mongoDbRef = db;
}

export function validateAdminBootstrapConfig({ production = process.env.NODE_ENV === 'production' } = {}) {
  const emailIsSet = process.env.ADMIN_BOOTSTRAP_EMAIL !== undefined;
  const passwordIsSet = process.env.ADMIN_BOOTSTRAP_PASSWORD !== undefined;

  if (production && (emailIsSet || passwordIsSet)) {
    throw new Error('ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD cannot be set in production.');
  }
  if (emailIsSet !== passwordIsSet) {
    throw new Error('Set both ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD to bootstrap an administrator.');
  }
  if (!emailIsSet) return null;

  const email = process.env.ADMIN_BOOTSTRAP_EMAIL.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!email || !email.includes('@')) {
    throw new Error('ADMIN_BOOTSTRAP_EMAIL must be a valid email address.');
  }
  if (password.length < 12) {
    throw new Error('ADMIN_BOOTSTRAP_PASSWORD must contain at least 12 characters.');
  }

  return { email, password };
}

export function hashPassword(password, salt) {
  return createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

async function createEmptyAuthStore(existingStore = { adminUsers: [], sessions: [] }) {
  const bootstrap = validateAdminBootstrapConfig();
  const store = {
    ...existingStore,
    adminUsers: [],
    sessions: Array.isArray(existingStore.sessions) ? existingStore.sessions : [],
  };
  if (!bootstrap) return store;

  const now = new Date().toISOString();
  const salt = randomBytes(16).toString('hex');
  store.adminUsers.push({
    id: `adm-${Date.now()}-${randomBytes(3).toString('hex')}`,
    email: bootstrap.email,
    name: bootstrap.email.split('@')[0],
    role: 'Super Admin',
    status: 'Active',
    passwordHash: hashPassword(bootstrap.password, salt),
    salt,
    resetCode: null,
    resetExpires: null,
    createdAt: now,
    updatedAt: now,
  });
  await writeAuthStore(store);
  return store;
}

export async function readAuthStore() {
  validateAdminBootstrapConfig();

  if (mongoDbRef) {
    try {
      const col = mongoDbRef.collection('admin_auth');
      const doc = await col.findOne({ _id: 'admin_auth_store' });
      if (doc && Array.isArray(doc.adminUsers)) {
        const store = {
          adminUsers: doc.adminUsers,
          sessions: Array.isArray(doc.sessions) ? doc.sessions : [],
        };
        if (store.adminUsers.length > 0) return store;
        return createEmptyAuthStore(store);
      }
    } catch (e) {
      console.warn('[AuthService] MongoDB read failed, falling back to JSON file:', e.message);
    }
  }

  try {
    if (existsSync(authFilePath)) {
      const raw = await readFile(authFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.adminUsers)) {
        if (parsed.adminUsers.length > 0) return parsed;
        return createEmptyAuthStore(parsed);
      }
      throw new Error('The admin auth store has an invalid format.');
    }
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw new Error('Could not read the admin auth store.', { cause: e });
    }
  }

  return createEmptyAuthStore();
}

export async function writeAuthStore(data) {
  try {
    await mkdir(dirname(authFilePath), { recursive: true });
    await writeFile(authFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('[AuthService] Failed writing adminAuth.json:', e);
  }

  if (mongoDbRef) {
    try {
      const col = mongoDbRef.collection('admin_auth');
      await col.updateOne(
        { _id: 'admin_auth_store' },
        { $set: { adminUsers: data.adminUsers, sessions: data.sessions, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
    } catch (e) {
      console.warn('[AuthService] MongoDB write failed:', e.message);
    }
  }
}

export async function verifyAdminCredentials(rawEmail, password) {
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!email || !password) return null;

  const store = await readAuthStore();
  const user = store.adminUsers.find((u) => u.email.toLowerCase() === email);
  if (!user) return null;

  if (user.status && user.status.toLowerCase() === 'suspended') {
    const error = new Error('This administrator account has been suspended. Please contact the Super Administrator.');
    error.code = 'account_suspended';
    throw error;
  }

  if (!user.salt || !user.passwordHash) return null;
  const hash = hashPassword(password, user.salt);
  if (hash !== user.passwordHash) {
    return null;
  }

  user.lastLogin = new Date().toISOString();
  await writeAuthStore(store);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status || 'Active',
  };
}

export async function createAdminSession(user, { rememberMe = false } = {}) {
  const store = await readAuthStore();
  const token = randomBytes(32).toString('hex');
  const now = Date.now();
  // 30 days if rememberMe, otherwise 24 hours
  const durationMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const expiresAt = new Date(now + durationMs).toISOString();

  // Prune expired sessions
  const validSessions = (store.sessions || []).filter(
    (s) => new Date(s.expiresAt).getTime() > now
  );

  const sessionObj = {
    token,
    userId: user.id,
    user: {
      name: user.name,
      email: user.email,
      role: user.role,
    },
    createdAt: new Date(now).toISOString(),
    expiresAt,
  };

  validSessions.push(sessionObj);
  store.sessions = validSessions;
  await writeAuthStore(store);

  return sessionObj;
}

export async function getAdminSession(token) {
  if (!token) return null;
  const store = await readAuthStore();
  const now = Date.now();
  const session = (store.sessions || []).find((s) => s.token === token);
  if (!session) return null;

  if (new Date(session.expiresAt).getTime() <= now) {
    // Expired
    store.sessions = (store.sessions || []).filter((s) => s.token !== token);
    await writeAuthStore(store);
    return null;
  }

  return session;
}

export async function revokeAdminSession(token) {
  if (!token) return;
  const store = await readAuthStore();
  store.sessions = (store.sessions || []).filter((s) => s.token !== token);
  await writeAuthStore(store);
}

export async function generatePasswordResetCode(rawEmail) {
  const email = String(rawEmail || '').trim().toLowerCase();
  const store = await readAuthStore();
  const user = store.adminUsers.find((u) => u.email.toLowerCase() === email);
  if (!user) {
    throw new Error(`No administrator account found with email: ${rawEmail}`);
  }

  // 6-digit cryptographically secure code: 100000 through 999999 inclusive
  const code = randomInt(100000, 1000000).toString();
  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

  user.resetCode = code;
  user.resetExpires = expires;
  user.updatedAt = new Date().toISOString();

  await writeAuthStore(store);
  return { code, email: user.email, expires };
}

export async function resetAdminPassword(rawEmail, code, newPassword) {
  const email = String(rawEmail || '').trim().toLowerCase();
  const cleanCode = String(code || '').trim();
  const cleanPassword = String(newPassword || '');

  if (!cleanPassword || cleanPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const store = await readAuthStore();
  const user = store.adminUsers.find((u) => u.email.toLowerCase() === email);
  if (!user) {
    throw new Error('Administrator account not found.');
  }

  if (!user.resetCode || user.resetCode !== cleanCode) {
    throw new Error('Invalid verification reset code.');
  }

  const resetExpires = Date.parse(user.resetExpires);
  if (!Number.isFinite(resetExpires) || resetExpires <= Date.now()) {
    throw new Error('Verification code has expired. Please request a new code.');
  }

  // Generate new salt and hash
  const newSalt = randomBytes(16).toString('hex');
  const newHash = hashPassword(cleanPassword, newSalt);

  user.salt = newSalt;
  user.passwordHash = newHash;
  user.resetCode = null;
  user.resetExpires = null;
  user.updatedAt = new Date().toISOString();

  // Revoke all existing sessions so old logins must authenticate with new password
  store.sessions = (store.sessions || []).filter((s) => s.userId !== user.id && s.user?.email !== user.email);

  await writeAuthStore(store);
  return { success: true, email: user.email };
}

export async function clearPasswordResetCode(rawEmail) {
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!email) return false;
  const store = await readAuthStore();
  const user = store.adminUsers.find((u) => u.email.toLowerCase() === email);
  if (!user) return false;
  if (user.resetCode === null && user.resetExpires === null) return false;
  user.resetCode = null;
  user.resetExpires = null;
  user.updatedAt = new Date().toISOString();
  await writeAuthStore(store);
  const persistedStore = await readAuthStore();
  const persistedUser = persistedStore.adminUsers.find((candidate) => candidate.email.toLowerCase() === email);
  if (!persistedUser || persistedUser.resetCode != null || persistedUser.resetExpires != null) {
    throw new Error('Could not invalidate the pending password reset.');
  }
  return true;
}

/**
 * Returns list of administrator accounts for Users & Roles management.
 * Omits sensitive cryptographic fields (passwords, salts, reset tokens).
 */
export async function listAdminUsers() {
  const store = await readAuthStore();
  return (store.adminUsers || []).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role || 'Admin',
    status: u.status || 'Active',
    lastLogin: u.lastLogin || null,
    createdAt: u.createdAt || null,
    updatedAt: u.updatedAt || null,
  }));
}

/**
 * Adds a new administrator account with salted SHA-256 password hashing.
 * The created user can immediately sign in to /admin.
 */
export async function createAdminUser({ name, email, password, role = 'Admin', status = 'Active' }) {
  const cleanName = String(name || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPassword = String(password || '');

  if (!cleanName) throw new Error('Full Name is required.');
  if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('A valid email address is required.');
  if (!cleanPassword || cleanPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const validRoles = ['Super Admin', 'Admin', 'Editor', 'Support'];
  const cleanRole = validRoles.includes(role) ? role : 'Admin';
  const cleanStatus = status === 'Suspended' ? 'Suspended' : 'Active';

  const store = await readAuthStore();
  const exists = store.adminUsers.some((u) => u.email.toLowerCase() === cleanEmail);
  if (exists) {
    throw new Error(`An administrator account with email ${cleanEmail} already exists.`);
  }

  const salt = randomBytes(16).toString('hex');
  const passwordHash = hashPassword(cleanPassword, salt);
  const now = new Date().toISOString();

  const newUser = {
    id: `adm-${Date.now()}-${randomBytes(3).toString('hex')}`,
    name: cleanName,
    email: cleanEmail,
    role: cleanRole,
    status: cleanStatus,
    passwordHash,
    salt,
    resetCode: null,
    resetExpires: null,
    lastLogin: null,
    createdAt: now,
    updatedAt: now,
  };

  store.adminUsers.push(newUser);
  await writeAuthStore(store);

  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    status: newUser.status,
    createdAt: newUser.createdAt,
    updatedAt: newUser.updatedAt,
  };
}

/**
 * Updates an existing administrator's details, role, status, or password.
 */
export async function updateAdminUser(id, { name, email, password, role, status }) {
  if (!id) throw new Error('User ID is required.');
  const store = await readAuthStore();
  const user = store.adminUsers.find((u) => u.id === id);
  if (!user) {
    throw new Error('Administrator account not found.');
  }

  if (name !== undefined) {
    const cleanName = String(name || '').trim();
    if (!cleanName) throw new Error('Full Name cannot be empty.');
    user.name = cleanName;
  }

  if (email !== undefined) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('A valid email address is required.');
    const duplicate = store.adminUsers.some((u) => u.id !== id && u.email.toLowerCase() === cleanEmail);
    if (duplicate) throw new Error(`Another administrator already uses email ${cleanEmail}.`);
    user.email = cleanEmail;
  }

  const validRoles = ['Super Admin', 'Admin', 'Editor', 'Support'];
  if (role !== undefined && validRoles.includes(role)) {
    user.role = role;
  }

  if (status !== undefined) {
    user.status = status === 'Suspended' ? 'Suspended' : 'Active';
    if (user.status === 'Suspended') {
      // Revoke any active sessions immediately
      store.sessions = (store.sessions || []).filter((s) => s.userId !== id);
    }
  }

  if (password) {
    const cleanPassword = String(password || '');
    if (cleanPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }
    const newSalt = randomBytes(16).toString('hex');
    user.salt = newSalt;
    user.passwordHash = hashPassword(cleanPassword, newSalt);
    user.resetCode = null;
    user.resetExpires = null;
    // Revoke old sessions
    store.sessions = (store.sessions || []).filter((s) => s.userId !== id);
  }

  user.updatedAt = new Date().toISOString();
  await writeAuthStore(store);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status || 'Active',
    lastLogin: user.lastLogin || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Removes an administrator account, revoking active sessions.
 * Protects primary Super Admin from accidental deletion.
 */
export async function deleteAdminUser(id, currentUserId) {
  if (!id) throw new Error('User ID is required.');
  const store = await readAuthStore();
  const user = store.adminUsers.find((u) => u.id === id);
  if (!user) {
    throw new Error('Administrator account not found.');
  }

  if (user.role === 'Super Admin'
    && store.adminUsers.filter((admin) => admin.role === 'Super Admin').length === 1) {
    throw new Error('Cannot delete the last Super Administrator account.');
  }

  if (currentUserId && (user.id === currentUserId || user.email.toLowerCase() === String(currentUserId).toLowerCase())) {
    throw new Error('You cannot delete your own active administrator account.');
  }

  store.adminUsers = store.adminUsers.filter((u) => u.id !== id);
  store.sessions = (store.sessions || []).filter((s) => s.userId !== id);
  await writeAuthStore(store);

  return { success: true };
}
