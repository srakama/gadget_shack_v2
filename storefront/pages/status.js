import { useEffect, useState } from 'react';

const STATUS_API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api')
  .replace(/\/$/, '')
  .replace(/\/api$/, '');

export default function StatusPage() {
  const [status, setStatus] = useState({ health: null, api: null, error: null });

  useEffect(() => {
    let isMounted = true;
    async function check() {
      try {
        const [healthRes, apiRes] = await Promise.all([
          fetch(`${STATUS_API}/health`),
          fetch(`${STATUS_API}/api`),
        ]);
        const health = await healthRes.json().catch(() => ({}));
        const api = await apiRes.json().catch(() => ({}));
        if (isMounted) setStatus({ health, api, error: null });
      } catch (e) {
        if (isMounted) setStatus({ health: null, api: null, error: e.message || String(e) });
      }
    }
    check();
    const id = setInterval(check, 10000);
    return () => { isMounted = false; clearInterval(id); };
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>GadgetShack Status</h1>
      <p>API base: {STATUS_API}</p>
      {status.error && (
        <p style={{ color: 'red' }}>Error: {status.error}</p>
      )}
      <section>
        <h2>Backend Health</h2>
        <pre style={{ background: '#111', color: '#0f0', padding: 12, overflowX: 'auto' }}>
{JSON.stringify(status.health, null, 2)}
        </pre>
      </section>
      <section>
        <h2>API Info</h2>
        <pre style={{ background: '#111', color: '#0f0', padding: 12, overflowX: 'auto' }}>
{JSON.stringify(status.api, null, 2)}
        </pre>
      </section>
    </div>
  );
}

