// Drive media feed
// GET /api/drive-media -> { videos: [{ id, title }] }
//
// Lists videos in the shared Google Drive folder so new uploads appear on the
// homepage without a code change. Needs GOOGLE_DRIVE_API_KEY (a Google Cloud
// API key with the Drive API enabled) and the folder shared as
// "Anyone with the link – Viewer". DRIVE_FOLDER_ID overrides the default.
//
// Captions: set a file's Drive "Description", or give it a readable name
// (e.g. "Janjaal – BTS.mp4"). Auto-generated names fall back to a numbered label.

const DEFAULT_FOLDER = '1ZOx0QlltNyD2lTSoainqBafSMuYfRoaX';

// Already self-hosted on the site under assets/bts — don't list them twice.
const SELF_HOSTED = new Set([
  '11IQXni-g1D-2jbjIm6_OkagrQPNvopXD', '16E3x8fUEio4A_ofAQwv1pzNao6t_Birr',
  '19bkzlEpOvjnL-ggTGx0j6JgQqIZjGnJ_', '1q-QSM2wJhvvC8HSYoPkorMM60RySbzhb',
  '1DACoV4lEsD3k6tgaXBlK9_Q9GZ52Fca_', '1xQDyXI6tyQ0hu7kvJEqT1Abw7asy7Tt-',
  '1izy9mwNpKqptsOTyNocomGmCWC9vBkae', '1z3laK_n34ms9Q7t1luW2mdFGi-Uv9YQW',
  '1DOpDiPJ3jODCcXBs-nMno_sSSHBE-HB7', '1ti2DMOe7zgvUlffMv5CzoWV_5icDp41J'
]);

function titleFor(f) {
  if (f.description && f.description.trim()) return f.description.trim().slice(0, 80);
  const base = (f.name || '').replace(/\.[a-z0-9]+$/i, '');
  // Instagram/WhatsApp exports have long random names — not worth showing
  if (!base || base.length > 48 || /^AQ[\w-]{20,}$/.test(base) || /^\d[\d_]+n?$/.test(base)) return '';
  return base.replace(/[_]+/g, ' ').slice(0, 80);
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const key = process.env.GOOGLE_DRIVE_API_KEY;
  if (!key) {
    res.setHeader('Cache-Control', 'public, s-maxage=300');
    return res.status(503).json({ error: 'Drive feed not configured' });
  }
  const folder = process.env.DRIVE_FOLDER_ID || DEFAULT_FOLDER;
  const q = `'${folder}' in parents and mimeType contains 'video/' and trashed = false`;
  const url = 'https://www.googleapis.com/drive/v3/files?' + new URLSearchParams({
    q, key, pageSize: '100', orderBy: 'createdTime desc',
    fields: 'files(id,name,description,createdTime)'
  });
  try {
    const r = await fetch(url);
    if (!r.ok) {
      res.setHeader('Cache-Control', 'public, s-maxage=120');
      return res.status(502).json({ error: 'Drive request failed' });
    }
    const data = await r.json();
    const videos = (data.files || [])
      .filter(f => !SELF_HOSTED.has(f.id))
      .map(f => ({ id: f.id, title: titleFor(f) }));
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
    return res.status(200).json({ videos });
  } catch (e) {
    return res.status(500).json({ error: 'Drive feed error' });
  }
};
