// Public Data API — Used by website to fetch dynamic content
// No authentication required (reads only published content)

const { createClient } = require('@supabase/supabase-js');

function sb() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

const ALLOWED_ORIGIN = process.env.SITE_URL || 'https://cinegmafilms.com';

// ---- Google Drive video feed (GET /api/public-data?view=drive-media) ----
// Needs the folder shared as "Anyone with the link – Viewer". GOOGLE_DRIVE_API_KEY is optional.
// Lives here because the Hobby plan allows at most 12 serverless functions.
const DEFAULT_FOLDER = '1ZOx0QlltNyD2lTSoainqBafSMuYfRoaX';

// Already self-hosted on the site under assets/bts — don't list them twice.
const SELF_HOSTED = new Set([
  '11IQXni-g1D-2jbjIm6_OkagrQPNvopXD', '16E3x8fUEio4A_ofAQwv1pzNao6t_Birr',
  '19bkzlEpOvjnL-ggTGx0j6JgQqIZjGnJ_', '1q-QSM2wJhvvC8HSYoPkorMM60RySbzhb',
  '1DACoV4lEsD3k6tgaXBlK9_Q9GZ52Fca_', '1xQDyXI6tyQ0hu7kvJEqT1Abw7asy7Tt-',
  '1izy9mwNpKqptsOTyNocomGmCWC9vBkae', '1z3laK_n34ms9Q7t1luW2mdFGi-Uv9YQW',
  '1DOpDiPJ3jODCcXBs-nMno_sSSHBE-HB7', '1ti2DMOe7zgvUlffMv5CzoWV_5icDp41J'
]);

// Titles for files already in the folder (Drive names are auto-generated); listed first, in this order.
const KNOWN = {
  "1FQPYXDbrwMByM87st6NEkHFNSnJMSPPM": "The Making of Janjaal",
  "17oE2fQhOryinOzDd5sZfuXRXM4vGz3Mf": "Chupke Chupke \u00b7 Short Film",
  "1IffHNUYj2t7wkd_fITrCGY7YSXu8K5bA": "Portrait of Life \u00b7 Making Of",
  "1vfW3cwRmLQgudenwWMIfyIxgtnPIzyzS": "Payam e Dil \u00b7 Trailer",
  "1nblCoag2Ow896e4gZsG6rNUit8Wp4z3s": "Thriller Teaser \u00b7 Syed Asad",
  "18ICbdqiKClr5_9_LsECk9_pkoB5SoIYv": "Sound Design \u00b7 No Country for Old Men"
};
const ORDER = Object.keys(KNOWN);

function titleFor(f) {
  if (KNOWN[f.id]) return KNOWN[f.id];
  if (f.description && f.description.trim()) return f.description.trim().slice(0, 80);
  const base = (f.name || '').replace(/\.[a-z0-9]+$/i, '');
  // Instagram/WhatsApp exports have long random names — not worth showing
  if (!base || base.length > 48 || /^AQ[\w-]{20,}$/.test(base) || /^\d[\d_]+n?$/.test(base)) return '';
  return base.replace(/[_]+/g, ' ').slice(0, 80);
}

// Without an API key, read the public folder's embedded listing page instead.
// Works once the folder is shared as "Anyone with the link – Viewer".
const VIDEO_EXT = /\.(mp4|mov|m4v|webm|mkv|avi)$/i;
function decodeEntities(t) {
  return t.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
async function listPublicFolder(folder) {
  const r = await fetch('https://drive.google.com/embeddedfolderview?id=' + encodeURIComponent(folder), {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CinegmaSite/1.0)' }
  });
  if (!r.ok) throw new Error('folder ' + r.status);
  const html = await r.text();
  const files = [];
  const re = /id="entry-([\w-]{20,})"[\s\S]*?class="flip-entry-title"[^>]*>([^<]*)</g;
  let m;
  while ((m = re.exec(html))) files.push({ id: m[1], name: decodeEntities(m[2].trim()) });
  return files;
}
async function listWithKey(folder, key) {
  const q = `'${folder}' in parents and mimeType contains 'video/' and trashed = false`;
  const r = await fetch('https://www.googleapis.com/drive/v3/files?' + new URLSearchParams({
    q, key, pageSize: '100', orderBy: 'createdTime desc', fields: 'files(id,name,description,mimeType)'
  }));
  if (!r.ok) throw new Error('api ' + r.status);
  return ((await r.json()).files || []);
}

// ---- Bunny Stream mirror ----
// Google blocks other sites from streaming Drive files, so each Drive video is
// copied to the Bunny Stream library: Bunny pulls it from Drive server-side
// (videos/fetch). The Bunny title carries the Drive id — "Title [drive:ID]" —
// so a file is only ever requested once. Until Bunny finishes encoding, the
// site falls back to Google's player.
const DRIVE_TAG = /\[drive:([\w-]{20,})\]/;
async function bunnyLibrary() {
  const lib = process.env.BUNNY_STREAM_LIBRARY_ID, key = process.env.BUNNY_STREAM_API_KEY;
  if (!lib || !key) return null;
  const r = await fetch(`https://video.bunnycdn.com/library/${lib}/videos?page=1&itemsPerPage=1000&orderBy=date`, {
    headers: { AccessKey: key, Accept: 'application/json' }
  });
  if (!r.ok) throw new Error('bunny list ' + r.status);
  const items = (await r.json()).items || [];
  const byDrive = {}, copies = {};
  for (const v of items) {
    const m = DRIVE_TAG.exec(v.title || '');
    if (!m) continue;
    copies[m[1]] = (copies[m[1]] || 0) + 1;
    const prev = byDrive[m[1]];
    /* status 4 = finished encoding; prefer a finished copy if there are several */
    if (!prev || (v.status === 4 && prev.status !== 4)) byDrive[m[1]] = v;
  }
  return { lib, key, byDrive, copies };
}
async function bunnyFetch(bunny, id, title) {
  const r = await fetch(`https://video.bunnycdn.com/library/${bunny.lib}/videos/fetch`, {
    method: 'POST',
    headers: { AccessKey: bunny.key, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      url: `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=t`,
      title: `${title || 'Cinegma Films'} [drive:${id}]`
    })
  });
  return r.ok;
}

async function driveMedia(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const folder = process.env.DRIVE_FOLDER_ID || DEFAULT_FOLDER;
  const key = process.env.GOOGLE_DRIVE_API_KEY;
  try {
    const files = key ? await listWithKey(folder, key)
                      : (await listPublicFolder(folder)).filter(f => VIDEO_EXT.test(f.name));
    const videos = files
      .filter(f => !SELF_HOSTED.has(f.id))
      .map(f => ({ id: f.id, title: titleFor(f) }))
      // new uploads first, then the curated pieces in their set order
      .sort((a, b) => (ORDER.indexOf(a.id) + 1 || -1) - (ORDER.indexOf(b.id) + 1 || -1));

    let bunny = null, pending = false;
    try { bunny = await bunnyLibrary(); } catch (e) { bunny = null; }
    if (bunny) {
      let requested = 0;
      for (const v of videos) {
        const b = bunny.byDrive[v.id];
        if (b && b.status === 4) { v.bunny = b.guid; continue; }
        if (b && b.status !== 5 && b.status !== 6) { pending = true; continue; } // still encoding
        // not mirrored yet, or one failed attempt: ask Bunny to pull it (never more than 2 copies)
        if ((bunny.copies[v.id] || 0) >= 2) continue;
        if (requested < 3 && await bunnyFetch(bunny, v.id, v.title || 'Cinegma Films')) { requested++; pending = true; }
      }
    }
    /* refresh sooner while Bunny is still encoding new videos */
    res.setHeader('Cache-Control', pending ? 'public, s-maxage=120' : 'public, s-maxage=21600, stale-while-revalidate=86400');
    return res.status(200).json({ videos, lib: bunny ? bunny.lib : null });
  } catch (e) {
    res.setHeader('Cache-Control', 'public, s-maxage=120');
    return res.status(502).json({ error: 'Drive feed unavailable' });
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=300');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.query?.view === 'drive-media') return driveMedia(req, res);

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
