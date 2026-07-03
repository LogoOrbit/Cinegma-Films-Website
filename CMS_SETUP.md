# Cinegma Films CMS — Setup & Implementation Guide

## Status: Phase 2 Complete ✅

The CMS is now functional with a professional admin dashboard, API endpoints, and content editors.

---

## 🚀 Quick Setup

### Step 1: Create Database Schema

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Open **SQL Editor**
4. Copy contents of `supabase-cms-schema.sql`
5. Paste into editor and click **RUN**

This creates 16 tables with proper relationships, indexes, and RLS policies.

### Step 2: Update Environment Variables

In Vercel (Project → Settings → Environment Variables), add or confirm:

```
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_KEY=your_service_role_key
DASHBOARD_PASSWORD=strong_password_here
SITE_URL=https://cinegmafilms.com
```

### Step 3: Access the CMS

Visit: **https://cinegmafilms.com/admin**

Login with:
- **Username:** `owner`
- **Password:** (your DASHBOARD_PASSWORD)

---

## 📋 Current Features

### Dashboard
- Real-time statistics (films, team, services, media count)
- Recent activity & unread messages
- Navigation between sections

### Films Management
- ✅ Create films with full metadata
- ✅ Title, slug, description, plot, genre, runtime
- ✅ Release date, visibility (public/password/invite/private)
- ✅ Status (draft/scheduled/published/archived)
- ✅ Featured toggle
- ⏳ Film versions (teaser, trailer, full film) — Phase 3
- ⏳ Cast & crew credits — Phase 3
- ⏳ Media uploads — Phase 3

### Team Management
- ✅ Add/edit team members
- ✅ Name, position, bio, skills, experience
- ✅ Social media links (as JSON)
- ✅ Featured toggle
- ⏳ Photo uploads — Phase 3
- ⏳ Film appearances — Phase 3

### Services
- ✅ Create production services
- ✅ Title, description, categories, pricing
- ✅ Featured & visibility toggles
- ⏳ Link example films — Phase 3

### Upcoming (Phase 3)
- Gallery & portfolio images
- Awards & festival selections
- Contact message inbox
- Pages & SEO metadata
- Analytics dashboard
- Media library with upload
- Bulk actions & search

---

## 🔌 API Reference

### Authentication
```bash
POST /api/auth
{ "action": "login", "username": "owner", "password": "..." }
# Returns: { token, role, username }
```

All subsequent requests need:
```
X-Session-Token: <token>
```

### Films API
```bash
GET /api/films?status=draft&featured=true
POST /api/films { action: 'create', film: {...} }
GET /api/films/:id
PATCH /api/films/:id { film: {...} }
DELETE /api/films/:id
POST /api/films/:id/publish
```

### Team API
```bash
GET /api/team?featured=true
POST /api/team { action: 'create', member: {...} }
GET /api/team/:id
PATCH /api/team/:id { member: {...} }
DELETE /api/team/:id
```

### Services API
```bash
GET /api/services?visible=true
POST /api/services { action: 'create', service: {...} }
GET /api/services/:id
PATCH /api/services/:id { service: {...} }
DELETE /api/services/:id
```

### Analytics API
```bash
GET /api/analytics/summary        # Dashboard stats
GET /api/analytics/films          # Film metrics
GET /api/analytics/pending        # Pending review items
```

### Pages API
```bash
GET /api/pages/:slug              # Get SEO metadata
PATCH /api/pages/:slug { page: {...} }  # Update SEO
```

---

## 📁 File Structure

```
admin/
├── index.html          # Main dashboard UI + JS
├── editors.js          # Editor classes & modal system
└── README.md           # Admin setup instructions

api/
├── auth.js             # Authentication & user management
├── films.js            # Film CRUD operations
├── team.js             # Team member management
├── services.js         # Services management
├── pages.js            # SEO & page metadata
├── analytics.js        # Dashboard analytics
├── media-upload.js     # (existing) Image uploads
└── video-commit.js     # (existing) Video uploads

lib/
├── auth.js             # JWT token handling
└── audit.js            # Audit logging

supabase-cms-schema.sql # CMS database tables & RLS
```

---

## 🎨 UI/UX

The dashboard is inspired by:
- **YouTube Studio** — Film management, detailed editing
- **Vercel** — Clean dashboard, recent activity
- **Linear** — Modal editors, side panels
- **Webflow** — Visual content management
- **Shopify** — Product (film) management

**Design Features:**
- Dark mode optimized
- Responsive (desktop-first, tablet-ready)
- Smooth animations & transitions
- Keyboard accessible
- Loading states & error messages
- Modal editors with backdrop blur

---

## 🔐 Security

✅ **Authentication:**
- JWT tokens (30-day expiration)
- Session stored in localStorage
- Request validation on every API call

✅ **Authorization:**
- Role-based access (owner/admin/user)
- Row-level security (RLS) in Supabase
- Service role API calls only

✅ **Data Protection:**
- Password hashing (bcrypt)
- SQL injection prevention (parameterized queries)
- CORS configured
- Content Security Policy headers

---

## 📝 Film Metadata Fields

When creating/editing a film:

```json
{
  "title": "Janjaal",
  "slug": "janjaal-tussle",
  "description": "A police officer discovers a cursed pocket watch.",
  "plot": "Full plot description...",
  "genre": ["Thriller", "Psychological Thriller"],
  "runtime": 1440,
  "release_date": "2024-01-01",
  "visibility": "public",
  "password": null,
  "status": "published",
  "featured": true,
  "scheduled_publish_at": null,
  "scheduled_unpublish_at": null
}
```

---

## 👥 Team Member Fields

```json
{
  "name": "Syed Asad Raza Abidi",
  "slug": "syed-asad",
  "position": "Director, Editor, Colorist",
  "bio": "Pakistani filmmaker based in Karachi...",
  "photo_url": "https://...",
  "social_links": {
    "instagram": "@asadsyed711",
    "imdb": "nm16938510",
    "filmfreeway": "SyedAsad"
  },
  "skills": ["Cinematography", "Editing", "Color Grading"],
  "experience": "5+ years in independent cinema",
  "featured": true
}
```

---

## 🛠️ Planned Phase 3 Features

### Media Library
- Central hub for all uploads
- Image optimization (AVIF, WebP)
- Video optimization (H.264)
- Search & filter
- Usage tracking
- Batch operations

### Film Versions
- Teaser, trailer, full film
- Different cuts & editions
- Scheduled publishing
- Access control per version

### Film Credits
- Link cast/crew to films
- Character names
- Sort by role
- Auto-appear on watch page

### Gallery Management
- Portfolio images
- Behind-the-scenes
- Categories & ordering
- Featured items

### Contact Inbox
- View messages
- Mark as read/replied
- Archive conversation
- Search & filter

### Pages & SEO
- Meta tags per page
- Open Graph images
- Twitter Cards
- Structured data (Schema.org)
- Sitemap auto-generation

### Website Integration
- Make homepage dynamic
- Dynamic watch page
- Dynamic team profiles
- Dynamic services page
- Dynamic gallery
- Dynamic contact handling

---

## 💡 Usage Tips

### Creating a New Film
1. Go to **Films** section
2. Click **+ New Film** button
3. Fill in title, slug, description
4. Set status (draft/scheduled/published)
5. Save
6. (Phase 3) Upload versions & media
7. (Phase 3) Add cast/crew
8. Publish

### Managing Team
1. Go to **Team** section
2. Click **+ Add Member**
3. Fill details (name, position, bio, social links)
4. Toggle Featured if needed
5. Save
6. (Phase 3) Upload photo
7. (Phase 3) Appears on all relevant film pages

### Editing Services
1. Go to **Services**
2. Click **+ New Service**
3. Add title, description, categories
4. Set pricing if applicable
5. Featured & visible toggles
6. Save
7. (Phase 3) Link example films

---

## 🐛 Troubleshooting

**"Unauthorized" error on login**
- Check DASHBOARD_PASSWORD env var
- Ensure credentials are correct
- Clear browser cache/localStorage

**API 404 errors**
- Verify Supabase tables were created (check supabase-cms-schema.sql ran)
- Check SUPABASE_URL and SUPABASE_SERVICE_KEY env vars
- Confirm Vercel functions are deployed

**Modal doesn't open**
- Check browser console for JS errors
- Ensure editors.js loaded (check Network tab)
- Try hard refresh (Ctrl+Shift+R)

**Session expires after 30 minutes**
- Token TTL is intentional (security)
- Login again to get new token
- Can extend TTL in api/auth.js if needed

---

## 📞 Support

For issues or questions:
1. Check browser console for error messages
2. Review Supabase logs (Project → Logs)
3. Check Vercel deployment logs
4. Verify environment variables are set

---

## 🎯 Next: Phase 3 — Website Integration

Once Phase 2 is complete, Phase 3 will:
1. Create data fetching layer for website
2. Make homepage dynamic (hero sections, featured content)
3. Make watch page dynamic (load films from DB)
4. Make team page dynamic (load from DB)
5. Make services page dynamic
6. Make gallery dynamic
7. Update website to fetch from CMS APIs

This means you'll manage almost everything from the dashboard, and the website will auto-update! 🚀

---

**Version:** 1.0  
**Last Updated:** 2026-07-03  
**Status:** Production Ready (Phase 1 & 2)
