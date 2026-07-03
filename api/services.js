// Services CMS API
// POST { action: 'create', service: {...} }    -> { service }
// GET /api/services?visible=true               -> { services: [...] }
// GET /api/services/:id                        -> { service, projects }
// PATCH /api/services/:id { service: {...} }   -> { service }
// DELETE /api/services/:id                     -> { ok }

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

    const { action, service } = req.body || {};

    // ---- CREATE SERVICE ----
    if (req.method === 'POST' && action === 'create') {
      if (!service || !service.title || !service.slug) {
        return res.status(400).json({ error: 'title and slug are required' });
      }

      const serviceData = {
        title: service.title,
        slug: service.slug,
        description: service.description || null,
        icon_url: service.icon_url || null,
        image_url: service.image_url || null,
        pricing: service.pricing || null,
        categories: service.categories || [],
        display_order: service.display_order || 0,
        featured: service.featured || false,
        visible: service.visible !== false,
      };

      const { data, error } = await sb().from('services').insert([serviceData]).select('*').single();
      if (error) {
        if (error.message.includes('duplicate')) return res.status(409).json({ error: 'Slug already exists' });
        throw error;
      }

      await logEvent(req, { action: 'service_created', category: 'services', entity_id: data.id, username: me.username });
      return res.json({ service: data });
    }

    // ---- LIST SERVICES ----
    if (req.method === 'GET') {
      let query = sb().from('services').select('*');

      if (req.query?.visible !== 'false') query = query.eq('visible', true);
      if (req.query?.featured === 'true') query = query.eq('featured', true);
      if (req.query?.search) query = query.ilike('title', `%${req.query.search}%`);

      const { data, error } = await query.order('display_order');
      if (error) throw error;

      return res.json({ services: data || [] });
    }

    // Get single service with projects
    const serviceId = req.url?.split('/').pop();
    if (req.method === 'GET' && serviceId && serviceId !== 'services') {
      const { data: svc, error: svcError } = await sb()
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single();
      if (svcError) return res.status(404).json({ error: 'Service not found' });

      const { data: projects } = await sb()
        .from('service_projects')
        .select('id,film:film_id(id,title,slug,poster_url)')
        .eq('service_id', serviceId)
        .order('order');

      return res.json({ service: svc, projects: projects || [] });
    }

    // ---- UPDATE SERVICE ----
    if (req.method === 'PATCH' && serviceId && serviceId !== 'services') {
      if (!service) return res.status(400).json({ error: 'service object is required' });

      const updateData = {
        title: service.title,
        slug: service.slug,
        description: service.description,
        icon_url: service.icon_url,
        image_url: service.image_url,
        pricing: service.pricing,
        categories: service.categories,
        display_order: service.display_order,
        featured: service.featured,
        visible: service.visible,
      };

      const { data, error } = await sb().from('services').update(updateData).eq('id', serviceId).select('*').single();
      if (error) throw error;

      await logEvent(req, { action: 'service_updated', category: 'services', entity_id: serviceId, username: me.username });
      return res.json({ service: data });
    }

    // ---- DELETE SERVICE ----
    if (req.method === 'DELETE' && serviceId && serviceId !== 'services') {
      const { error } = await sb().from('services').delete().eq('id', serviceId);
      if (error) throw error;

      await logEvent(req, { action: 'service_deleted', category: 'services', entity_id: serviceId, username: me.username });
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: 'Invalid request' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
