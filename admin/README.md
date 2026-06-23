# Cinegma Media Dashboard

A password-protected admin page at **`/admin`** that lets you upload media and
have it optimized + published automatically.

- **Images** → optimized to AVIF (full + 400w) + WebP and committed straight to
  `assets/posters/` via the GitHub API. Vercel redeploys on the commit.
- **Videos** → uploaded directly from your browser to **Bunny Stream**, which
  transcodes them into web-optimized formats. The dashboard returns an embed
  iframe + direct MP4 URL to paste into your pages.

## One-time setup (Vercel → Project → Settings → Environment Variables)

| Variable | Required | What it is |
|---|---|---|
| `DASHBOARD_PASSWORD` | ✅ | Any strong password you choose; you'll type it on the dashboard. |
| `GITHUB_TOKEN` | ✅ (images) | Fine-grained GitHub token with **Contents: Read & Write** on `logoorbit/cinegma-films-website`. |
| `GITHUB_REPO` | ✅ (images) | `logoorbit/cinegma-films-website` |
| `GITHUB_BRANCH` | ✅ (images) | Production branch, e.g. `main`. |
| `BUNNY_STREAM_API_KEY` | ✅ (video) | Bunny dashboard → Stream → your library → API key. |
| `BUNNY_STREAM_LIBRARY_ID` | ✅ (video) | The numeric Stream library id. |
| `BUNNY_STREAM_CDN_HOSTNAME` | optional | Stream pull-zone host (e.g. `vz-xxxx.b-cdn.net`) to build direct MP4/HLS URLs. |

After adding the variables, redeploy once so the serverless functions pick them up.

## Notes
- Functions live in `/api` (`upload-image.js`, `bunny-create.js`). Vercel installs
  `sharp` automatically from `package.json`.
- Large images are downscaled in the browser (max 2560px) before upload to stay
  under Vercel's 4.5MB request limit; the server then produces the final AVIF/WebP.
- The page is `noindex` and blocked in `robots.txt`. Access control is a shared
  password — keep it private. For stronger protection, enable Vercel's deployment
  password/SSO on top.
