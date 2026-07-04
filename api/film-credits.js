// Film Credits API
// POST /api/film-credits { action: 'create', credit: {...} }    -> { credit }
// GET /api/film-credits?film_id=xxx                             -> { credits: [...] }
// PATCH /api/film-credits/:id { credit: {...} }                 -> { credit }
// DELETE /api/film-credits/:id                                  -> { ok }

const { createClient } = require('@supabase/supabase-js');
const auth = require('../lib/auth');
const { logEvent } = require('../lib/audit');

function sb() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

const ALLOWED_ORIGIN = process.env.SITE_URL || 'https://cinegmafilms.com';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Session-Token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const me = auth.getAuth(req);
    if (!me) return res.status(401).json({ error: 'Unauthorized' });

    const { action, credit } = req.body || {};

    // ---- CREATE CREDIT ----
    if (req.method === 'POST' && action === 'create') {
      if (!credit || !credit.film_id || !credit.team_member_id || !credit.role) {
        return res.status(400).json({ error: 'film_id, team_member_id, role are required' });
      }

      const creditData = {
        film_id: credit.film_id,
        team_member_id: credit.team_member_id,
        role: credit.role,
        character_name: credit.character_name || null,
        order: credit.order || 0,
      };

      const { data, error } = await sb().from('film_credits').insert([creditData]).select('*').single();
      if (error) throw error;

      await logEvent(req, { action: 'film_credit_created', category: 'films', entity_id: credit.film_id });
      return res.json({ credit: data });
    }

    // ---- LIST CREDITS ----
    if (req.method === 'GET') {
      let query = sb()
        .from('film_credits')
        .select('*,team_member:team_member_id(id,name,slug,photo_url)');

      if (req.query?.film_id) query = query.eq('film_id', req.query.film_id);

      const { data, error } = await query.order('order');
      if (error) throw error;

      return res.json({ credits: data || [] });
    }

    // Get single credit
    const creditId = req.url?.split('/').pop();
    if (req.method === 'GET' && creditId && creditId !== 'film-credits') {
      const { data, error } = await sb()
        .from('film_credits')
        .select('*,team_member:team_member_id(id,name,slug)')
        .eq('id', creditId)
        .single();
      if (error) return res.status(404).json({ error: 'Credit not found' });
      return res.json({ credit: data });
    }

    // ---- UPDATE CREDIT ----
    if (req.method === 'PATCH' && creditId && creditId !== 'film-credits') {
      if (!credit) return res.status(400).json({ error: 'credit object is required' });

      const { data, error } = await sb()
        .from('film_credits')
        .update({
          role: credit.role,
          character_name: credit.character_name,
          order: credit.order,
        })
        .eq('id', creditId)
        .select('*')
        .single();
      if (error) throw error;

      await logEvent(req, { action: 'film_credit_updated', category: 'films' });
      return res.json({ credit: data });
    }

    // ---- DELETE CREDIT ----
    if (req.method === 'DELETE' && creditId && creditId !== 'film-credits') {
      const { error } = await sb().from('film_credits').delete().eq('id', creditId);
      if (error) throw error;

      await logEvent(req, { action: 'film_credit_deleted', category: 'films' });
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: 'Invalid request' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
