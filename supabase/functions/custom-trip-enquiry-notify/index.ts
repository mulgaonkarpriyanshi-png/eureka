const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function clean(value: unknown, maxLength = 500): string {
  return String(value ?? '').trim().slice(0, maxLength);
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
    const data = await request.json();
    const name = clean(data.name, 120);
    const email = clean(data.email, 160);
    const phone = clean(data.phone, 40);

    if (!name || !email || !phone) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accessKey = Deno.env.get('WEB3FORMS_KEY');
    if (!accessKey) throw new Error('WEB3FORMS_KEY is not configured');

    const details = [
      `Trip type: ${clean(data.trip_type) || 'Not specified'}`,
      `Travel window: ${clean(data.travel_window) || 'Not specified'}`,
      `Travelling with: ${clean(data.travelling_with) || 'Not specified'}`,
      `Occasion: ${clean(data.occasion) || 'Not specified'}`,
      `Trip scope: ${clean(data.trip_scope) || 'Not specified'}`,
      `Destination: ${clean(data.destination_note) || 'Not specified'}`,
      `Contact preference: ${clean(data.contact_preference) || 'Not specified'}`,
      `Preferred call time: ${clean(data.call_time_preference) || 'Not specified'}`,
      `Lead tier: ${clean(data.lead_tier) || 'Not specified'}`,
      `Message: ${clean(data.message, 1000) || 'None'}`,
    ].join('\n');

    const notification = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `New custom trip enquiry from ${name}`,
        from_name: 'Eureka Trips Website',
        name,
        email,
        phone,
        message: details,
      }),
    });

    const result = await notification.json();
    if (!notification.ok || !result.success) {
      throw new Error(result.message || 'Email provider rejected the notification');
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('custom-trip-enquiry-notify failed', error);
    return new Response(JSON.stringify({ error: 'Notification failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
