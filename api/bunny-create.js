// Vercel serverless function: create a Bunny Stream video object and return a
// short-lived signature so the browser can upload the (large) video file
// DIRECTLY to Bunny via the TUS protocol. This avoids Vercel's 4.5MB request
// body limit and Bunny then auto-transcodes the upload.
//
// Required env vars:
//   DASHBOARD_PASSWORD       - shared secret the dashboard sends with each request
//   BUNNY_STREAM_API_KEY     - Stream library API key (Bunny dashboard > Stream > API)
//   BUNNY_STREAM_LIBRARY_ID  - numeric Stream library id
// Optional:
//   BUNNY_STREAM_CDN_HOSTNAME - Stream pull-zone hostname (e.g. "vz-xxxx.b-cdn.net")
//                               used to build playable URLs in the response

const crypto = require('crypto');
const auth = require('../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { title } = req.body || {};

    if (!auth.getAuth(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
    const apiKey = process.env.BUNNY_STREAM_API_KEY;
    if (!libraryId || !apiKey) {
      res.status(500).json({ error: 'Bunny Stream is not configured' });
      return;
    }

    // 1. Create the video object in Bunny Stream.
    const createRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
      method: 'POST',
      headers: {
        AccessKey: apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ title: title || `upload-${Date.now()}` }),
    });
    if (!createRes.ok) {
      throw new Error(`Bunny create failed: ${createRes.status} ${await createRes.text()}`);
    }
    const video = await createRes.json();
    const videoId = video.guid;

    // 2. Build the TUS upload signature: sha256(libraryId + apiKey + expire + videoId).
    const expire = Math.floor(Date.now() / 1000) + 3600; // valid 1 hour
    const signature = crypto
      .createHash('sha256')
      .update(`${libraryId}${apiKey}${expire}${videoId}`)
      .digest('hex');

    const cdn = process.env.BUNNY_STREAM_CDN_HOSTNAME;

    res.status(200).json({
      ok: true,
      videoId,
      libraryId,
      signature,
      expire,
      endpoint: 'https://video.bunnycdn.com/tusupload',
      embedUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`,
      mp4Url: cdn ? `https://${cdn}/${videoId}/play_720p.mp4` : null,
      hlsUrl: cdn ? `https://${cdn}/${videoId}/playlist.m3u8` : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Bunny create failed' });
  }
};
