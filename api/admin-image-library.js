import crypto from 'node:crypto';

function send(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json').setHeader('Cache-Control', 'no-store').json(body);
}

function b64(value) {
  return Buffer.from(value).toString('base64url');
}

async function driveToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
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
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) throw new Error('Supabase service key is not configured');
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

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  try {
    const body = req.body || {};
    const mode = String(body.mode || '');
    if (mode === 'drive_search') {
      const token = await driveToken();
      const folder = process.env.GOOGLE_DRIVE_FOLDER_ID || '';
      const query = String(body.query || '').replace(/'/g, "\\'");
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
      if (!process.env.PEXELS_API_KEY) throw new Error('Pexels is not configured yet');
      const params = new URLSearchParams({ query: String(body.query || 'travel'), per_page: '40', orientation: 'landscape' });
      const response = await fetch(`https://api.pexels.com/v1/search?${params}`, { headers: { Authorization: process.env.PEXELS_API_KEY } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Stock search failed');
      return send(res, 200, { items: (data.photos || []).map((p) => ({ id: String(p.id), name: p.alt || 'Pexels photo', credit: p.photographer, thumb: p.src.medium, url: p.src.large2x })) });
    }
    if (mode === 'stock_import') return send(res, 200, { url: await uploadToEureka(String(body.url || ''), {}, `pexels-${body.id || 'photo'}`) });
    return send(res, 400, { error: 'Unsupported image-library action' });
  } catch (error) {
    return send(res, 500, { error: error instanceof Error ? error.message : 'Image-library request failed' });
  }
}
