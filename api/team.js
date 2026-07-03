// Team Members CMS API
// POST { action: 'create', member: {...} }     -> { member }
// GET /api/team?featured=true                  -> { members: [...] }
// GET /api/team/:id                            -> { member, appearances }
// PATCH /api/team/:id { member: {...} }        -> { member }
// DELETE /api/team/:id                         -> { ok }

const { createClient } = require('@supabase/supabase-js');
const auth = require('../lib/auth');
const { logEvent } = require('../lib/audit');

function sb() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

const ALLOWED_ORIGIN = process.env.SITE_URL || 'https://cinegmafilms.com';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Session-Token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const me = auth.getAuth(req);
    if (!me) return res.status(401).json({ error: 'Unauthorized' });

    const { action, member } = req.body || {};

    // ---- CREATE MEMBER ----
    if (req.method === 'POST' && action === 'create') {
      if (!member || !member.name || !member.slug) {
        return res.status(400).json({ error: 'name and slug are required' });
      }

      const memberData = {
        name: member.name,
        slug: member.slug,
        position: member.position || null,
        bio: member.bio || null,
        photo_url: member.photo_url || null,
        social_links: member.social_links || {},
        skills: member.skills || [],
        experience: member.experience || null,
        featured: member.featured || false,
        display_order: member.display_order || 0,
      };

      const { data, error } = await sb().from('team_members').insert([memberData]).select('*').single();
      if (error) {
        if (error.message.includes('duplicate')) return res.status(409).json({ error: 'Slug already exists' });
        throw error;
      }

      await logEvent(req, { action: 'team_member_created', category: 'team', entity_id: data.id, username: me.username });
      return res.json({ member: data });
    }

    // ---- LIST MEMBERS ----
    if (req.method === 'GET') {
      let query = sb().from('team_members').select('*');

      if (req.query?.featured === 'true') query = query.eq('featured', true);
      if (req.query?.search) query = query.ilike('name', `%${req.query.search}%`);

      const { data, error } = await query.order('display_order');
      if (error) throw error;

      return res.json({ members: data || [] });
    }

    // Get single member with film appearances
    const memberId = req.url?.split('/').pop();
    if (req.method === 'GET' && memberId && memberId !== 'team') {
      const { data: member, error: memberError } = await sb()
        .from('team_members')
        .select('*')
        .eq('id', memberId)
        .single();
      if (memberError) return res.status(404).json({ error: 'Team member not found' });

      const { data: appearances } = await sb()
        .from('film_credits')
        .select('film:film_id(id,title,slug,status),role,character_name')
        .eq('team_member_id', memberId);

      return res.json({ member, appearances: appearances || [] });
    }

    // ---- UPDATE MEMBER ----
    if (req.method === 'PATCH' && memberId && memberId !== 'team') {
      if (!member) return res.status(400).json({ error: 'member object is required' });

      const updateData = {
        name: member.name,
        slug: member.slug,
        position: member.position,
        bio: member.bio,
        photo_url: member.photo_url,
        social_links: member.social_links,
        skills: member.skills,
        experience: member.experience,
        featured: member.featured,
        display_order: member.display_order,
      };

      const { data, error } = await sb().from('team_members').update(updateData).eq('id', memberId).select('*').single();
      if (error) throw error;

      await logEvent(req, { action: 'team_member_updated', category: 'team', entity_id: memberId, username: me.username });
      return res.json({ member: data });
    }

    // ---- DELETE MEMBER ----
    if (req.method === 'DELETE' && memberId && memberId !== 'team') {
      const { error } = await sb().from('team_members').delete().eq('id', memberId);
      if (error) throw error;

      await logEvent(req, { action: 'team_member_deleted', category: 'team', entity_id: memberId, username: me.username });
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: 'Invalid request' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
