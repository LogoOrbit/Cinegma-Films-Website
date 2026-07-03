// Films CMS API
// POST { action: 'create', film: {...} }        -> { film }
// GET /api/films?status=draft&featured=true    -> { films: [...], total }
// GET /api/films/:id                           -> { film, versions, credits }
// PATCH /api/films/:id { film: {...} }         -> { film }
// DELETE /api/films/:id                        -> { ok }
// POST /api/films/:id/publish { version_id }   -> { film }
// POST /api/films/:id/version { type, ... }    -> { version }

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
    // Require authentication
    const me = auth.getAuth(req);
    if (!me) return res.status(401).json({ error: 'Unauthorized' });

    const { action, film, version_id } = req.body || {};

    // ---- CREATE FILM ----
    if (req.method === 'POST' && action === 'create') {
      if (!film || !film.title || !film.slug) {
        return res.status(400).json({ error: 'title and slug are required' });
      }

      const filmData = {
        title: film.title,
        slug: film.slug,
        description: film.description || null,
        plot: film.plot || null,
        genre: film.genre || [],
        runtime: film.runtime || null,
        release_date: film.release_date || null,
        status: 'draft',
        visibility: film.visibility || 'public',
        featured: film.featured || false,
        director_id: film.director_id || null,
        creator_id: me.id,
      };

      const { data, error } = await sb().from('films').insert([filmData]).select('*').single();
      if (error) {
        if (error.message.includes('duplicate')) return res.status(409).json({ error: 'Slug already exists' });
        throw error;
      }

      await logEvent(req, { action: 'film_created', category: 'films', entity_id: data.id, username: me.username });
      return res.json({ film: data });
    }

    // ---- LIST FILMS ----
    if (req.method === 'GET') {
      let query = sb().from('films').select('*,director:director_id(id,name)');

      if (req.query?.status) query = query.eq('status', req.query.status);
      if (req.query?.featured === 'true') query = query.eq('featured', true);
      if (req.query?.search) {
        query = query.or(`title.ilike.%${req.query.search}%,description.ilike.%${req.query.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(100);
      if (error) throw error;

      return res.json({ films: data || [], total: data?.length || 0 });
    }

    // Get single film
    const filmId = req.url?.split('/').pop();
    if (req.method === 'GET' && filmId && filmId !== 'films') {
      const { data: film, error: filmError } = await sb()
        .from('films')
        .select('*,director:director_id(id,name)')
        .eq('id', filmId)
        .single();
      if (filmError) return res.status(404).json({ error: 'Film not found' });

      const { data: versions } = await sb().from('film_versions').select('*').eq('film_id', filmId);
      const { data: credits } = await sb()
        .from('film_credits')
        .select('*,team_member:team_member_id(id,name,photo_url)')
        .eq('film_id', filmId)
        .order('order');

      return res.json({ film, versions: versions || [], credits: credits || [] });
    }

    // ---- UPDATE FILM ----
    if (req.method === 'PATCH' && filmId && filmId !== 'films') {
      if (!film) return res.status(400).json({ error: 'film object is required' });

      const updateData = {
        title: film.title,
        slug: film.slug,
        description: film.description,
        plot: film.plot,
        genre: film.genre,
        runtime: film.runtime,
        release_date: film.release_date,
        visibility: film.visibility,
        featured: film.featured,
        director_id: film.director_id,
        scheduled_publish_at: film.scheduled_publish_at,
        scheduled_unpublish_at: film.scheduled_unpublish_at,
      };

      const { data, error } = await sb().from('films').update(updateData).eq('id', filmId).select('*').single();
      if (error) throw error;

      await logEvent(req, { action: 'film_updated', category: 'films', entity_id: filmId, username: me.username });
      return res.json({ film: data });
    }

    // ---- DELETE FILM ----
    if (req.method === 'DELETE' && filmId && filmId !== 'films') {
      const { error } = await sb().from('films').delete().eq('id', filmId);
      if (error) throw error;

      await logEvent(req, { action: 'film_deleted', category: 'films', entity_id: filmId, username: me.username });
      return res.json({ ok: true });
    }

    // ---- PUBLISH FILM (with approval workflow) ----
    if (req.method === 'POST' && action === 'publish') {
      if (!filmId) return res.status(400).json({ error: 'filmId is required' });

      // Get current film
      const { data: film, error: filmError } = await sb().from('films').select('*').eq('id', filmId).single();
      if (filmError) throw filmError;

      // Create version snapshot
      const versionData = {
        entity_type: 'film',
        entity_id: filmId,
        version_number: 1,
        status: 'pending_review',
        content: film,
        changed_by: me.id,
      };

      const { data: version, error: versionError } = await sb()
        .from('content_versions')
        .insert([versionData])
        .select('*')
        .single();
      if (versionError) throw versionError;

      await logEvent(req, { action: 'film_submitted_for_review', category: 'films', entity_id: filmId, username: me.username });
      return res.json({ film, version });
    }

    // ---- CREATE FILM VERSION (teaser, trailer, etc) ----
    if (req.method === 'POST' && action === 'create_version') {
      if (!filmId || !version) return res.status(400).json({ error: 'filmId and version object required' });

      const versionData = {
        film_id: filmId,
        version_type: version.version_type,
        title: version.title || null,
        description: version.description || null,
        thumbnail_url: version.thumbnail_url || null,
        poster_url: version.poster_url || null,
        trailer_video_id: version.trailer_video_id || null,
        main_video_id: version.main_video_id || null,
        duration: version.duration || null,
        is_primary: version.is_primary || false,
      };

      const { data, error } = await sb().from('film_versions').insert([versionData]).select('*').single();
      if (error) throw error;

      await logEvent(req, { action: 'film_version_created', category: 'films', entity_id: filmId, username: me.username });
      return res.json({ version: data });
    }

    return res.status(400).json({ error: 'Invalid request' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
