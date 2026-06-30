// Commits a dashboard video/audio upload into the GitHub repo, then lets a
// GitHub Action optimize it with ffmpeg and publish the final file.
//
// Vercel serverless functions cap the request body at ~4.5 MB, so the browser
// streams the file here in small chunks. Each chunk is committed as a part file
// on a dedicated staging branch; a final "finalize" call writes a manifest that
// triggers .github/workflows/optimize-media.yml. The Action assembles the
// parts, runs ffmpeg, and commits the optimized result to the production branch.
//
// Reuses the same env vars already configured for image commits:
//   GITHUB_TOKEN    – PAT with "Contents: Read and write" on this repo (required)
//   GITHUB_REPO     – "owner/repo"      (required)
//   GITHUB_BRANCH   – production branch (optional, default "main")
//   GITHUB_STAGING_BRANCH – staging branch (optional, default "media-staging")

const auth = require('../lib/auth');
const { logEvent } = require('../lib/audit');

const GH_API = 'https://api.github.com';
const MAX_TOTAL = 25 * 1024 * 1024;          // 25 MB hard cap
const MAX_CHUNK = 5 * 1024 * 1024;           // safety margin under Vercel's body limit

const repo = () => process.env.GITHUB_REPO || 'LogoOrbit/Cinegma-Films-Website';
const prodBranch = () => process.env.GITHUB_BRANCH || 'main';
const stagingBranch = () => process.env.GITHUB_STAGING_BRANCH || 'media-staging';
const ghToken = () => process.env.GITHUB_TOKEN;

async function gh(path, opts = {}) {
  const r = await fetch(GH_API + path, Object.assign({}, opts, {
    headers: Object.assign({
      Authorization: 'Bearer ' + ghToken(),
      Accept: 'application/vnd.github+json',
      'User-Agent': 'cinegma-dashboard',
      'X-GitHub-Api-Version': '2022-11-28',
    }, opts.headers || {}),
  }));
  const text = await r.text();
  let body;
  try { body = text ? JSON.parse(text) : {}; } catch (_) { body = { raw: text }; }
  if (!r.ok) {
    const e = new Error(body.message || ('GitHub API error ' + r.status));
    e.status = r.status;
    throw e;
  }
  return body;
}

function ghPath(p) {
  return p.split('/').map(encodeURIComponent).join('/');
}

// Create the staging branch off the production head if it doesn't exist yet.
async function ensureStagingBranch() {
  try {
    await gh(`/repos/${repo()}/git/ref/heads/${stagingBranch()}`);
    return;
  } catch (e) {
    if (e.status !== 404) throw e;
  }
  const base = await gh(`/repos/${repo()}/git/ref/heads/${prodBranch()}`);
  await gh(`/repos/${repo()}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${stagingBranch()}`, sha: base.object.sha }),
  });
}

// `contentB64` is already base64 of the raw file bytes.
async function putFile(path, contentB64, message) {
  await gh(`/repos/${repo()}/contents/${ghPath(path)}`, {
    method: 'PUT',
    body: JSON.stringify({ message, content: contentB64, branch: stagingBranch() }),
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const me = auth.getAuth(req);
    if (!me) return res.status(401).json({ error: 'Unauthorized' });
    if (!ghToken()) return res.status(500).json({ error: 'Server is not configured for repo uploads (missing GITHUB_TOKEN).' });

    const { uploadId, index, total, chunk, finalize,
            filename, name, caption, mediaType, fileSize } = req.body || {};

    if (!uploadId || !/^[a-z0-9][a-z0-9-]{0,99}$/.test(String(uploadId))) {
      return res.status(400).json({ error: 'Invalid uploadId' });
    }
    if (typeof fileSize === 'number' && fileSize > MAX_TOTAL) {
      return res.status(413).json({ error: 'File exceeds the 25 MB limit.' });
    }

    const type = mediaType === 'audio' ? 'audio' : 'video';
    const dir = type === 'audio' ? 'assets/audio' : 'assets/videos';
    const ext = type === 'audio' ? 'mp3' : 'mp4';
    const finalPath = `${dir}/${uploadId}.${ext}`;
    const stageDir = `assets/videos/_staging/${uploadId}`;

    await ensureStagingBranch();

    // ---- Finalize: write the manifest that triggers the optimization Action.
    if (finalize) {
      const manifest = {
        uploadId,
        filename: String(filename || uploadId).slice(0, 120),
        name: String(name || uploadId).slice(0, 200),
        caption: caption ? String(caption).slice(0, 500) : null,
        mediaType: type,
        total: Number(total) || 0,
        fileSize: Number(fileSize) || 0,
        finalPath,
        uploadedBy: me.username,
        role: me.role,
        uploadedAt: new Date().toISOString(),
      };
      const b64 = Buffer.from(JSON.stringify(manifest, null, 2)).toString('base64');
      await putFile(`${stageDir}/manifest.json`, b64, `media: finalize ${uploadId}`);

      await logEvent(req, {
        action: type + '_uploaded', category: 'media', username: me.username, role: me.role,
        details: { filename: manifest.name, size_bytes: manifest.fileSize, url: '/' + finalPath, media_type: type },
      });
      return res.json({ ok: true, processing: true, path: '/' + finalPath });
    }

    // ---- Chunk: commit one part file to the staging branch.
    if (typeof chunk !== 'string' || !chunk) return res.status(400).json({ error: 'Missing chunk data' });
    const idx = Number(index);
    if (!Number.isInteger(idx) || idx < 0 || idx > 999) return res.status(400).json({ error: 'Invalid chunk index' });
    if (Math.floor(chunk.length * 3 / 4) > MAX_CHUNK) return res.status(413).json({ error: 'Chunk too large' });

    const part = `part-${String(idx).padStart(3, '0')}`;
    await putFile(`${stageDir}/${part}`, chunk, `media: ${uploadId} ${part}`);
    return res.json({ ok: true, index: idx });
  } catch (err) {
    const status = err.status && err.status >= 400 && err.status < 500 ? err.status : 500;
    res.status(status).json({ error: err.message });
  }
};
