const ROBOTS = 'noindex, nofollow, noarchive, nosnippet';

function deny() {
  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Eureka Trips Admin"',
      'X-Robots-Tag': ROBOTS,
      'Cache-Control': 'no-store'
    }
  });
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export default function middleware(request) {
  const adminUser = process.env.ADMIN_USER || '';
  const adminPassword = process.env.ADMIN_PASSWORD || '';
  if (!adminUser || !adminPassword) return deny();

  const authorization = request.headers.get('authorization') || '';
  const match = authorization.match(/^Basic\s+(.+)$/i);
  if (!match) return deny();

  let decoded = '';
  try {
    decoded = atob(match[1]);
  } catch (error) {
    return deny();
  }

  const separator = decoded.indexOf(':');
  if (separator < 0) return deny();

  const user = decoded.slice(0, separator);
  const password = decoded.slice(separator + 1);
  if (!timingSafeEqual(user, adminUser) || !timingSafeEqual(password, adminPassword)) {
    return deny();
  }

  return new Response(null, {
    headers: {
      'x-middleware-next': '1',
      'X-Robots-Tag': ROBOTS,
      'Cache-Control': 'no-store'
    }
  });
}

export const config = {
  matcher: ['/admin.html']
};
