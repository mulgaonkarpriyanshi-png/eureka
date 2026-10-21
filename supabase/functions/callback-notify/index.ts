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
    const contact = clean(data.contact, 40);
    const message = clean(data.message, 1000);
    const tourTitle = clean(data.tour_title, 200) || 'Not specified';

    if (!name || !email || !contact || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accessKey = Deno.env.get('WEB3FORMS_KEY');
    if (!accessKey) throw new Error('WEB3FORMS_KEY is not configured');

    const notification = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `New callback request: ${tourTitle}`,
        from_name: 'Eureka Trips Website',
        name,
        email,
        phone: contact,
        tour: tourTitle,
        message: `Preferred callback time: ${message}`,
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
    console.error('callback-notify failed', error);
    return new Response(JSON.stringify({ error: 'Notification failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
