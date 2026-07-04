// Messages/Contact API
// GET /api/messages?status=new                                  -> { messages: [...] }
// GET /api/messages/:id                                         -> { message }
// PATCH /api/messages/:id { status, replied_at }                -> { message }
// DELETE /api/messages/:id                                      -> { ok }

const { createClient } = require('@supabase/supabase-js');
const auth = require('../lib/auth');
const { logEvent } = require('../lib/audit');

function sb() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

const ALLOWED_ORIGIN = process.env.SITE_URL || 'https://cinegmafilms.com';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Session-Token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const me = auth.getAuth(req);
    if (!me) return res.status(401).json({ error: 'Unauthorized' });

    // ---- LIST MESSAGES ----
    if (req.method === 'GET') {
      let query = sb().from('contact_messages').select('*');

      if (req.query?.status) query = query.eq('status', req.query.status);
      if (req.query?.search) {
        query = query.or(`name.ilike.%${req.query.search}%,email.ilike.%${req.query.search}%,message.ilike.%${req.query.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      return res.json({ messages: data || [] });
    }

    // Get single message
    const messageId = req.url?.split('/').pop();
    if (req.method === 'GET' && messageId && messageId !== 'messages') {
      const { data, error } = await sb()
        .from('contact_messages')
        .select('*')
        .eq('id', messageId)
        .single();
      if (error) return res.status(404).json({ error: 'Message not found' });
      return res.json({ message: data });
    }

    // ---- UPDATE MESSAGE STATUS ----
    if (req.method === 'PATCH' && messageId && messageId !== 'messages') {
      const { status, replied_at } = req.body || {};

      const updateData = {};
      if (status) updateData.status = status;
      if (replied_at) updateData.replied_at = replied_at;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const { data, error } = await sb()
        .from('contact_messages')
        .update(updateData)
        .eq('id', messageId)
        .select('*')
        .single();
      if (error) throw error;

      await logEvent(req, { action: 'message_updated', category: 'messages', entity_id: messageId, username: me.username });
      return res.json({ message: data });
    }

    // ---- DELETE MESSAGE ----
    if (req.method === 'DELETE' && messageId && messageId !== 'messages') {
      const { error } = await sb().from('contact_messages').delete().eq('id', messageId);
      if (error) throw error;

      await logEvent(req, { action: 'message_deleted', category: 'messages', entity_id: messageId, username: me.username });
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: 'Invalid request' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
