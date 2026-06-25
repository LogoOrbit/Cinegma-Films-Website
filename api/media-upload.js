const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');
const auth = require('../lib/auth');
const { logEvent } = require('../lib/audit');

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

function slugify(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 110);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { filename, dataUrl, caption, title } = req.body || {};
    const me = auth.getAuth(req);
    if (!me) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!dataUrl || !filename) return res.status(400).json({ error: 'Missing filename or data' });
    const postTitle = String(title || '').trim();
    if (!postTitle) return res.status(400).json({ error: 'A post title is required' });

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
      url: publicUrl, name, type: 'image', size_bytes: avifBuf.length, caption: caption || null,
      author: me.username, author_role: me.role
    }).select().single();
    if (dbErr) throw dbErr;

    // Every upload also becomes a draft blog post (title + author), ready for
    // review and publishing from the Articles page.
    const slug = `${slugify(postTitle) || 'post'}-${ts.toString(36)}`;
    const { data: article, error: artErr } = await sb.from('articles').insert({
      title: postTitle, slug, body: caption || '', cover_image_url: publicUrl,
      category: 'blog', published: false, author: me.username, author_role: me.role
    }).select('id').single();
    if (artErr) throw artErr;

    await logEvent(req, { action: 'image_uploaded', category: 'media', username: me.username, role: me.role, details: { filename: name, size_bytes: avifBuf.length, url: publicUrl, article_id: article.id } });
    res.json({ ok: true, url: publicUrl, id: row.id, size: avifBuf.length, articleId: article.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
