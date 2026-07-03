// Pages & SEO Management API
// GET /api/pages/:slug                         -> { page }
// PATCH /api/pages/:slug { page: {...} }       -> { page }

const { createClient } = require('@supabase/supabase-js');
const auth = require('../lib/auth');
const { logEvent } = require('../lib/audit');

function sb() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

const ALLOWED_ORIGIN = process.env.SITE_URL || 'https://cinegmafilms.com';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Session-Token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const slug = req.url?.split('/').pop();
    if (!slug) return res.status(400).json({ error: 'slug required' });

    // ---- GET PAGE SEO ----
    if (req.method === 'GET') {
      const { data, error } = await sb()
        .from('pages')
        .select('*')
        .eq('page_slug', slug)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        // Create default page
        const newPage = {
          page_slug: slug,
          seo_title: '',
          seo_description: '',
          keywords: [],
          include_in_sitemap: true,
        };
        const { data: created, error: createError } = await sb()
          .from('pages')
          .insert([newPage])
          .select('*')
          .single();
        if (createError) throw createError;
        return res.json({ page: created });
      }

      return res.json({ page: data });
    }

    // ---- UPDATE PAGE SEO ----
    if (req.method === 'PATCH') {
      const me = auth.getAuth(req);
      if (!me) return res.status(401).json({ error: 'Unauthorized' });

      const { page } = req.body || {};
      if (!page) return res.status(400).json({ error: 'page object is required' });

      // Upsert (create if doesn't exist)
      const updateData = {
        page_slug: slug,
        seo_title: page.seo_title,
        seo_description: page.seo_description,
        keywords: page.keywords,
        og_image_url: page.og_image_url,
        og_type: page.og_type,
        canonical_url: page.canonical_url,
        include_in_sitemap: page.include_in_sitemap,
        structured_data: page.structured_data,
      };

      const { data, error } = await sb()
        .from('pages')
        .upsert(updateData, { onConflict: 'page_slug' })
        .select('*')
        .single();
      if (error) throw error;

      await logEvent(req, { action: 'page_seo_updated', category: 'pages', details: { slug } });
      return res.json({ page: data });
    }

    return res.status(400).json({ error: 'Invalid request' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
