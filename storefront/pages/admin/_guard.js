function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function requireAdminSSR(ctx) {
  const { req } = ctx;
  const cookies = req.headers.cookie || '';
  const tokenMatch = cookies.match(/(?:^|; )auth_token=([^;]+)/);
  const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;

  if (!token) {
    return { redirect: { destination: '/login?redirect=' + encodeURIComponent(ctx.resolvedUrl || '/admin'), permanent: false } };
  }

  const payload = decodeJwtPayload(token);
  if (payload && payload.role === 'admin') {
    return { props: { serverRole: 'admin' } };
  }

  return { redirect: { destination: '/login?redirect=' + encodeURIComponent(ctx.resolvedUrl || '/admin'), permanent: false } };
}

export default function AdminGuardPage() {
  return null;
}

