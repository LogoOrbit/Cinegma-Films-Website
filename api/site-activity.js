const { createClient } = require('@supabase/supabase-js');
const auth = require('../lib/auth');

function sb() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

function parseUA(ua) {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };
  let browser = 'Unknown', os = 'Unknown', device = 'Desktop';
  if (/Mobile|Android|iPhone|iPad/i.test(ua)) device = /iPad|Tablet/i.test(ua) ? 'Tablet' : 'Mobile';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome\//i.test(ua)) browser = 'Chrome';
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';
  return { browser, os, device };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Session-Token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'POST') {
      const { event, page, referrer, sessionId, details, screenW, screenH } = req.body || {};
      if (!event || !page) return res.status(400).json({ error: 'event and page required' });

      const ua = req.headers['user-agent'] || '';
      const { browser, os, device } = parseUA(ua);
      const ip = (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '').split(',')[0].trim();

      await sb().from('site_activity').insert({
        event: String(event).slice(0, 50),
        page: String(page).slice(0, 500),
        referrer: referrer ? String(referrer).slice(0, 500) : null,
        session_id: sessionId ? String(sessionId).slice(0, 64) : null,
        details: details || null,
        ip_address: ip || null,
        user_agent: ua.slice(0, 500),
        browser, os, device,
        screen_w: screenW || null,
        screen_h: screenH || null,
      });

      return res.json({ ok: true });
    }

    if (req.method === 'GET') {
      const me = auth.getAuth(req);
      if (!me) return res.status(401).json({ error: 'Unauthorized' });
      if (me.role !== 'owner') return res.status(403).json({ error: 'Owner only' });

      const action = req.query?.action || 'list';
      const s = sb();

      if (action === 'stats') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const week = new Date(now - 7 * 86400000).toISOString();
        const month = new Date(now - 30 * 86400000).toISOString();

        const [todayR, weekR, monthR, pagesR, browsersR, devicesR, referrersR, countryR] = await Promise.all([
          s.from('site_activity').select('id', { count: 'exact', head: true }).eq('event', 'page_view').gte('created_at', today),
          s.from('site_activity').select('id', { count: 'exact', head: true }).eq('event', 'page_view').gte('created_at', week),
          s.from('site_activity').select('id', { count: 'exact', head: true }).eq('event', 'page_view').gte('created_at', month),
          s.rpc('site_activity_top_pages', { since: month }).catch(() => ({ data: null })),
          s.rpc('site_activity_top_browsers', { since: month }).catch(() => ({ data: null })),
          s.rpc('site_activity_top_devices', { since: month }).catch(() => ({ data: null })),
          s.rpc('site_activity_top_referrers', { since: month }).catch(() => ({ data: null })),
          s.rpc('site_activity_top_countries', { since: month }).catch(() => ({ data: null })),
        ]);

        const uniqueToday = await s.from('site_activity').select('session_id').eq('event', 'page_view').gte('created_at', today);
        const uniqueWeek = await s.from('site_activity').select('session_id').eq('event', 'page_view').gte('created_at', week);
        const uniqueVisitorsToday = new Set((uniqueToday.data || []).map(r => r.session_id).filter(Boolean)).size;
        const uniqueVisitorsWeek = new Set((uniqueWeek.data || []).map(r => r.session_id).filter(Boolean)).size;

        return res.json({
          views_today: todayR.count || 0,
          views_week: weekR.count || 0,
          views_month: monthR.count || 0,
          visitors_today: uniqueVisitorsToday,
          visitors_week: uniqueVisitorsWeek,
          top_pages: pagesR.data || [],
          top_browsers: browsersR.data || [],
          top_devices: devicesR.data || [],
          top_referrers: referrersR.data || [],
          top_countries: countryR.data || [],
        });
      }

      const limit = Math.min(parseInt(req.query?.limit) || 100, 500);
      const offset = parseInt(req.query?.offset) || 0;
      const event = req.query?.event;
      const page = req.query?.page;

      let query = s.from('site_activity').select('*', { count: 'exact' });
      if (event) query = query.eq('event', event);
      if (page) query = query.ilike('page', `%${page}%`);
      query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return res.json({ data: data || [], total: count || 0 });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
