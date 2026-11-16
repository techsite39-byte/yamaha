import { randomBytes, createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const authFilePath = join(__dirname, 'data', 'adminAuth.json');

const DEFAULT_SALT = 'vathilai_admin_salt_2026';
// sha256 of 'vathilai_admin_salt_2026:admin123456#'
const DEFAULT_HASH = 'db0d819cde72cf2ceab70eaa696f269b64002a4056bc36d8eb661e1b9a6668c3';

export const DEFAULT_ADMIN = {
  id: 'adm-1',
  email: 'yourssanjay63@gmail.com',
  name: 'Sanjay',
  role: 'Super Admin',
  status: 'Active',
  passwordHash: DEFAULT_HASH,
  salt: DEFAULT_SALT,
  resetCode: null,
  resetExpires: null,
  createdAt: '2026-11-16T00:00:00.000Z',
  updatedAt: '2026-11-16T00:00:00.000Z',
};

let mongoDbRef = null;

export function setAuthMongoDatabase(db) {
  mongoDbRef = db;
}

export function hashPassword(password, salt) {
  return createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

export async function readAuthStore() {
  if (mongoDbRef) {
    try {
      const col = mongoDbRef.collection('admin_auth');
      const doc = await col.findOne({ _id: 'admin_auth_store' });
      if (doc && Array.isArray(doc.adminUsers) && doc.adminUsers.length > 0) {
        return {
          adminUsers: doc.adminUsers,
          sessions: Array.isArray(doc.sessions) ? doc.sessions : [],
        };
      }
    } catch (e) {
      console.warn('[AuthService] MongoDB read failed, falling back to JSON file:', e.message);
    }
  }

  try {
    if (existsSync(authFilePath)) {
      const raw = await readFile(authFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.adminUsers) && parsed.adminUsers.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[AuthService] Could not read adminAuth.json, initializing default:', e.message);
  }

  const initial = {
    adminUsers: [DEFAULT_ADMIN],
    sessions: [],
  };
  await writeAuthStore(initial);
  return initial;
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

  const hash = hashPassword(password, user.salt || DEFAULT_SALT);
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

  // 6-digit random code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
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

  if (!user.resetExpires || new Date(user.resetExpires).getTime() < Date.now()) {
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

  if (user.email.toLowerCase() === 'yourssanjay63@gmail.com') {
    throw new Error('Cannot delete the primary Super Administrator account.');
  }

  if (currentUserId && (user.id === currentUserId || user.email.toLowerCase() === String(currentUserId).toLowerCase())) {
    throw new Error('You cannot delete your own active administrator account.');
  }

  store.adminUsers = store.adminUsers.filter((u) => u.id !== id);
  store.sessions = (store.sessions || []).filter((s) => s.userId !== id);
  await writeAuthStore(store);

  return { success: true };
}
