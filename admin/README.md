# Cinegma Media Dashboard

A login-protected admin page at **`/admin`** that lets you upload media and
manage blog posts.

- **Images** → optimized to AVIF and stored on Supabase Storage + CDN. Every
  image upload also creates a **draft blog post** (with the image as its cover,
  a required title, and the uploader as the author). Review it on the **Articles**
  page and hit publish to make it live on `blog.html`.
- **Videos** → uploaded directly from your browser to **Bunny Stream**, which
  transcodes them into web-optimized formats. The dashboard returns an embed
  iframe + direct MP4 URL to paste into your pages.

## Accounts & visibility

Three roles, created by the owner under **Admins**:

- **owner** — full access to every account's posts and media.
- **admin** — sees all admins'/users' work (so admins collaborate), but **not**
  the owner's content.
- **user** — sees only their own posts and media.

Every post and uploaded asset is automatically attributed to the logged-in user
server-side; the byline that appears on the blog cannot be spoofed from the client.

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

## Database

Run the SQL files in the Supabase SQL Editor, in order:

1. `supabase-setup.sql` — articles + media tables, RLS, storage bucket.
2. `supabase-admins.sql` — admin accounts + media captions.
3. `supabase-authorship.sql` — adds the `author` / `author_role` columns that
   power the per-account visibility model and the public blog byline.

## Notes
- Functions live in `/api` (`upload-image.js`, `bunny-create.js`). Vercel installs
  `sharp` automatically from `package.json`.
- Large images are downscaled in the browser (max 2560px) before upload to stay
  under Vercel's 4.5MB request limit; the server then produces the final AVIF/WebP.
- The page is `noindex` and blocked in `robots.txt`. Access control is a shared
  password — keep it private. For stronger protection, enable Vercel's deployment
  password/SSO on top.
