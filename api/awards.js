// Awards API
// POST /api/awards { action: 'create', award: {...} }           -> { award }
// GET /api/awards?film_id=xxx                                   -> { awards: [...] }
// GET /api/awards/:id                                           -> { award }
// PATCH /api/awards/:id { award: {...} }                        -> { award }
// DELETE /api/awards/:id                                        -> { ok }

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

    const { action, award } = req.body || {};

    // ---- CREATE AWARD ----
    if (req.method === 'POST' && action === 'create') {
      if (!award || !award.film_id || !award.award_name || !award.festival_name) {
        return res.status(400).json({ error: 'film_id, award_name, festival_name are required' });
      }

      const awardData = {
        film_id: award.film_id,
        award_name: award.award_name,
        festival_name: award.festival_name,
        award_category: award.award_category || null,
        year: award.year || new Date().getFullYear(),
        award_date: award.award_date || null,
        award_type: award.award_type || 'win',
        details: award.details || null,
        url: award.url || null,
      };

      const { data, error } = await sb().from('awards').insert([awardData]).select('*').single();
      if (error) throw error;

      await logEvent(req, { action: 'award_created', category: 'awards', entity_id: award.film_id });
      return res.json({ award: data });
    }

    // ---- LIST AWARDS ----
    if (req.method === 'GET') {
      let query = sb()
        .from('awards')
        .select('*,film:film_id(title,slug)');

      if (req.query?.film_id) query = query.eq('film_id', req.query.film_id);
      if (req.query?.year) query = query.eq('year', parseInt(req.query.year));

      const { data, error } = await query.order('year', { ascending: false }).order('award_date', { ascending: false });
      if (error) throw error;

      return res.json({ awards: data || [] });
    }

    // Get single award
    const awardId = req.url?.split('/').pop();
    if (req.method === 'GET' && awardId && awardId !== 'awards') {
      const { data, error } = await sb()
        .from('awards')
        .select('*')
        .eq('id', awardId)
        .single();
      if (error) return res.status(404).json({ error: 'Award not found' });
      return res.json({ award: data });
    }

    // ---- UPDATE AWARD ----
    if (req.method === 'PATCH' && awardId && awardId !== 'awards') {
      if (!award) return res.status(400).json({ error: 'award object is required' });

      const { data, error } = await sb()
        .from('awards')
        .update({
          award_name: award.award_name,
          festival_name: award.festival_name,
          award_category: award.award_category,
          year: award.year,
          award_date: award.award_date,
          award_type: award.award_type,
          details: award.details,
          url: award.url,
        })
        .eq('id', awardId)
        .select('*')
        .single();
      if (error) throw error;

      await logEvent(req, { action: 'award_updated', category: 'awards' });
      return res.json({ award: data });
    }

    // ---- DELETE AWARD ----
    if (req.method === 'DELETE' && awardId && awardId !== 'awards') {
      const { error } = await sb().from('awards').delete().eq('id', awardId);
      if (error) throw error;

      await logEvent(req, { action: 'award_deleted', category: 'awards' });
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: 'Invalid request' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
