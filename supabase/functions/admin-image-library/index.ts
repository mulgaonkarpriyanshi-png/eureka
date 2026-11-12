import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

function base64url(input: Uint8Array | string) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  bytes.forEach((b) => binary += String.fromCharCode(b));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function driveToken() {
  const email = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const rawKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");
  if (!email || !rawKey) throw new Error("Google Drive credentials are not configured");
  const key = rawKey.replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(JSON.stringify({ iss: email, scope: "https://www.googleapis.com/auth/drive.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const pem = key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(`${header}.${claims}`));
  const assertion = `${header}.${claims}.${base64url(new Uint8Array(signature))}`;
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || "Could not authenticate Google Drive");
  return data.access_token as string;
}

async function importToStorage(sourceUrl: string, headers: Record<string, string>, filename: string) {
  const source = await fetch(sourceUrl, { headers });
  if (!source.ok) throw new Error("Could not download the selected image");
  const bytes = await source.arrayBuffer();
  const type = source.headers.get("content-type") || "image/jpeg";
  const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
  const path = `library/${Date.now()}-${filename.replace(/[^a-z0-9-]/gi, "-").slice(0, 42)}.${ext}`;
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error } = await supabase.storage.from("eureka-images").upload(path, bytes, { contentType: type, upsert: false });
  if (error) throw error;
  return supabase.storage.from("eureka-images").getPublicUrl(path).data.publicUrl;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const body = await req.json();
    const mode = String(body.mode || "");
    if (mode === "drive_search") {
      const token = await driveToken();
      const folder = Deno.env.get("GOOGLE_DRIVE_FOLDER_ID") || "";
      const query = String(body.query || "").replace(/'/g, "\\'");
      const clauses = ["mimeType contains 'image/'", "trashed = false"];
      if (folder) clauses.push(`'${folder}' in parents`);
      if (query) clauses.push(`name contains '${query}'`);
      const params = new URLSearchParams({ q: clauses.join(" and "), fields: "files(id,name,mimeType,thumbnailLink,webContentLink)", pageSize: "100", orderBy: "createdTime desc" });
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Drive search failed");
      return json({ items: (data.files || []).map((f: any) => ({ id: f.id, name: f.name, thumb: f.thumbnailLink })) });
    }
    if (mode === "drive_import") {
      const token = await driveToken();
      const id = encodeURIComponent(String(body.id || ""));
      const url = await importToStorage(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`, { Authorization: `Bearer ${token}` }, `drive-${id}`);
      return json({ url });
    }
    if (mode === "stock_search") {
      const key = Deno.env.get("PEXELS_API_KEY");
      if (!key) throw new Error("Pexels is not configured yet");
      const params = new URLSearchParams({ query: String(body.query || "travel"), per_page: "40", orientation: "landscape" });
      const response = await fetch(`https://api.pexels.com/v1/search?${params}`, { headers: { Authorization: key } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Stock search failed");
      return json({ items: (data.photos || []).map((p: any) => ({ id: String(p.id), name: p.alt || "Pexels photo", credit: p.photographer, thumb: p.src.medium, url: p.src.large2x })) });
    }
    if (mode === "stock_import") {
      const url = await importToStorage(String(body.url || ""), {}, `pexels-${body.id || "photo"}`);
      return json({ url });
    }
    return json({ error: "Unsupported image-library action" }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Image-library request failed" }, 500);
  }
});
