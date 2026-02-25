import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { apiClient } from '../../lib/api';
import toast from 'react-hot-toast';

import { requireAdminSSR } from './_guard';

export const getServerSideProps = (ctx) => requireAdminSSR(ctx);

export default function AdminRefreshPage({ serverRole }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logTail, setLogTail] = useState([]);

  const loadStatus = async () => {
    try {
      const data = await apiClient.getRefreshStatus();
      setStatus(data);
      const tail = await apiClient.getRefreshLogTail();
      if (tail && tail.lines) setLogTail(tail.lines);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load refresh status');
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  // Auto-refresh while running
  useEffect(() => {
    if (!status || status.status === 'completed') return;
    const id = setInterval(loadStatus, 5000);
    return () => clearInterval(id);
  // Notify header to refresh inactive count when a refresh completes
  useEffect(() => {
    if (status?.status === 'completed') {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refresh:completed'));
      }
    }
  }, [status?.status]);

  }, [status?.status]);

  const triggerRefresh = async () => {
    try {
      setLoading(true);
      await apiClient.refreshNow();
      toast.success('Refresh started! This may take a minute.');
      // Poll for status after short delay
      setTimeout(loadStatus, 4000);
    } catch (e) {
      console.error(e);
      toast.error('Failed to start refresh');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Admin • Data Refresh">
      <div className="container" style={{ padding: '2rem 0' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1rem' }}>
          Admin • Data Refresh
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          Trigger a Shopify re-scrape from TechMarkIt and import into the database.
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button className="btn btn-primary" onClick={triggerRefresh} disabled={loading}>
            {loading ? 'Starting…' : 'Run Refresh Now'}
          </button>
          <button className="btn btn-secondary" onClick={loadStatus}>
            Check Status
          </button>
          <button className="btn" onClick={async () => {
            try {
              setLoading(true);
              await apiClient.refreshNow(/* default */);
              toast.success('Refresh started');
            } finally { setLoading(false); }
          }}>Run (Incremental)</button>
          <button className="btn" onClick={async () => {
            try {
              if (!confirm('Run a FULL refresh now? This may deactivate products removed upstream.')) return;
              setLoading(true);
              await apiClient.refreshNow({ full: true });
              toast.success('Full refresh started');
            } finally { setLoading(false); }
          }}>Force Full Refresh</button>
        </div>

        <div style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <h3 style={{ margin: 0, marginBottom: '0.75rem' }}>Last Refresh Status</h3>
          {status ? (
            <ul style={{ margin: 0, paddingLeft: '1rem' }}>
              <li>Status: {status.status}</li>
              {status.total_products != null && (
                <li>Total Products: {status.total_products}</li>
              )}
              {status.log_file && (
                <li>Log File: {status.log_file}</li>
              )}
              {status.started_at && (
                <li>Started: {status.started_at}</li>
              )}
              {status.completed_at && (
                <li>Completed: {status.completed_at}</li>
              )}
              {status.last_full_refresh_at && (
                <li>Last Full Refresh: {status.last_full_refresh_at}</li>
              )}
              {status.started_at && status.completed_at && (
                <li>
                  Duration: {
                    (() => {
                      const start = new Date(status.started_at);
                      const end = new Date(status.completed_at);
                      const ms = Math.max(0, end - start);
                      const mm = Math.floor(ms / 60000);
                      const ss = Math.floor((ms % 60000) / 1000);
                      return `${mm}m ${ss}s`;
                    })()
                  }
                </li>
              )}
            </ul>
          ) : (
            <div>No status available.</div>
          )}
        </div>

        <div style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '1rem'
        }}>
          <h3 style={{ margin: 0, marginBottom: '0.75rem' }}>Latest Log Tail</h3>
          {logTail.length > 0 ? (
            <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto', margin: 0 }}>
              {logTail.join('\n')}
            </pre>
          ) : (
            <div>No log lines available.</div>
          )}
        </div>
      </div>
    </Layout>
  );
}

