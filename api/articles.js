const { createClient } = require('@supabase/supabase-js');
const auth = require('../lib/auth');

function getSupabase(serviceRole) {
  const url = process.env.SUPABASE_URL;
  const key = serviceRole ? process.env.SUPABASE_SERVICE_KEY : process.env.SUPABASE_ANON_KEY;
  return createClient(url, key);
}

function checkAuth(req) {
  return auth.getAuth(req) !== null;
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Dashboard-Password');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const { id, slug, drafts } = req.query || {};
      const sb = getSupabase(!!drafts);

      if (id) {
        if (drafts && !checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
        const { data, error } = await sb.from('articles').select('*').eq('id', id).single();
        if (error) throw error;
        return res.json(data);
      }
      if (slug) {
        const { data, error } = await sb.from('articles').select('*').eq('slug', slug).eq('published', true).single();
        if (error) throw error;
        return res.json(data);
      }

      if (drafts) {
        if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
        const { data, error } = await sb.from('articles').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return res.json(data);
      }

      const { data, error } = await sb.from('articles').select('*').eq('published', true).order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data);
    }

    if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
    const sb = getSupabase(true);

    if (req.method === 'POST') {
      const { title, body, cover_image_url, category, published } = req.body;
      if (!title) return res.status(400).json({ error: 'Title is required' });
      const slug = slugify(title) || `post-${Date.now()}`;
      const { data, error } = await sb.from('articles').insert({
        title, slug, body: body || '', cover_image_url: cover_image_url || null,
        category: category || 'news', published: !!published
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, ...fields } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });
      if (fields.title && !fields.slug) fields.slug = slugify(fields.title);
      const { data, error } = await sb.from('articles').update(fields).eq('id', id).select().single();
      if (error) throw error;
      return res.json(data);
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id || req.body?.id;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { error } = await sb.from('articles').delete().eq('id', id);
      if (error) throw error;
      return res.json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
