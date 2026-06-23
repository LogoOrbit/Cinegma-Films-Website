const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');
const auth = require('../lib/auth');

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { filename, dataUrl, caption } = req.body || {};
    if (!auth.getAuth(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!dataUrl || !filename) return res.status(400).json({ error: 'Missing filename or data' });

    const raw = Buffer.from(String(dataUrl).replace(/^data:[^;]+;base64,/, ''), 'base64');
    const name = String(filename).replace(/[^A-Za-z0-9 _.-]/g, '').trim().slice(0, 80) || `upload-${Date.now()}`;
    const ts = Date.now();

    const avifBuf = await sharp(raw).rotate().resize({ width: 1600, withoutEnlargement: true }).avif({ quality: 55, effort: 4 }).toBuffer();
    const storagePath = `images/${ts}-${name}.avif`;

    const sb = getSupabase();
    const { error: uploadErr } = await sb.storage.from('media').upload(storagePath, avifBuf, {
      contentType: 'image/avif', cacheControl: '31536000', upsert: true
    });
    if (uploadErr) throw uploadErr;

    const { data: { publicUrl } } = sb.storage.from('media').getPublicUrl(storagePath);

    const { data: row, error: dbErr } = await sb.from('media').insert({
      url: publicUrl, name, type: 'image', size_bytes: avifBuf.length, caption: caption || null
    }).select().single();
    if (dbErr) throw dbErr;

    res.json({ ok: true, url: publicUrl, id: row.id, size: avifBuf.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
