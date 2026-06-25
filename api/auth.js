// Login + admin management for Cinegma Studio.
// POST { action: 'login', username, password }     -> { token, role, username }
// POST { action: 'me' }                             -> { username, role }   (any logged-in user)
// POST { action: 'list' }                           -> [admins]             (owner only)
// POST { action: 'create', username, password, role }-> admin               (owner only)
// POST { action: 'delete', id }                     -> { ok }               (owner only)

const { createClient } = require('@supabase/supabase-js');
const auth = require('../lib/auth');

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
        return res.json({ token, role: 'owner', username });
      }

      // Database admins
      const { data } = await sb().from('admins').select('*').eq('username', username).maybeSingle();
      if (data && auth.verifyPassword(password, data.password_hash)) {
        const token = auth.signToken({ u: data.username, role: data.role, exp: Date.now() + SESSION_MS });
        return res.json({ token, role: data.role, username: data.username });
      }
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // ---- Everything else requires a valid session ----
    const me = auth.getAuth(req);
    if (!me) return res.status(401).json({ error: 'Unauthorized' });

    if (action === 'me') return res.json(me);

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
      return res.json(data);
    }

    if (action === 'delete') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { error } = await sb().from('admins').delete().eq('id', id);
      if (error) throw error;
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
