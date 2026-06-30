import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const storage = {
  async get(key) {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  async set(key, value) {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
    return SecureStore.setItemAsync(key, value);
  },
  async remove(key) {
    if (Platform.OS === 'web') { localStorage.removeItem(key); return; }
    return SecureStore.deleteItemAsync(key);
  },
};

let BASE_URL = 'https://cinegmafilms.com';

export function setBaseUrl(url) {
  BASE_URL = url.replace(/\/$/, '');
}

export function getBaseUrl() {
  return BASE_URL;
}

export async function getSession() {
  const token = await storage.get('cms_token');
  const role = await storage.get('cms_role');
  const username = await storage.get('cms_username');
  return { token, role, username };
}

export async function saveSession(token, role, username) {
  await storage.set('cms_token', token);
  await storage.set('cms_role', role);
  await storage.set('cms_username', username);
}

export async function clearSession() {
  await storage.remove('cms_token');
  await storage.remove('cms_role');
  await storage.remove('cms_username');
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
