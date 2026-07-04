// Gallery API
// POST /api/gallery { action: 'create', item: {...} }           -> { item }
// GET /api/gallery?category=xxx&featured=true                   -> { items: [...] }
// GET /api/gallery/:id                                          -> { item }
// PATCH /api/gallery/:id { item: {...} }                        -> { item }
// DELETE /api/gallery/:id                                       -> { ok }

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

    const { action, item } = req.body || {};

    // ---- CREATE GALLERY ITEM ----
    if (req.method === 'POST' && action === 'create') {
      if (!item || !item.media_id) {
        return res.status(400).json({ error: 'media_id is required' });
      }

      const itemData = {
        media_id: item.media_id,
        title: item.title || null,
        description: item.description || null,
        category: item.category || null,
        featured: item.featured || false,
        display_order: item.display_order || 0,
        related_film_id: item.related_film_id || null,
      };

      const { data, error } = await sb().from('gallery_items').insert([itemData]).select('*').single();
      if (error) throw error;

      await logEvent(req, { action: 'gallery_item_created', category: 'gallery', entity_id: data.id });
      return res.json({ item: data });
    }

    // ---- LIST GALLERY ITEMS ----
    if (req.method === 'GET') {
      let query = sb()
        .from('gallery_items')
        .select('*,media:media_id(url,width,height),film:related_film_id(title,slug)');

      if (req.query?.category) query = query.eq('category', req.query.category);
      if (req.query?.featured === 'true') query = query.eq('featured', true);
      if (req.query?.search) query = query.ilike('title', `%${req.query.search}%`);

      const { data, error } = await query.order('display_order');
      if (error) throw error;

      return res.json({ items: data || [] });
    }

    // Get single item
    const itemId = req.url?.split('/').pop();
    if (req.method === 'GET' && itemId && itemId !== 'gallery') {
      const { data, error } = await sb()
        .from('gallery_items')
        .select('*,media:media_id(url,width,height)')
        .eq('id', itemId)
        .single();
      if (error) return res.status(404).json({ error: 'Gallery item not found' });
      return res.json({ item: data });
    }

    // ---- UPDATE GALLERY ITEM ----
    if (req.method === 'PATCH' && itemId && itemId !== 'gallery') {
      if (!item) return res.status(400).json({ error: 'item object is required' });

      const { data, error } = await sb()
        .from('gallery_items')
        .update({
          title: item.title,
          description: item.description,
          category: item.category,
          featured: item.featured,
          display_order: item.display_order,
          related_film_id: item.related_film_id,
        })
        .eq('id', itemId)
        .select('*')
        .single();
      if (error) throw error;

      await logEvent(req, { action: 'gallery_item_updated', category: 'gallery' });
      return res.json({ item: data });
    }

    // ---- DELETE GALLERY ITEM ----
    if (req.method === 'DELETE' && itemId && itemId !== 'gallery') {
      const { error } = await sb().from('gallery_items').delete().eq('id', itemId);
      if (error) throw error;

      await logEvent(req, { action: 'gallery_item_deleted', category: 'gallery' });
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: 'Invalid request' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
