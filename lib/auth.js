// Shared auth helpers for the Cinegma Studio dashboard.
// - Session tokens are HMAC-signed (no extra env var needed: the signing
//   secret is derived from existing server-only secrets).
// - Admin passwords are hashed with scrypt before being stored in Supabase.

const crypto = require('crypto');

function serverSecret() {
  return crypto
    .createHash('sha256')
    .update((process.env.SUPABASE_SERVICE_KEY || '') + (process.env.DASHBOARD_PASSWORD || '') + 'cinegma-studio')
    .digest();
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s) {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function signToken(payload) {
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(crypto.createHmac('sha256', serverSecret()).update(body).digest());
  return body + '.' + sig;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string' || token.indexOf('.') < 0) return null;
  const [body, sig] = token.split('.');
  const expected = b64url(crypto.createHmac('sha256', serverSecret()).update(body).digest());
  try {
    if (sig.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch (_) {
    return null;
  }
  let p;
  try { p = JSON.parse(b64urlDecode(body).toString()); } catch (_) { return null; }
  if (p.exp && Date.now() > p.exp) return null;
  return p;
}

function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(pw), salt, 64);
  return 'scrypt$' + salt.toString('hex') + '$' + hash.toString('hex');
}

function verifyPassword(pw, stored) {
  if (!stored || !stored.startsWith('scrypt$')) return false;
  const [, saltHex, hashHex] = stored.split('$');
  try {
    const hash = crypto.scryptSync(String(pw), Buffer.from(saltHex, 'hex'), 64);
    return crypto.timingSafeEqual(hash, Buffer.from(hashHex, 'hex'));
  } catch (_) {
    return false;
  }
}

function ownerUsername() {
  return process.env.OWNER_USERNAME || 'owner';
}

// Returns { username, role } for an authenticated request, or null.
// Accepts a session token (X-Session-Token) or, for backwards compatibility,
// the legacy shared password (treated as the owner).
function getAuth(req) {
  const token = req.headers['x-session-token'];
  if (token) {
    const p = verifyToken(token);
    if (p) return { username: p.u, role: p.role };
  }
  const pw = req.headers['x-dashboard-password'] || (req.body && req.body.password);
  if (pw && process.env.DASHBOARD_PASSWORD && pw === process.env.DASHBOARD_PASSWORD) {
    return { username: ownerUsername(), role: 'owner' };
  }
  return null;
}

// ---- Role-scoped visibility ----------------------------------------------
// owner -> everything; admin -> all non-owner content; user -> only their own.
// Rows with no recorded author_role (created before authorship existed) are
// treated as owner-owned, so only the owner sees them in the dashboard.

const ROLES = ['owner', 'admin', 'user'];

function normalizeRole(role) {
  return ROLES.indexOf(role) >= 0 ? role : 'user';
}

// Can `me` see/modify a single row ({ author, author_role })?
function canAccess(me, row) {
  if (!me || !row) return false;
  if (me.role === 'owner') return true;
  const authorRole = row.author_role || 'owner';
  if (me.role === 'admin') return authorRole !== 'owner';
  return row.author === me.username; // user: own work only
}

// Narrow a Supabase select() query to the rows `me` is allowed to see.
function scopeQuery(query, me) {
  if (!me || me.role === 'owner') return query;
  if (me.role === 'admin') return query.neq('author_role', 'owner');
  return query.eq('author', me.username);
}

module.exports = {
  signToken, verifyToken, hashPassword, verifyPassword, getAuth, ownerUsername,
  ROLES, normalizeRole, canAccess, scopeQuery,
};
