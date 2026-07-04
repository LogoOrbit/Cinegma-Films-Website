// ════════════════════════════════════════════════════════════════
// CMS Client Library — Load dynamic content from CMS
// Used by website pages to fetch and render content
// ════════════════════════════════════════════════════════════════

const CMS = {
  baseUrl: '/api',
  cache: {},
  cacheTime: 5 * 60 * 1000, // 5 minutes

  /**
   * Fetch films
   */
  async getFilms(options = {}) {
    const key = 'films';
    if (this.cache[key] && Date.now() - this.cache[key].time < this.cacheTime) {
      return this.cache[key].data;
    }

    try {
      const res = await fetch(`${this.baseUrl}/public-data?type=films`);
      const data = await res.json();
      this.cache[key] = { data: data.films || [], time: Date.now() };
      return data.films || [];
    } catch (e) {
      console.error('Error fetching films:', e);
      return [];
    }
  },

  /**
   * Fetch single film with versions, credits, awards
   */
  async getFilm(slug) {
    const key = `film-${slug}`;
    if (this.cache[key] && Date.now() - this.cache[key].time < this.cacheTime) {
      return this.cache[key].data;
    }

    try {
      const res = await fetch(`${this.baseUrl}/public-data?type=film-detail&slug=${slug}`);
      const data = await res.json();
      this.cache[key] = { data, time: Date.now() };
      return data;
    } catch (e) {
      console.error(`Error fetching film ${slug}:`, e);
      return null;
    }
  },

  /**
   * Fetch team members
   */
  async getTeam() {
    const key = 'team';
    if (this.cache[key] && Date.now() - this.cache[key].time < this.cacheTime) {
      return this.cache[key].data;
    }

    try {
      const res = await fetch(`${this.baseUrl}/public-data?type=team`);
      const data = await res.json();
      this.cache[key] = { data: data.team || [], time: Date.now() };
      return data.team || [];
    } catch (e) {
      console.error('Error fetching team:', e);
      return [];
    }
  },

  /**
   * Fetch single team member
   */
  async getTeamMember(slug) {
    const key = `team-${slug}`;
    if (this.cache[key] && Date.now() - this.cache[key].time < this.cacheTime) {
      return this.cache[key].data;
    }

    try {
      const res = await fetch(`${this.baseUrl}/public-data?type=team-member&slug=${slug}`);
      const data = await res.json();
      this.cache[key] = { data, time: Date.now() };
      return data;
    } catch (e) {
      console.error(`Error fetching team member ${slug}:`, e);
      return null;
    }
  },

  /**
   * Fetch services
   */
  async getServices() {
    const key = 'services';
    if (this.cache[key] && Date.now() - this.cache[key].time < this.cacheTime) {
      return this.cache[key].data;
    }

    try {
      const res = await fetch(`${this.baseUrl}/public-data?type=services`);
      const data = await res.json();
      this.cache[key] = { data: data.services || [], time: Date.now() };
      return data.services || [];
    } catch (e) {
      console.error('Error fetching services:', e);
      return [];
    }
  },

  /**
   * Fetch gallery items
   */
  async getGallery() {
    const key = 'gallery';
    if (this.cache[key] && Date.now() - this.cache[key].time < this.cacheTime) {
      return this.cache[key].data;
    }

    try {
      const res = await fetch(`${this.baseUrl}/public-data?type=gallery`);
      const data = await res.json();
      this.cache[key] = { data: data.gallery || [], time: Date.now() };
      return data.gallery || [];
    } catch (e) {
      console.error('Error fetching gallery:', e);
      return [];
    }
  },

  /**
   * Fetch all awards
   */
  async getAwards() {
    const key = 'awards';
    if (this.cache[key] && Date.now() - this.cache[key].time < this.cacheTime) {
      return this.cache[key].data;
    }

    try {
      const res = await fetch(`${this.baseUrl}/public-data?type=awards-all`);
      const data = await res.json();
      this.cache[key] = { data: data.awards || [], time: Date.now() };
      return data.awards || [];
    } catch (e) {
      console.error('Error fetching awards:', e);
      return [];
    }
  },

  /**
   * Fetch testimonials
   */
  async getTestimonials() {
    const key = 'testimonials';
    if (this.cache[key] && Date.now() - this.cache[key].time < this.cacheTime) {
      return this.cache[key].data;
    }

    try {
      const res = await fetch(`${this.baseUrl}/public-data?type=testimonials`);
      const data = await res.json();
      this.cache[key] = { data: data.testimonials || [], time: Date.now() };
      return data.testimonials || [];
    } catch (e) {
      console.error('Error fetching testimonials:', e);
      return [];
    }
  },

  /**
   * Fetch featured content (for homepage)
   */
  async getFeatured() {
    const key = 'featured';
    if (this.cache[key] && Date.now() - this.cache[key].time < this.cacheTime) {
      return this.cache[key].data;
    }

    try {
      const res = await fetch(`${this.baseUrl}/public-data?type=featured`);
      const data = await res.json();
      this.cache[key] = { data, time: Date.now() };
      return data;
    } catch (e) {
      console.error('Error fetching featured:', e);
      return {
        featured_films: [],
        featured_team: [],
        featured_services: [],
      };
    }
  },

  /**
   * Fetch page SEO metadata
   */
  async getPageSEO(slug) {
    const key = `page-seo-${slug}`;
    if (this.cache[key] && Date.now() - this.cache[key].time < this.cacheTime) {
      return this.cache[key].data;
    }

    try {
      const res = await fetch(`${this.baseUrl}/public-data?type=page-seo&slug=${slug}`);
      const data = await res.json();
      this.cache[key] = { data: data.page, time: Date.now() };
      return data.page;
    } catch (e) {
      console.error(`Error fetching SEO for ${slug}:`, e);
      return null;
    }
  },

  /**
   * Clear cache
   */
  clearCache(key = null) {
    if (key) {
      delete this.cache[key];
    } else {
      this.cache = {};
    }
  },

  /**
   * Preload all common data
   */
  async preload() {
    await Promise.all([
      this.getFilms(),
      this.getTeam(),
      this.getServices(),
      this.getGallery(),
      this.getAwards(),
      this.getTestimonials(),
      this.getFeatured(),
    ]);
  },
};

// Export for use in scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CMS;
}
