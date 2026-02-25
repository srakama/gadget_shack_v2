import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { apiClient } from '../../lib/api';
import toast from 'react-hot-toast';
import { requireAdminSSR } from './_guard';

export const getServerSideProps = (ctx) => requireAdminSSR(ctx);

export default function InactiveProductsPage({ serverRole }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = async (p = 1) => {
    try {
      setLoading(true);
      const res = await apiClient.getAdminProductsByStatus({ status: 'inactive', page: p, limit: 20 });
      setItems(res.products || []);
      setPage(res.pagination?.page || p);
      setPages(res.pagination?.pages || 1);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load inactive products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);

  const reactivate = async (id) => {
    try {
      await apiClient.reactivateProduct(id);
      toast.success('Product reactivated');
      load(page);
    } catch (e) {
      console.error(e);
      toast.error('Failed to reactivate');
    }
  };

  return (
    <Layout title="Admin • Inactive Products" serverRole={serverRole}>
      <div className="container" style={{ padding: '2rem 0' }}>
        <h1>Inactive Products</h1>
        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>Products deactivated on last full refresh. You can reactivate individual ones here.</p>
        {loading ? (
          <div>Loading…</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #eee' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #eee' }}>SKU</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #eee' }}>Category</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #eee' }}>Source</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #eee' }}>Updated</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #eee' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f5f5f5' }}>
                      <a href={`/products/${p.id}`} target="_blank" style={{ color: '#2563eb', textDecoration: 'none' }}>
                        {p.name}
                      </a>
                    </td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f5f5f5' }}>{p.sku}</td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f5f5f5' }}>{p.category_name || '-'}</td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f5f5f5' }}>
                      {p.source_url ? (
                        <a
                          href={p.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#f59e0b',
                            textDecoration: 'none',
                            fontSize: '1.2rem',
                            display: 'inline-block'
                          }}
                          title="View original source"
                        >
                          🔗
                        </a>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f5f5f5' }}>{new Date(p.updated_at).toLocaleString()}</td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f5f5f5' }}>
                      <button className="btn btn-primary" onClick={() => reactivate(p.id)}>Reactivate</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <button className="btn" disabled={page <= 1} onClick={() => load(page - 1)}>Prev</button>
          <span>Page {page} of {pages}</span>
          <button className="btn" disabled={page >= pages} onClick={() => load(page + 1)}>Next</button>
        </div>
      </div>
    </Layout>
  );
}

