const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const allowedEvents = new Set(['PageView', 'ViewContent', 'Lead', 'Contact']);

function clean(value: unknown, maxLength = 500): string {
  return String(value ?? '').trim().slice(0, maxLength);
}

function normalizeEmail(value: unknown): string {
  return clean(value, 160).toLowerCase();
}

function normalizePhone(value: unknown): string {
  return clean(value, 40).replace(/\D/g, '');
}

function normalizeName(value: unknown): string {
  return clean(value, 120).toLowerCase().replace(/[^a-z]/g, '');
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function addHashed(target: Record<string, string[]>, key: string, value: string) {
  if (value) target[key] = [await sha256(value)];
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const pixelId = Deno.env.get('META_PIXEL_ID');
    const accessToken = Deno.env.get('META_ACCESS_TOKEN');
    if (!pixelId || !accessToken) throw new Error('Meta credentials are not configured');

    const input = await request.json();
    const eventName = clean(input.event_name, 40);
    const eventId = clean(input.event_id, 120);
    const sourceUrl = clean(input.event_source_url, 1000);

    if (!allowedEvents.has(eventName) || !eventId || !sourceUrl) {
      return new Response(JSON.stringify({ error: 'Invalid event payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const suppliedUser = input.user_data || {};
    const userData: Record<string, string | string[]> = {};
    const forwardedFor = clean(request.headers.get('x-forwarded-for'), 200).split(',')[0].trim();
    const userAgent = clean(input.user_agent || request.headers.get('user-agent'), 500);
    const fbp = clean(input.fbp, 200);
    const fbc = clean(input.fbc, 200);

    if (forwardedFor) userData.client_ip_address = forwardedFor;
    if (userAgent) userData.client_user_agent = userAgent;
    if (fbp) userData.fbp = fbp;
    if (fbc) userData.fbc = fbc;
    await addHashed(userData as Record<string, string[]>, 'em', normalizeEmail(suppliedUser.email));
    await addHashed(userData as Record<string, string[]>, 'ph', normalizePhone(suppliedUser.phone));

    const nameParts = clean(suppliedUser.name, 120).split(/\s+/).filter(Boolean);
    await addHashed(userData as Record<string, string[]>, 'fn', normalizeName(nameParts[0]));
    await addHashed(userData as Record<string, string[]>, 'ln', normalizeName(nameParts.slice(1).join('')));

    const customData = input.custom_data && typeof input.custom_data === 'object'
      ? input.custom_data
      : {};
    const eventTime = Number(input.event_time) || Math.floor(Date.now() / 1000);
    const payload = {
      data: [{
        event_name: eventName,
        event_time: eventTime,
        event_id: eventId,
        action_source: 'website',
        event_source_url: sourceUrl,
        user_data: userData,
        custom_data: customData,
      }],
    };

    const response = await fetch(
      `https://graph.facebook.com/v22.0/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    const result = await response.json();

    if (!response.ok) {
      console.error('Meta Conversions API rejected event', result);
      return new Response(JSON.stringify({ error: 'Meta rejected the event' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, events_received: result.events_received ?? 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('meta-conversions failed', error);
    return new Response(JSON.stringify({ error: 'Conversion event failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
