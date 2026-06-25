const { createClient } = require('@supabase/supabase-js');

function sb() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

function parseUA(ua) {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };
  let browser = 'Unknown', os = 'Unknown', device = 'Desktop';

  if (/Mobile|Android|iPhone|iPad/i.test(ua)) device = /iPad|Tablet/i.test(ua) ? 'Tablet' : 'Mobile';

  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome\//i.test(ua)) browser = 'Chrome';
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';

  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return { browser, os, device };
}

async function logEvent(req, { action, category, username, role, details }) {
  try {
    const ua = req.headers['user-agent'] || '';
    const { browser, os, device } = parseUA(ua);
    const ip = (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress || '').split(',')[0].trim();

    await sb().from('audit_log').insert({
      action,
      category,
      username: username || 'unknown',
      role: role || 'unknown',
      details: details || null,
      ip_address: ip || null,
      user_agent: ua.slice(0, 500) || null,
      browser,
      os,
      device,
    });
  } catch (_) {
    // never block the main request if audit logging fails
  }
}

module.exports = { logEvent };
