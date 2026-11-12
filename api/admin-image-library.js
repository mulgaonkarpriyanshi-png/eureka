import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';

function send(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json').setHeader('Cache-Control', 'no-store').json(body);
}

function b64(value) {
  return Buffer.from(value).toString('base64url');
}

async function driveToken() {
  let email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if ((!email || !rawKey) && process.env.GOOGLE_SERVICE_ACCOUNT_FILE) {
    const credentials = JSON.parse(await readFile(process.env.GOOGLE_SERVICE_ACCOUNT_FILE, 'utf8'));
    email = credentials.client_email;
    rawKey = credentials.private_key;
  }
  if (!email || !rawKey) throw new Error('Google Drive credentials are not configured');
  const now = Math.floor(Date.now() / 1000);
  const header = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64(JSON.stringify({ iss: email, scope: 'https://www.googleapis.com/auth/drive.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const assertion = `${header}.${claims}.${crypto.sign('RSA-SHA256', Buffer.from(`${header}.${claims}`), rawKey.replace(/\\n/g, '\n')).toString('base64url')}`;
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || 'Could not authenticate Google Drive');
  return data.access_token;
}

async function uploadToEureka(sourceUrl, headers, filename) {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://caigrloiymgfxubzprbg.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseKey) throw new Error('Supabase storage key is not configured');
  const source = await fetch(sourceUrl, { headers });
  if (!source.ok) throw new Error('Could not download the selected image');
  const bytes = Buffer.from(await source.arrayBuffer());
  const type = source.headers.get('content-type') || 'image/jpeg';
  const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
  const path = `library/${Date.now()}-${filename.replace(/[^a-z0-9-]/gi, '-').slice(0, 42)}.${ext}`;
  const upload = await fetch(`${supabaseUrl}/storage/v1/object/eureka-images/${path}`, { method: 'POST', headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': type, 'x-upsert': 'false' }, body: bytes });
  if (!upload.ok) { const e = await upload.json().catch(() => ({})); throw new Error(e.message || 'Could not store the selected image'); }
  return `${supabaseUrl}/storage/v1/object/public/eureka-images/${path}`;
}

async function driveFolderImages(token, rootFolder, nameQuery) {
  const queue = [{ id: rootFolder, path: '' }];
  const images = [];
  const seen = new Set();
  while (queue.length && seen.size < 80 && images.length < 300) {
    const folder = queue.shift();
    if (!folder?.id || seen.has(folder.id)) continue;
    seen.add(folder.id);
    const params = new URLSearchParams({
      q: `'${String(folder.id).replace(/'/g, "\\'")}' in parents and trashed = false`,
      fields: 'files(id,name,mimeType,thumbnailLink)',
      pageSize: '1000',
      orderBy: 'createdTime desc'
    });
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Drive folder scan failed');
    for (const file of data.files || []) {
      if (file.mimeType === 'application/vnd.google-apps.folder') {
        queue.push({ id: file.id, path: folder.path ? `${folder.path} / ${file.name}` : file.name });
      } else if (String(file.mimeType || '').startsWith('image/')) {
        const haystack = `${folder.path} ${file.name}`.toLowerCase();
        const words = String(nameQuery || '').toLowerCase().split(/\s+/).filter((word) => word.length > 2);
        const relevance = words.reduce((score, word) => score + (haystack.includes(word) ? 1 : 0), 0);
        images.push({ id: file.id, name: file.name, thumb: file.thumbnailLink, folder: folder.path, relevance });
      }
    }
  }
  const filtered = nameQuery && images.some((file) => file.relevance > 0)
    ? images.filter((file) => file.relevance > 0)
    : images;
  return filtered.sort((a, b) => b.relevance - a.relevance).slice(0, 200);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  try {
    const body = req.body || {};
    const mode = String(body.mode || '');
    if (mode === 'gallery_search') {
      const supabaseUrl = process.env.SUPABASE_URL || 'https://caigrloiymgfxubzprbg.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
      if (!supabaseKey) throw new Error('Supabase storage key is not configured');
      const prefixes = ['', 'library'];
      const lists = await Promise.all(prefixes.map(async (prefix) => {
        const response = await fetch(`${supabaseUrl}/storage/v1/object/list/eureka-images`, {
          method: 'POST',
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ prefix, limit: 250, offset: 0, sortBy: { column: 'created_at', order: 'desc' } })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Could not load website gallery');
        return (Array.isArray(data) ? data : []).filter((x) => x.name && x.id).map((x) => {
          const path = prefix ? `${prefix}/${x.name}` : x.name;
          const url = `${supabaseUrl}/storage/v1/object/public/eureka-images/${path}`;
          return { id: path, name: x.name, url, thumb: url };
        });
      }));
      return send(res, 200, { items: lists.flat() });
    }
    if (mode === 'drive_search') {
      const token = await driveToken();
      const folder = process.env.GOOGLE_DRIVE_FOLDER_ID || '';
      const rawQuery = String(body.query || '').trim();
      if (folder) return send(res, 200, { items: await driveFolderImages(token, folder, rawQuery) });
      const query = rawQuery.replace(/'/g, "\\'");
      const clauses = ["mimeType contains 'image/'", 'trashed = false'];
      if (folder) clauses.push(`'${folder}' in parents`);
      if (query) clauses.push(`name contains '${query}'`);
      const params = new URLSearchParams({ q: clauses.join(' and '), fields: 'files(id,name,mimeType,thumbnailLink)', pageSize: '100', orderBy: 'createdTime desc' });
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Drive search failed');
      return send(res, 200, { items: (data.files || []).map((f) => ({ id: f.id, name: f.name, thumb: f.thumbnailLink })) });
    }
    if (mode === 'drive_import') {
      const token = await driveToken();
      const id = encodeURIComponent(String(body.id || ''));
      return send(res, 200, { url: await uploadToEureka(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`, { Authorization: `Bearer ${token}` }, `drive-${id}`) });
    }
    if (mode === 'stock_search') {
      if (!process.env.PIXABAY_API_KEY) throw new Error('Pixabay is not configured yet');
      const params = new URLSearchParams({
        key: process.env.PIXABAY_API_KEY,
        q: String(body.query || 'travel'),
        per_page: '40',
        image_type: 'photo',
        orientation: ['horizontal', 'vertical'].includes(String(body.orientation || '')) ? String(body.orientation) : 'horizontal',
        safesearch: 'true'
      });
      const response = await fetch(`https://pixabay.com/api/?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Stock search failed');
      return send(res, 200, {
        items: (data.hits || []).map((p) => ({
          id: String(p.id),
          name: p.tags || 'Pixabay photo',
          credit: p.user ? `Pixabay / ${p.user}` : 'Pixabay',
          thumb: p.webformatURL,
          url: p.largeImageURL || p.webformatURL,
          sourcePage: p.pageURL
        }))
      });
    }
    if (mode === 'stock_import') return send(res, 200, { url: await uploadToEureka(String(body.url || ''), {}, `pixabay-${body.id || 'photo'}`) });
    return send(res, 400, { error: 'Unsupported image-library action' });
  } catch (error) {
    return send(res, 500, { error: error instanceof Error ? error.message : 'Image-library request failed' });
  }
}
