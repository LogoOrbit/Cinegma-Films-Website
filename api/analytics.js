// Analytics API
// GET /api/analytics/summary                   -> { stats }
// GET /api/analytics/films                     -> { films }
// GET /api/analytics/pages                     -> { pages }

const { createClient } = require('@supabase/supabase-js');
const auth = require('../lib/auth');

function sb() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

const ALLOWED_ORIGIN = process.env.SITE_URL || 'https://cinegmafilms.com';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Session-Token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const me = auth.getAuth(req);
    if (!me) return res.status(401).json({ error: 'Unauthorized' });

    const type = req.query?.view || 'summary';

    // ---- SUMMARY STATS ----
    if (type === 'summary') {
      const { data: filmCount } = await sb()
        .from('films')
        .select('id', { count: 'exact', head: true });
      const { data: teamCount } = await sb()
        .from('team_members')
        .select('id', { count: 'exact', head: true });
      const { data: serviceCount } = await sb()
        .from('services')
        .select('id', { count: 'exact', head: true });
      const { data: mediaCount } = await sb()
        .from('media')
        .select('id', { count: 'exact', head: true });
      const { data: recentMessages } = await sb()
        .from('contact_messages')
        .select('*')
        .eq('status', 'new')
        .order('created_at', { ascending: false })
        .limit(5);

      return res.json({
        stats: {
          totalFilms: filmCount?.length || 0,
          totalTeam: teamCount?.length || 0,
          totalServices: serviceCount?.length || 0,
          totalMedia: mediaCount?.length || 0,
          newMessages: recentMessages?.length || 0,
          recentMessages: recentMessages || [],
        },
      });
    }

    // ---- FILMS ANALYTICS ----
    if (type === 'films') {
      const { data: films } = await sb()
        .from('films')
        .select('id,title,slug,status,featured,created_at,updated_at')
        .order('created_at', { ascending: false })
        .limit(50);

      // Count by status
      const statuses = {};
      films?.forEach(f => {
        statuses[f.status] = (statuses[f.status] || 0) + 1;
      });

      return res.json({ films: films || [], stats: statuses });
    }

    // ---- CONTENT VERSIONS (Approval workflow) ----
    if (type === 'pending') {
      const { data: pending } = await sb()
        .from('content_versions')
        .select('id,entity_type,version_number,status,created_at,changed_by:changed_by(username)')
        .eq('status', 'pending_review')
        .order('created_at', { ascending: false });

      return res.json({ pending: pending || [] });
    }

    return res.status(400).json({ error: 'Unknown analytics type' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
