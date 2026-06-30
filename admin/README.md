# Cinegma Media Dashboard

A login-protected admin page at **`/admin`** that lets you upload media and
manage blog posts.

- **Images** → optimized to AVIF and stored on Supabase Storage + CDN. Every
  image upload also creates a **draft blog post** (with the image as its cover,
  a required title, and the uploader as the author). Review it on the **Articles**
  page and hit publish to make it live on `blog.html`.
- **Videos / audio** (Upload Media page only — **not** available from the article
  editor) → committed straight into this GitHub repo (max **25 MB**), then a
  **GitHub Action optimizes them with ffmpeg, always preserving the audio track**,
  and publishes the result to `assets/videos/…` (or `assets/audio/…`). The upload
  is also cataloged in the **Media Library** page immediately so you can find and
  copy its URL right away; the optimized file itself goes live ~1–2 minutes later.
  See **"Video & audio uploads"** below.

## Accounts & visibility

Three roles, created by the owner under **Admins**:

- **owner** — full access to every account's posts and media.
- **admin** — sees all admins'/users' work (so admins collaborate), but **not**
  the owner's content.
- **user** — sees only their own posts and media.

Every post and uploaded asset is automatically attributed to the logged-in user
server-side; the byline that appears on the blog cannot be spoofed from the client.

## My Profile

Every member — owner, admin, and user — has a **My Profile** page (under
**Account** in the sidebar) to manage their basic info: full name, job title,
email, phone, location, avatar image URL, and a short bio. Database admins and
users can also change their sign-in password from here. The owner account signs
in with the `DASHBOARD_PASSWORD` environment variable, so its password can't be
changed from the dashboard. Profiles are stored server-side and a member can
only ever see and edit their own.

## One-time setup (Vercel → Project → Settings → Environment Variables)

| Variable | Required | What it is |
|---|---|---|
| `DASHBOARD_PASSWORD` | ✅ | Any strong password you choose; you'll type it on the dashboard. |
| `GITHUB_TOKEN` | ✅ (images, video) | Fine-grained GitHub token with **Contents: Read & Write** on `logoorbit/cinegma-films-website`. |
| `GITHUB_REPO` | ✅ (images, video) | `logoorbit/cinegma-films-website` |
| `GITHUB_BRANCH` | ✅ (images, video) | Production branch, e.g. `main`. |
| `GITHUB_STAGING_BRANCH` | optional | Branch used to stage video chunks before optimization (default `media-staging`). |
| `SITE_URL` | optional | Public site origin used to build the catalog URL shown in the Media Library (default `https://cinegmafilms.com`). |

After adding the variables, redeploy once so the serverless functions pick them up.

## Video & audio uploads (GitHub + ffmpeg)

The **Upload Media** page sends video/audio straight to the repo — no Supabase,
no Bunny. Because Vercel caps request bodies at ~4.5 MB, the browser streams the
file in 3 MB chunks to `/api/video-commit`, which commits them to the
`media-staging` branch and writes a `manifest.json` last.

Finalizing also writes a row into the same Supabase `media` table the **Media
Library** page reads, so the upload is immediately browsable/copyable there —
the same as an image upload — even while the optimized file is still publishing.

The manifest triggers **`.github/workflows/optimize-media.yml`**, which:

1. reassembles the chunks,
2. compresses with ffmpeg (video → H.264, downscaled to ≤1920px wide,
   `+faststart`, **audio track always re-encoded to AAC and kept** — never
   stripped; audio-only files → 192 kbps MP3),
3. commits the optimized file to `assets/videos/<id>.mp4` (or `assets/audio/<id>.mp3`)
   on the production branch, and
4. clears the staging files.

**Two one-time settings are required for this to work:**

- The `GITHUB_TOKEN` above must be able to write to the repo (the dashboard uses
  it to commit chunks). A push made by this token is what *triggers* the Action.
- In **GitHub → Settings → Actions → General → Workflow permissions**, choose
  **Read and write permissions** so the Action can commit the optimized file back.

> The `media-staging` branch holds only transient upload chunks and is never
> merged into `main`. You can disable Vercel Preview Deployments for it (Vercel →
> Settings → Git) to avoid throwaway preview builds during uploads.

## Database

Run the SQL files in the Supabase SQL Editor, in order:

1. `supabase-setup.sql` — articles + media tables, RLS, storage bucket.
2. `supabase-admins.sql` — admin accounts + media captions.
3. `supabase-authorship.sql` — adds the `author` / `author_role` columns that
   power the per-account visibility model and the public blog byline.
4. `supabase-profiles.sql` — adds the `profiles` table that backs the
   **My Profile** page.

## Notes
- Functions live in `/api` (`upload-image.js` for blog images, `video-commit.js`
  for the repo video/audio pipeline). Vercel installs `sharp` automatically from
  `package.json`.
- Large images are downscaled in the browser (max 2560px) before upload to stay
  under Vercel's 4.5MB request limit; the server then produces the final AVIF/WebP.
- The page is `noindex` and blocked in `robots.txt`. Access control is a shared
  password — keep it private. For stronger protection, enable Vercel's deployment
  password/SSO on top.
