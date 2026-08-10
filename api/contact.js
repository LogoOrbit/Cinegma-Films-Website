const { createClient } = require('@supabase/supabase-js');

const ALLOWED_ORIGIN = process.env.SITE_URL || 'https://cinegmafilms.com';

function sb() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Session-Token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // GET: list messages (owner only)
    if (req.method === 'GET') {
      const auth = require('../lib/auth');
      const me = auth.getAuth(req);
      if (!me) return res.status(401).json({ error: 'Unauthorized' });
      if (me.role !== 'owner') return res.status(403).json({ error: 'Owner only' });

      const limit = Math.min(parseInt(req.query?.limit) || 50, 200);
      const offset = parseInt(req.query?.offset) || 0;
      const unread = req.query?.unread === '1';

      let query = sb().from('contact_messages').select('*', { count: 'exact' });
      if (unread) query = query.eq('status', 'new');
      query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return res.json({ data: data || [], total: count || 0 });
    }

    // PUT: update message status (owner only)
    if (req.method === 'PUT') {
      const auth = require('../lib/auth');
      const me = auth.getAuth(req);
      if (!me) return res.status(401).json({ error: 'Unauthorized' });
      if (me.role !== 'owner') return res.status(403).json({ error: 'Owner only' });

      const { id, status } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await sb().from('contact_messages').update({ status: status || 'read' }).eq('id', id);
      if (error) throw error;
      return res.json({ ok: true });
    }

    // POST: new contact submission (public)
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { name, email, phone, subject, inquiry, message } = req.body || {};
    if (!name || !email || !message) return res.status(400).json({ error: 'Name, email, and message are required' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });

    // the site form posts the topic as `inquiry`; older callers send `subject`
    const topic = subject || inquiry || 'General';

    // 1. Save to database using new schema
    const { error: dbErr } = await sb().from('contact_messages').insert({
      name: String(name).slice(0, 200),
      email: String(email).slice(0, 200),
      phone: phone ? String(phone).slice(0, 20) : null,
      subject: String(topic).slice(0, 200),
      message: String(message).slice(0, 5000),
      status: 'new',
    });
    if (dbErr) throw dbErr;

    // 2. Send WhatsApp via CallMeBot
    const waKey = process.env.CALLMEBOT_API_KEY;
    const waPhone = process.env.CALLMEBOT_PHONE || '923390344180';
    if (waKey) {
      const waMsg = encodeURIComponent(
        `🎬 *New Contact — Cinegma Films*\n\n` +
        `*Name:* ${name}\n` +
        `*Email:* ${email}\n` +
        `*Type:* ${topic}\n\n` +
        `*Message:*\n${String(message).slice(0, 1000)}`
      );
      try {
        await fetch(`https://api.callmebot.com/whatsapp.php?phone=${waPhone}&text=${waMsg}&apikey=${waKey}`);
      } catch (_) {}
    }

    // 3. Email is already handled client-side via EmailJS

    // 4. Log to audit
    try {
      const { logEvent } = require('../lib/audit');
      await logEvent(req, {
        action: 'contact_received', category: 'contact',
        username: String(name).slice(0, 80), role: 'visitor',
        details: { email, inquiry: topic }
      });
    } catch (_) {}

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
