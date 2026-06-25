const { createClient } = require('@supabase/supabase-js');
const auth = require('../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const me = auth.getAuth(req);
    if (!me) return res.status(401).json({ error: 'Unauthorized' });
    if (me.role !== 'owner') return res.status(403).json({ error: 'Owner only' });

    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const limit = Math.min(parseInt(req.query?.limit) || 100, 500);
    const offset = parseInt(req.query?.offset) || 0;
    const username = req.query?.username;
    const category = req.query?.category;

    let query = sb.from('audit_log').select('*', { count: 'exact' });
    if (username) query = query.eq('username', username);
    if (category) query = query.eq('category', category);
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ data: data || [], total: count || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
