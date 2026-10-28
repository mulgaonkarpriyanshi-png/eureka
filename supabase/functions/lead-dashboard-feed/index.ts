const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-dashboard-token',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  const expectedToken = Deno.env.get('DASHBOARD_READ_TOKEN');
  const suppliedToken = request.headers.get('x-dashboard-token') || '';
  if (!expectedToken || suppliedToken !== expectedToken) return json({ error: 'Unauthorized' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Server configuration missing' }, 500);

  const requestUrl = new URL(request.url);
  const requestedLimit = Number(requestUrl.searchParams.get('limit') || 250);
  const limit = Math.max(1, Math.min(1000, Number.isFinite(requestedLimit) ? requestedLimit : 250));
  const metaOnly = requestUrl.searchParams.get('utm_source') === 'meta';
  const query = new URLSearchParams({
    select: '*',
    order: 'created_at.desc',
    limit: String(limit),
  });
  if (metaOnly) query.set('utm_source', 'eq.meta');

  const response = await fetch(`${supabaseUrl}/rest/v1/website_leads_dashboard?${query}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });
  const result = await response.json();
  if (!response.ok) {
    console.error('lead-dashboard-feed query failed', result);
    return json({ error: 'Lead feed unavailable' }, 502);
  }

  return json({ leads: result });
});
