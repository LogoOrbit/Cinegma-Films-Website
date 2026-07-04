// Public Data API — Used by website to fetch dynamic content
// No authentication required (reads only published content)

const { createClient } = require('@supabase/supabase-js');

function sb() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

const ALLOWED_ORIGIN = process.env.SITE_URL || 'https://cinegmafilms.com';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=300');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const type = req.url?.split('/').pop();

    // ---- PUBLISHED FILMS ----
    if (type === 'films') {
      const { data, error } = await sb()
        .from('films')
        .select('id,title,slug,description,plot,genre,runtime,release_date,featured,visibility,director:director_id(id,name,slug)')
        .eq('status', 'published')
        .eq('visibility', 'public')
        .order('featured', { ascending: false })
        .order('release_date', { ascending: false });

      if (error) throw error;
      return res.json({ films: data || [] });
    }

    // ---- SINGLE FILM WITH DETAILS ----
    if (type === 'film-detail') {
      const slug = req.query?.slug;
      if (!slug) return res.status(400).json({ error: 'slug required' });

      const { data: film, error: filmError } = await sb()
        .from('films')
        .select('*,director:director_id(id,name,slug)')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (filmError) return res.status(404).json({ error: 'Film not found' });

      const { data: versions } = await sb()
        .from('film_versions')
        .select('*,trailer_video:trailer_video_id(url),main_video:main_video_id(url)')
        .eq('film_id', film.id);

      const { data: credits } = await sb()
        .from('film_credits')
        .select('*,team_member:team_member_id(id,name,slug,photo_url)')
        .eq('film_id', film.id)
        .order('order');

      const { data: awards } = await sb()
        .from('awards')
        .select('*')
        .eq('film_id', film.id)
        .order('year', { ascending: false });

      return res.json({
        film,
        versions: versions || [],
        credits: credits || [],
        awards: awards || [],
      });
    }

    // ---- TEAM MEMBERS ----
    if (type === 'team') {
      const { data, error } = await sb()
        .from('team_members')
        .select('id,name,slug,position,bio,photo_url,social_links,skills,featured,display_order')
        .order('featured', { ascending: false })
        .order('display_order');

      if (error) throw error;
      return res.json({ team: data || [] });
    }

    // ---- SINGLE TEAM MEMBER ----
    if (type === 'team-member') {
      const slug = req.query?.slug;
      if (!slug) return res.status(400).json({ error: 'slug required' });

      const { data: member, error: memberError } = await sb()
        .from('team_members')
        .select('*')
        .eq('slug', slug)
        .single();

      if (memberError) return res.status(404).json({ error: 'Team member not found' });

      const { data: appearances } = await sb()
        .from('film_credits')
        .select('film:film_id(id,title,slug,featured),role,character_name')
        .eq('team_member_id', member.id);

      return res.json({ member, appearances: appearances || [] });
    }

    // ---- SERVICES ----
    if (type === 'services') {
      const { data, error } = await sb()
        .from('services')
        .select('id,title,slug,description,icon_url,image_url,pricing,categories,featured,display_order')
        .eq('visible', true)
        .order('featured', { ascending: false })
        .order('display_order');

      if (error) throw error;
      return res.json({ services: data || [] });
    }

    // ---- GALLERY ----
    if (type === 'gallery') {
      const { data, error } = await sb()
        .from('gallery_items')
        .select('id,title,description,category,featured,display_order,media:media_id(url,width,height),film:related_film_id(title,slug)')
        .order('featured', { ascending: false })
        .order('display_order');

      if (error) throw error;
      return res.json({ gallery: data || [] });
    }

    // ---- AWARDS (ALL) ----
    if (type === 'awards-all') {
      const { data, error } = await sb()
        .from('awards')
        .select('*,film:film_id(title,slug)')
        .order('year', { ascending: false })
        .order('award_date', { ascending: false });

      if (error) throw error;
      return res.json({ awards: data || [] });
    }

    // ---- TESTIMONIALS ----
    if (type === 'testimonials') {
      const { data, error } = await sb()
        .from('testimonials')
        .select('*')
        .order('featured', { ascending: false })
        .order('display_order');

      if (error) throw error;
      return res.json({ testimonials: data || [] });
    }

    // ---- PAGE SEO ----
    if (type === 'page-seo') {
      const slug = req.query?.slug;
      if (!slug) return res.status(400).json({ error: 'slug required' });

      const { data, error } = await sb()
        .from('pages')
        .select('*')
        .eq('page_slug', slug)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return res.json({ page: data || null });
    }

    // ---- FEATURED CONTENT (For homepage) ----
    if (type === 'featured') {
      const { data: films } = await sb()
        .from('films')
        .select('id,title,slug,description,featured')
        .eq('status', 'published')
        .eq('visibility', 'public')
        .eq('featured', true)
        .limit(6);

      const { data: team } = await sb()
        .from('team_members')
        .select('id,name,slug,photo_url,position')
        .eq('featured', true)
        .limit(8);

      const { data: services } = await sb()
        .from('services')
        .select('id,title,slug,description,featured')
        .eq('visible', true)
        .eq('featured', true)
        .limit(6);

      return res.json({
        featured_films: films || [],
        featured_team: team || [],
        featured_services: services || [],
      });
    }

    return res.status(400).json({ error: 'Unknown data type' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
