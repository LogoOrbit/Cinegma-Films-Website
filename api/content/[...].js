// ════════════════════════════════════════════════════════════════
// Consolidated Content Management API
// Handles: films, team, services, gallery, awards
// This consolidates 5 separate endpoint files into 1
// ════════════════════════════════════════════════════════════════

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

    const pathParts = req.url?.split('/').filter(Boolean);
    const resource = pathParts?.[0]; // 'films', 'team', 'services', 'gallery', 'awards'
    const id = pathParts?.[1];
    const { action, film, member, service, item, award } = req.body || {};

    // ════════════════════ FILMS ════════════════════
    if (resource === 'films') {
      if (req.method === 'POST' && action === 'create') {
        const filmData = {
          title: film?.title,
          slug: film?.slug,
          description: film?.description || null,
          plot: film?.plot || null,
          genre: film?.genre || [],
          runtime: film?.runtime || null,
          release_date: film?.release_date || null,
          status: 'draft',
          visibility: film?.visibility || 'public',
          featured: film?.featured || false,
          director_id: film?.director_id || null,
          creator_id: me.id,
        };

        const { data, error } = await sb().from('films').insert([filmData]).select('*').single();
        if (error) throw error;
        await logEvent(req, { action: 'film_created', category: 'films', entity_id: data.id, username: me.username });
        return res.json({ film: data });
      }

      if (req.method === 'GET' && !id) {
        let query = sb().from('films').select('*,director:director_id(id,name)');
        if (req.query?.status) query = query.eq('status', req.query.status);
        if (req.query?.featured === 'true') query = query.eq('featured', true);
        if (req.query?.search) query = query.or(`title.ilike.%${req.query.search}%,description.ilike.%${req.query.search}%`);

        const { data, error } = await query.order('created_at', { ascending: false }).limit(100);
        if (error) throw error;
        return res.json({ films: data || [] });
      }

      if (req.method === 'GET' && id) {
        const { data: film, error: filmError } = await sb().from('films').select('*,director:director_id(id,name)').eq('id', id).single();
        if (filmError) return res.status(404).json({ error: 'Film not found' });

        const { data: versions } = await sb().from('film_versions').select('*').eq('film_id', id);
        const { data: credits } = await sb().from('film_credits').select('*,team_member:team_member_id(id,name,photo_url)').eq('film_id', id).order('order');

        return res.json({ film, versions: versions || [], credits: credits || [] });
      }

      if (req.method === 'PATCH' && id) {
        const { data, error } = await sb().from('films').update({
          title: film?.title,
          slug: film?.slug,
          description: film?.description,
          plot: film?.plot,
          genre: film?.genre,
          runtime: film?.runtime,
          release_date: film?.release_date,
          visibility: film?.visibility,
          featured: film?.featured,
          director_id: film?.director_id,
          scheduled_publish_at: film?.scheduled_publish_at,
          scheduled_unpublish_at: film?.scheduled_unpublish_at,
        }).eq('id', id).select('*').single();
        if (error) throw error;

        await logEvent(req, { action: 'film_updated', category: 'films', entity_id: id, username: me.username });
        return res.json({ film: data });
      }

      if (req.method === 'DELETE' && id) {
        const { error } = await sb().from('films').delete().eq('id', id);
        if (error) throw error;
        await logEvent(req, { action: 'film_deleted', category: 'films', entity_id: id, username: me.username });
        return res.json({ ok: true });
      }
    }

    // ════════════════════ TEAM ════════════════════
    if (resource === 'team') {
      if (req.method === 'POST' && action === 'create') {
        const memberData = {
          name: member?.name,
          slug: member?.slug,
          position: member?.position || null,
          bio: member?.bio || null,
          photo_url: member?.photo_url || null,
          social_links: member?.social_links || {},
          skills: member?.skills || [],
          experience: member?.experience || null,
          featured: member?.featured || false,
          display_order: member?.display_order || 0,
        };

        const { data, error } = await sb().from('team_members').insert([memberData]).select('*').single();
        if (error) throw error;

        await logEvent(req, { action: 'team_member_created', category: 'team', entity_id: data.id, username: me.username });
        return res.json({ member: data });
      }

      if (req.method === 'GET' && !id) {
        let query = sb().from('team_members').select('*');
        if (req.query?.featured === 'true') query = query.eq('featured', true);
        if (req.query?.search) query = query.ilike('name', `%${req.query.search}%`);

        const { data, error } = await query.order('display_order');
        if (error) throw error;
        return res.json({ members: data || [] });
      }

      if (req.method === 'GET' && id) {
        const { data: m, error: mError } = await sb().from('team_members').select('*').eq('id', id).single();
        if (mError) return res.status(404).json({ error: 'Team member not found' });

        const { data: appearances } = await sb().from('film_credits').select('film:film_id(id,title,slug,status),role,character_name').eq('team_member_id', id);
        return res.json({ member: m, appearances: appearances || [] });
      }

      if (req.method === 'PATCH' && id) {
        const { data, error } = await sb().from('team_members').update({
          name: member?.name,
          slug: member?.slug,
          position: member?.position,
          bio: member?.bio,
          photo_url: member?.photo_url,
          social_links: member?.social_links,
          skills: member?.skills,
          experience: member?.experience,
          featured: member?.featured,
          display_order: member?.display_order,
        }).eq('id', id).select('*').single();
        if (error) throw error;

        await logEvent(req, { action: 'team_member_updated', category: 'team', entity_id: id, username: me.username });
        return res.json({ member: data });
      }

      if (req.method === 'DELETE' && id) {
        const { error } = await sb().from('team_members').delete().eq('id', id);
        if (error) throw error;
        await logEvent(req, { action: 'team_member_deleted', category: 'team', entity_id: id, username: me.username });
        return res.json({ ok: true });
      }
    }

    // ════════════════════ SERVICES ════════════════════
    if (resource === 'services') {
      if (req.method === 'POST' && action === 'create') {
        const serviceData = {
          title: service?.title,
          slug: service?.slug,
          description: service?.description || null,
          icon_url: service?.icon_url || null,
          image_url: service?.image_url || null,
          pricing: service?.pricing || null,
          categories: service?.categories || [],
          display_order: service?.display_order || 0,
          featured: service?.featured || false,
          visible: service?.visible !== false,
        };

        const { data, error } = await sb().from('services').insert([serviceData]).select('*').single();
        if (error) throw error;

        await logEvent(req, { action: 'service_created', category: 'services', entity_id: data.id, username: me.username });
        return res.json({ service: data });
      }

      if (req.method === 'GET' && !id) {
        let query = sb().from('services').select('*');
        if (req.query?.visible !== 'false') query = query.eq('visible', true);
        if (req.query?.featured === 'true') query = query.eq('featured', true);
        if (req.query?.search) query = query.ilike('title', `%${req.query.search}%`);

        const { data, error } = await query.order('display_order');
        if (error) throw error;
        return res.json({ services: data || [] });
      }

      if (req.method === 'GET' && id) {
        const { data: svc, error: svcError } = await sb().from('services').select('*').eq('id', id).single();
        if (svcError) return res.status(404).json({ error: 'Service not found' });

        const { data: projects } = await sb().from('service_projects').select('id,film:film_id(id,title,slug,poster_url)').eq('service_id', id).order('order');
        return res.json({ service: svc, projects: projects || [] });
      }

      if (req.method === 'PATCH' && id) {
        const { data, error } = await sb().from('services').update({
          title: service?.title,
          slug: service?.slug,
          description: service?.description,
          icon_url: service?.icon_url,
          image_url: service?.image_url,
          pricing: service?.pricing,
          categories: service?.categories,
          display_order: service?.display_order,
          featured: service?.featured,
          visible: service?.visible,
        }).eq('id', id).select('*').single();
        if (error) throw error;

        await logEvent(req, { action: 'service_updated', category: 'services', entity_id: id, username: me.username });
        return res.json({ service: data });
      }

      if (req.method === 'DELETE' && id) {
        const { error } = await sb().from('services').delete().eq('id', id);
        if (error) throw error;
        await logEvent(req, { action: 'service_deleted', category: 'services', entity_id: id, username: me.username });
        return res.json({ ok: true });
      }
    }

    // ════════════════════ GALLERY ════════════════════
    if (resource === 'gallery') {
      if (req.method === 'POST' && action === 'create') {
        const itemData = {
          media_id: item?.media_id,
          title: item?.title || null,
          description: item?.description || null,
          category: item?.category || null,
          featured: item?.featured || false,
          display_order: item?.display_order || 0,
          related_film_id: item?.related_film_id || null,
        };

        const { data, error } = await sb().from('gallery_items').insert([itemData]).select('*').single();
        if (error) throw error;

        await logEvent(req, { action: 'gallery_item_created', category: 'gallery', entity_id: data.id });
        return res.json({ item: data });
      }

      if (req.method === 'GET' && !id) {
        let query = sb().from('gallery_items').select('*,media:media_id(url,width,height),film:related_film_id(title,slug)');
        if (req.query?.category) query = query.eq('category', req.query.category);
        if (req.query?.featured === 'true') query = query.eq('featured', true);

        const { data, error } = await query.order('display_order');
        if (error) throw error;
        return res.json({ items: data || [] });
      }

      if (req.method === 'GET' && id) {
        const { data, error } = await sb().from('gallery_items').select('*,media:media_id(url,width,height)').eq('id', id).single();
        if (error) return res.status(404).json({ error: 'Gallery item not found' });
        return res.json({ item: data });
      }

      if (req.method === 'PATCH' && id) {
        const { data, error } = await sb().from('gallery_items').update({
          title: item?.title,
          description: item?.description,
          category: item?.category,
          featured: item?.featured,
          display_order: item?.display_order,
          related_film_id: item?.related_film_id,
        }).eq('id', id).select('*').single();
        if (error) throw error;

        await logEvent(req, { action: 'gallery_item_updated', category: 'gallery' });
        return res.json({ item: data });
      }

      if (req.method === 'DELETE' && id) {
        const { error } = await sb().from('gallery_items').delete().eq('id', id);
        if (error) throw error;
        await logEvent(req, { action: 'gallery_item_deleted', category: 'gallery' });
        return res.json({ ok: true });
      }
    }

    // ════════════════════ AWARDS ════════════════════
    if (resource === 'awards') {
      if (req.method === 'POST' && action === 'create') {
        const awardData = {
          film_id: award?.film_id,
          award_name: award?.award_name,
          festival_name: award?.festival_name,
          award_category: award?.award_category || null,
          year: award?.year || new Date().getFullYear(),
          award_date: award?.award_date || null,
          award_type: award?.award_type || 'win',
          details: award?.details || null,
          url: award?.url || null,
        };

        const { data, error } = await sb().from('awards').insert([awardData]).select('*').single();
        if (error) throw error;

        await logEvent(req, { action: 'award_created', category: 'awards', entity_id: award?.film_id });
        return res.json({ award: data });
      }

      if (req.method === 'GET' && !id) {
        let query = sb().from('awards').select('*,film:film_id(title,slug)');
        if (req.query?.film_id) query = query.eq('film_id', req.query.film_id);
        if (req.query?.year) query = query.eq('year', parseInt(req.query.year));

        const { data, error } = await query.order('year', { ascending: false }).order('award_date', { ascending: false });
        if (error) throw error;
        return res.json({ awards: data || [] });
      }

      if (req.method === 'GET' && id) {
        const { data, error } = await sb().from('awards').select('*').eq('id', id).single();
        if (error) return res.status(404).json({ error: 'Award not found' });
        return res.json({ award: data });
      }

      if (req.method === 'PATCH' && id) {
        const { data, error } = await sb().from('awards').update({
          award_name: award?.award_name,
          festival_name: award?.festival_name,
          award_category: award?.award_category,
          year: award?.year,
          award_date: award?.award_date,
          award_type: award?.award_type,
          details: award?.details,
          url: award?.url,
        }).eq('id', id).select('*').single();
        if (error) throw error;

        await logEvent(req, { action: 'award_updated', category: 'awards' });
        return res.json({ award: data });
      }

      if (req.method === 'DELETE' && id) {
        const { error } = await sb().from('awards').delete().eq('id', id);
        if (error) throw error;
        await logEvent(req, { action: 'award_deleted', category: 'awards' });
        return res.json({ ok: true });
      }
    }

    return res.status(400).json({ error: 'Invalid request' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
