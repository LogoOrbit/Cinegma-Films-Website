const { createClient } = require('@supabase/supabase-js');
const auth = require('../lib/auth');

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const me = auth.getAuth(req);
    if (!me) return res.status(401).json({ error: 'Unauthorized' });

    const { filename, dataUrl, caption, mediaType } = req.body || {};
    if (!dataUrl || !filename) return res.status(400).json({ error: 'Missing filename or data' });

    const type = mediaType === 'audio' ? 'audio' : 'video';
    const raw = Buffer.from(String(dataUrl).replace(/^data:[^;]+;base64,/, ''), 'base64');
    const name = String(filename).replace(/[^A-Za-z0-9 _.-]/g, '').trim().slice(0, 80) || `upload-${Date.now()}`;
    const ts = Date.now();
    const ext = name.match(/\.([^.]+)$/)?.[1] || (type === 'audio' ? 'mp3' : 'mp4');
    const storagePath = `${type}s/${ts}-${name}`;

    const mimeMap = {
      mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', avi: 'video/x-msvideo',
      mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', aac: 'audio/aac', m4a: 'audio/mp4',
    };
    const contentType = mimeMap[ext.toLowerCase()] || (type === 'audio' ? 'audio/mpeg' : 'video/mp4');

    const sb = getSupabase();
    const { error: uploadErr } = await sb.storage.from('media').upload(storagePath, raw, {
      contentType, cacheControl: '31536000', upsert: true
    });
    if (uploadErr) throw uploadErr;

    const { data: { publicUrl } } = sb.storage.from('media').getPublicUrl(storagePath);

    const { data: row, error: dbErr } = await sb.from('media').insert({
      url: publicUrl, name, type, size_bytes: raw.length, caption: caption || null,
      author: me.username, author_role: me.role
    }).select().single();
    if (dbErr) throw dbErr;

    res.json({ ok: true, url: publicUrl, id: row.id, size: raw.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
