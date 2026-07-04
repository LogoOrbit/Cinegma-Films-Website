# Website Integration with CMS

This guide shows how to integrate the CMS data into your website pages. After this, your website becomes fully dynamic — changes in the CMS instantly appear on the website.

---

## Quick Start

### 1. Load the CMS Client Library

Add this script to your HTML pages:

```html
<script src="/assets/js/cms-client.js"></script>
```

### 2. Use CMS Data in Your Scripts

```javascript
// Fetch films
const films = await CMS.getFilms();

// Fetch single film
const film = await CMS.getFilm('janjaal-tussle');

// Fetch team
const team = await CMS.getTeam();

// Fetch services
const services = await CMS.getServices();

// And more...
```

---

## Example 1: Dynamic Films on Watch Page

**Current state:** watch.html has hardcoded films  
**After integration:** Films auto-load from CMS

### Before (Hardcoded)
```html
<div class="fcard">
  <div class="fc-media">
    <img src="assets/posters/Janjaal_Opt_01.avif" alt="Janjaal">
  </div>
  <div class="fc-body">
    <h2>Janjaal</h2>
    <p>A police officer discovers a cursed pocket watch...</p>
  </div>
</div>
```

### After (Dynamic)

In your `watch.html`, add this script before closing `</body>`:

```html
<script src="/assets/js/cms-client.js"></script>
<script>
// Load films from CMS and render them
async function loadFilmsFromCMS() {
  try {
    const films = await CMS.getFilms();
    const container = document.querySelector('.rail'); // or wherever films go

    if (!films.length) {
      container.innerHTML = '<p>No films available</p>';
      return;
    }

    container.innerHTML = films.map(film => `
      <div class="fcard">
        <div class="fc-media">
          <img src="${film.poster_url || '/assets/posters/default.png'}" alt="${film.title}">
        </div>
        <div class="fc-body">
          <div class="fc-title">${film.title}</div>
          <p class="fc-syn">${film.description || ''}</p>
          <a href="/watch.html?film=${film.slug}" class="fbtn play">Watch</a>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.error('Error loading films:', e);
  }
}

// Load on page load
document.addEventListener('DOMContentLoaded', loadFilmsFromCMS);

// Or with better performance:
window.addEventListener('load', loadFilmsFromCMS);
</script>
```

---

## Example 2: Dynamic Team on About Page

### In about.html:

```html
<div id="teamContainer"></div>

<script src="/assets/js/cms-client.js"></script>
<script>
async function loadTeamFromCMS() {
  const team = await CMS.getTeam();
  const container = document.getElementById('teamContainer');

  container.innerHTML = team
    .filter(member => member.featured) // Show only featured
    .map(member => `
      <div class="team-card">
        <img src="${member.photo_url}" alt="${member.name}">
        <h3>${member.name}</h3>
        <p class="position">${member.position}</p>
        <p class="bio">${member.bio}</p>
        <div class="socials">
          ${member.social_links?.instagram ? `<a href="https://instagram.com/${member.social_links.instagram}">Instagram</a>` : ''}
          ${member.social_links?.imdb ? `<a href="https://imdb.com/name/${member.social_links.imdb}">IMDb</a>` : ''}
        </div>
      </div>
    `)
    .join('');
}

window.addEventListener('load', loadTeamFromCMS);
</script>
```

---

## Example 3: Dynamic Services Page

### In services.html:

```html
<div class="services-grid" id="servicesContainer"></div>

<script src="/assets/js/cms-client.js"></script>
<script>
async function loadServicesFromCMS() {
  const services = await CMS.getServices();
  const container = document.getElementById('servicesContainer');

  container.innerHTML = services.map(service => `
    <div class="service-card">
      ${service.image_url ? `<img src="${service.image_url}" alt="${service.title}">` : ''}
      <h3>${service.title}</h3>
      <p>${service.description}</p>
      ${service.pricing ? `<p class="price">From $${service.pricing}</p>` : ''}
      <a href="/contact.html?service=${service.slug}" class="btn">Inquire</a>
    </div>
  `).join('');
}

window.addEventListener('load', loadServicesFromCMS);
</script>
```

---

## Example 4: Dynamic Gallery

### In portfolio.html:

```html
<div class="gallery-grid" id="galleryContainer"></div>

<script src="/assets/js/cms-client.js"></script>
<script>
async function loadGalleryFromCMS() {
  const gallery = await CMS.getGallery();
  const container = document.getElementById('galleryContainer');

  container.innerHTML = gallery.map(item => `
    <div class="gallery-item">
      <img src="${item.media?.url}" alt="${item.title}">
      ${item.title ? `<h4>${item.title}</h4>` : ''}
      ${item.description ? `<p>${item.description}</p>` : ''}
    </div>
  `).join('');
}

window.addEventListener('load', loadGalleryFromCMS);
</script>
```

---

## Example 5: Single Film Detail Page

For a page that displays a single film (e.g., `/film.html?slug=janjaal-tussle`):

```javascript
async function loadFilmDetails() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  if (!slug) return;

  const film = await CMS.getFilm(slug);
  if (!film) {
    document.body.innerHTML = '<h1>Film not found</h1>';
    return;
  }

  // Update page title & meta tags
  document.title = film.title;
  document.querySelector('meta[property="og:title"]').content = film.title;

  // Render film details
  document.getElementById('filmTitle').textContent = film.title;
  document.getElementById('filmDescription').textContent = film.description;
  document.getElementById('filmPlot').textContent = film.plot;

  // Render versions (teaser, trailer, full film)
  if (film.versions?.length) {
    document.getElementById('filmVersions').innerHTML = film.versions.map(v => `
      <div class="version">
        <h4>${v.version_type}</h4>
        ${v.main_video?.url ? `
          <video width="100%" controls>
            <source src="${v.main_video.url}" type="video/mp4">
          </video>
        ` : ''}
      </div>
    `).join('');
  }

  // Render cast & crew
  if (film.credits?.length) {
    document.getElementById('credits').innerHTML = film.credits.map(c => `
      <div class="credit">
        <img src="${c.team_member?.photo_url}" alt="${c.team_member?.name}">
        <div>
          <strong>${c.team_member?.name}</strong>
          <p>${c.role}${c.character_name ? ` (${c.character_name})` : ''}</p>
        </div>
      </div>
    `).join('');
  }

  // Render awards
  if (film.awards?.length) {
    document.getElementById('awards').innerHTML = film.awards.map(a => `
      <p class="award">
        <strong>${a.award_name}</strong> — ${a.festival_name} ${a.year}
      </p>
    `).join('');
  }
}

window.addEventListener('load', loadFilmDetails);
```

---

## CMS API Methods Reference

### Films
```javascript
const films = await CMS.getFilms();
const film = await CMS.getFilm('slug');
```

### Team
```javascript
const team = await CMS.getTeam();
const member = await CMS.getTeamMember('slug');
```

### Services
```javascript
const services = await CMS.getServices();
```

### Gallery
```javascript
const gallery = await CMS.getGallery();
```

### Awards
```javascript
const awards = await CMS.getAwards();
```

### Testimonials
```javascript
const testimonials = await CMS.getTestimonials();
```

### Featured Content (Homepage)
```javascript
const { featured_films, featured_team, featured_services } = await CMS.getFeatured();
```

### Page SEO
```javascript
const seo = await CMS.getPageSEO('home');
// Use to update meta tags, title, etc.
```

---

## Automatic Caching

The CMS client automatically caches data for 5 minutes. This means:
- **Fast page loads** — Data is served from cache
- **Fresh data** — Cache expires every 5 minutes
- **Bandwidth efficient** — No redundant API calls

Clear cache manually if needed:
```javascript
CMS.clearCache();           // Clear all cache
CMS.clearCache('films');    // Clear specific cache
```

---

## Error Handling

All methods return empty arrays/objects on error:

```javascript
const films = await CMS.getFilms(); // [] if error
const film = await CMS.getFilm('slug'); // null if error
```

Check the browser console for error details.

---

## Performance Optimization

### Preload Critical Data
```javascript
// Preload all common data on page load
await CMS.preload();
```

### Lazy Loading
```javascript
// Only load when needed
const galleryBtn = document.getElementById('showGallery');
galleryBtn.addEventListener('click', async () => {
  const gallery = await CMS.getGallery();
  renderGallery(gallery);
});
```

---

## SEO Integration

Update page meta tags from CMS:

```javascript
async function updatePageMeta(slug) {
  const page = await CMS.getPageSEO(slug);

  if (page) {
    document.title = page.seo_title || document.title;
    document.querySelector('meta[name="description"]').content = page.seo_description;
    document.querySelector('meta[property="og:image"]').content = page.og_image_url;
    // ... update other meta tags
  }
}
```

---

## Migration Steps

### Phase 1: Add CMS Library
1. Add `<script src="/assets/js/cms-client.js"></script>` to pages

### Phase 2: Update One Page
1. Choose one page (e.g., films list on watch page)
2. Replace hardcoded HTML with CMS data
3. Test and verify

### Phase 3: Roll Out to All Pages
1. Update home page (featured films, team, services)
2. Update watch page (films, filters)
3. Update team page (members, bio)
4. Update services page
5. Update gallery page
6. Update contact form (submit to CMS)

### Phase 4: Complete the Loop
1. Test entire flow: Edit in CMS → Website updates
2. Remove hardcoded content
3. Launch to production

---

## Complete Example: index.html

Here's how to update your homepage to be fully dynamic:

```html
<!-- Add to homepage -->
<script src="/assets/js/cms-client.js"></script>

<!-- Featured Films Section -->
<section id="featuredFilms">
  <h2>Featured Works</h2>
  <div class="films-grid" id="filmsContainer"></div>
</section>

<!-- Team Section -->
<section id="team">
  <h2>Our Team</h2>
  <div class="team-grid" id="teamContainer"></div>
</section>

<!-- Services Section -->
<section id="services">
  <h2>Services</h2>
  <div class="services-grid" id="servicesContainer"></div>
</section>

<script>
async function loadHomepage() {
  const featured = await CMS.getFeatured();

  // Load featured films
  document.getElementById('filmsContainer').innerHTML = featured.featured_films
    .map(film => `
      <div class="film-card">
        <img src="${film.poster_url || '/assets/posters/default.png'}">
        <h3>${film.title}</h3>
      </div>
    `).join('');

  // Load featured team
  document.getElementById('teamContainer').innerHTML = featured.featured_team
    .map(member => `
      <div class="team-card">
        <img src="${member.photo_url}">
        <h3>${member.name}</h3>
        <p>${member.position}</p>
      </div>
    `).join('');

  // Load featured services
  document.getElementById('servicesContainer').innerHTML = featured.featured_services
    .map(service => `
      <div class="service-card">
        <h3>${service.title}</h3>
        <p>${service.description}</p>
      </div>
    `).join('');
}

window.addEventListener('load', loadHomepage);
</script>
```

---

## Troubleshooting

### "CMS is not defined"
- Make sure `cms-client.js` is loaded before your script
- Check browser Network tab to confirm file loads

### No data appearing
- Check browser console for errors
- Verify Supabase tables have data
- Check that films are "published" status

### Slow page loads
- Use `CMS.preload()` to load data early
- Implement lazy loading for off-screen content
- Consider reducing data in queries

### Cache not updating
- Manual clear: `CMS.clearCache()`
- Or wait 5 minutes for automatic refresh
- Or use browser Dev Tools to disable cache

---

## Next Steps

1. ✅ CMS is built (Phases 1-3)
2. 🚀 Integrate into website pages (this guide)
3. 📊 Add analytics & media upload (Phase 4)
4. 🎯 Go live with full dynamic CMS

**Ready to integrate?** Pick one page and start with the examples above!

---

**Version:** 3.0  
**Status:** Ready for Integration  
**Last Updated:** 2026-07-04
