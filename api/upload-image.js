// Vercel serverless function: optimize an uploaded image and commit it to the
// repo (assets/posters/) as AVIF (full + 400w) + WebP, matching the site's
// existing naming convention. Vercel redeploys automatically on the commit.
//
// Required env vars:
//   DASHBOARD_PASSWORD  - shared secret the dashboard sends with each request
//   GITHUB_TOKEN        - PAT (or fine-grained token) with contents:write on the repo
//   GITHUB_REPO         - e.g. "logoorbit/cinegma-films-website"
//   GITHUB_BRANCH       - branch to commit to (e.g. "main")

const sharp = require('sharp');

const TARGET_DIR = 'assets/posters';

function sanitizeBaseName(name) {
  // Drop any path and extension, keep letters/numbers/space/_/- only.
  const noPath = String(name).split(/[\\/]/).pop();
  const noExt = noPath.replace(/\.[^.]+$/, '');
  return noExt.replace(/[^A-Za-z0-9 _-]/g, '').trim().slice(0, 80) || `upload-${Date.now()}`;
}

async function githubRequest(path, options = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'cinegma-admin-dashboard',
      ...(options.headers || {}),
    },
  });
  return res;
}

async function commitFile(repo, branch, path, contentBase64, message) {
  // Look up an existing file's sha so we can update instead of erroring.
  let sha;
  const existing = await githubRequest(
    `/repos/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}?ref=${branch}`
  );
  if (existing.status === 200) {
    sha = (await existing.json()).sha;
  }

  const put = await githubRequest(
    `/repos/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`,
    {
      method: 'PUT',
      body: JSON.stringify({ message, content: contentBase64, branch, sha }),
    }
  );
  if (!put.ok) {
    throw new Error(`GitHub commit failed for ${path}: ${put.status} ${await put.text()}`);
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { password, filename, dataUrl } = req.body || {};

    if (!process.env.DASHBOARD_PASSWORD || password !== process.env.DASHBOARD_PASSWORD) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (!dataUrl || !filename) {
      res.status(400).json({ error: 'Missing filename or image data' });
      return;
    }

    const base = sanitizeBaseName(filename);
    const raw = Buffer.from(String(dataUrl).replace(/^data:[^;]+;base64,/, ''), 'base64');

    const meta = await sharp(raw).metadata();
    const hasAlpha = !!meta.hasAlpha;

    // Full-resolution AVIF + WebP, plus a 400px-wide AVIF for srcset.
    const avifFull = await sharp(raw).rotate().avif({ quality: 55, effort: 4 }).toBuffer();
    const webpFull = await sharp(raw).rotate().webp({ quality: 80 }).toBuffer();
    const avif400 = await sharp(raw)
      .rotate()
      .resize({ width: 400, withoutEnlargement: true })
      .avif({ quality: 55, effort: 4 })
      .toBuffer();

    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';
    const msg = `chore(media): add optimized "${base}" via dashboard`;

    const files = [
      { path: `${TARGET_DIR}/${base}.avif`, buf: avifFull },
      { path: `${TARGET_DIR}/${base}-400w.avif`, buf: avif400 },
      { path: `${TARGET_DIR}/${base}.webp`, buf: webpFull },
    ];

    for (const f of files) {
      await commitFile(repo, branch, f.path, f.buf.toString('base64'), msg);
    }

    res.status(200).json({
      ok: true,
      hasAlpha,
      sizes: {
        avif: avifFull.length,
        webp: webpFull.length,
        avif400: avif400.length,
      },
      paths: files.map((f) => `/${f.path}`),
      base,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
};
