// Login + admin management for Cinegma Studio.
// POST { action: 'login', username, password }     -> { token, role, username }
// POST { action: 'me' }                             -> { username, role }   (any logged-in user)
// POST { action: 'profile_get' }                    -> { profile }          (any logged-in user)
// POST { action: 'profile_update', profile }        -> { profile }          (any logged-in user)
// POST { action: 'password_change', current_password, new_password } -> { ok } (db admins)
// POST { action: 'list' }                           -> [admins]             (owner only)
// POST { action: 'create', username, password, role }-> admin               (owner only)
// POST { action: 'delete', id }                     -> { ok }               (owner only)

// Editable profile fields (avatar/role/username are handled separately).
const PROFILE_FIELDS = ['full_name', 'email', 'phone', 'location', 'title', 'bio', 'avatar_url'];

function emptyProfile() {
  return PROFILE_FIELDS.reduce((acc, k) => { acc[k] = ''; return acc; }, {});
}

const { createClient } = require('@supabase/supabase-js');
const auth = require('../lib/auth');
const { logEvent } = require('../lib/audit');

const SESSION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function sb() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Session-Token');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { action } = req.body || {};

    // ---- LOGIN (no session required) ----
    if (action === 'login') {
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

      // Owner via env (master credentials)
      if (
        process.env.DASHBOARD_PASSWORD &&
        password === process.env.DASHBOARD_PASSWORD &&
        username === auth.ownerUsername()
      ) {
        const token = auth.signToken({ u: username, role: 'owner', exp: Date.now() + SESSION_MS });
        await logEvent(req, { action: 'login', category: 'auth', username, role: 'owner', details: { method: 'master_password' } });
        return res.json({ token, role: 'owner', username });
      }

      // Database admins
      const { data } = await sb().from('admins').select('*').eq('username', username).maybeSingle();
      if (data && auth.verifyPassword(password, data.password_hash)) {
        const token = auth.signToken({ u: data.username, role: data.role, exp: Date.now() + SESSION_MS });
        await logEvent(req, { action: 'login', category: 'auth', username: data.username, role: data.role, details: { method: 'password' } });
        return res.json({ token, role: data.role, username: data.username });
      }
      await logEvent(req, { action: 'login_failed', category: 'auth', username: username || 'unknown', role: 'none', details: { reason: 'invalid_credentials' } });
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // ---- Everything else requires a valid session ----
    const me = auth.getAuth(req);
    if (!me) return res.status(401).json({ error: 'Unauthorized' });

    if (action === 'me') return res.json(me);

    // ---- Profile (available to every logged-in member) ----
    if (action === 'profile_get') {
      const { data, error } = await sb().from('profiles').select('*').eq('username', me.username).maybeSingle();
      if (error) throw error;
      const profile = Object.assign(emptyProfile(), data || {});
      profile.username = me.username;
      profile.role = me.role;
      return res.json({ profile });
    }

    if (action === 'profile_update') {
      const input = req.body.profile || {};
      const row = { username: me.username, updated_at: new Date().toISOString() };
      for (const f of PROFILE_FIELDS) {
        if (input[f] !== undefined) row[f] = input[f] === '' ? null : input[f];
      }
      if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
      }
      const { data, error } = await sb()
        .from('profiles')
        .upsert(row, { onConflict: 'username' })
        .select('*')
        .single();
      if (error) throw error;
      await logEvent(req, { action: 'profile_updated', category: 'auth', username: me.username, role: me.role, details: { fields: Object.keys(row).filter(k => k !== 'username' && k !== 'updated_at') } });
      const profile = Object.assign(emptyProfile(), data || {});
      profile.username = me.username;
      profile.role = me.role;
      return res.json({ profile });
    }

    if (action === 'password_change') {
      const { current_password, new_password } = req.body;
      if (!current_password || !new_password) return res.status(400).json({ error: 'Current and new password are required' });
      if (String(new_password).length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });

      // The env-based owner account has no stored hash — its password is the
      // DASHBOARD_PASSWORD environment variable and can't be changed here.
      if (me.username === auth.ownerUsername()) {
        return res.status(400).json({ error: 'The owner password is set via the DASHBOARD_PASSWORD environment variable and cannot be changed from the dashboard.' });
      }

      const { data: account } = await sb().from('admins').select('id,password_hash').eq('username', me.username).maybeSingle();
      if (!account) return res.status(404).json({ error: 'Account not found' });
      if (!auth.verifyPassword(current_password, account.password_hash)) {
        await logEvent(req, { action: 'password_change_failed', category: 'auth', username: me.username, role: me.role, details: { reason: 'wrong_current_password' } });
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      const { error } = await sb().from('admins').update({ password_hash: auth.hashPassword(new_password) }).eq('id', account.id);
      if (error) throw error;
      await logEvent(req, { action: 'password_changed', category: 'auth', username: me.username, role: me.role });
      return res.json({ ok: true });
    }

    // ---- Owner-only admin management ----
    if (me.role !== 'owner') return res.status(403).json({ error: 'Only the owner can manage admins' });

    if (action === 'list') {
      const { data, error } = await sb().from('admins').select('id,username,role,created_at').order('created_at');
      if (error) throw error;
      return res.json(data || []);
    }

    if (action === 'create') {
      const { username, password, role } = req.body;
      if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
      if (username === auth.ownerUsername()) return res.status(400).json({ error: 'That username is reserved for the owner' });
      const password_hash = auth.hashPassword(password);
      const { data, error } = await sb()
        .from('admins')
        .insert({ username, password_hash, role: auth.normalizeRole(role) })
        .select('id,username,role,created_at')
        .single();
      if (error) {
        if (String(error.message).includes('duplicate')) return res.status(409).json({ error: 'That username already exists' });
        throw error;
      }
      await logEvent(req, { action: 'admin_created', category: 'auth', username: me.username, role: me.role, details: { target_username: username, target_role: auth.normalizeRole(role) } });
      return res.json(data);
    }

    if (action === 'delete') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { data: target } = await sb().from('admins').select('username,role').eq('id', id).maybeSingle();
      const { error } = await sb().from('admins').delete().eq('id', id);
      if (error) throw error;
      await logEvent(req, { action: 'admin_deleted', category: 'auth', username: me.username, role: me.role, details: { target_username: target?.username, target_id: id } });
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
