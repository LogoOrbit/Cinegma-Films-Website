import * as SecureStore from 'expo-secure-store';

let BASE_URL = '';

export function setBaseUrl(url) {
  BASE_URL = url.replace(/\/$/, '');
}

export function getBaseUrl() {
  return BASE_URL;
}

export async function getSession() {
  const token = await SecureStore.getItemAsync('cms_token');
  const role = await SecureStore.getItemAsync('cms_role');
  const username = await SecureStore.getItemAsync('cms_username');
  return { token, role, username };
}

export async function saveSession(token, role, username) {
  await SecureStore.setItemAsync('cms_token', token);
  await SecureStore.setItemAsync('cms_role', role);
  await SecureStore.setItemAsync('cms_username', username);
}

export async function clearSession() {
  await SecureStore.deleteItemAsync('cms_token');
  await SecureStore.deleteItemAsync('cms_role');
  await SecureStore.deleteItemAsync('cms_username');
}

export async function api(path, opts = {}) {
  const session = await getSession();
  const headers = {
    'Content-Type': 'application/json',
    'X-Session-Token': session.token || '',
    ...(opts.headers || {}),
  };
  const url = BASE_URL + path;
  const r = await fetch(url, { ...opts, headers });
  let d = {};
  try { d = await r.json(); } catch (_) {}
  if (r.status === 401) {
    await clearSession();
    throw new Error('SESSION_EXPIRED');
  }
  if (!r.ok) throw new Error(d.error || 'Request failed');
  return d;
}

export async function login(username, password) {
  const r = await fetch(BASE_URL + '/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', username, password }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Login failed');
  await saveSession(d.token, d.role, d.username);
  return d;
}
