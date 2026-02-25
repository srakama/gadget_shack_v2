import { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { apiClient } from '../../lib/api';
import toast from 'react-hot-toast';
import { requireAdminSSR } from './_guard';

export const getServerSideProps = (ctx) => requireAdminSSR(ctx);

export default function AdminProductsPage({ serverRole }) {
  const [status, setStatus] = useState('active');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [inactiveCount, setInactiveCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');


  const load = async (p = 1, s = status, q = '', categoryId = '') => {
    try {
      setLoading(true);
      const params = { status: s, page: p, limit: 20 };
      if (q) params.q = q;
      if (categoryId) params.category_id = categoryId;
      const res = await apiClient.getAdminProductsByStatus(params);
      setItems(res.products || []);
      setPage(res.pagination?.page || p);
      setPages(res.pagination?.pages || 1);
      // Fetch inactive count for badge
      const inactive = await apiClient.getAdminProductsByStatus({ status: 'inactive', page: 1, limit: 1 });
      setInactiveCount(inactive.pagination?.total || 0);
      setSelected(new Set());
    } catch (e) {
      console.error(e);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    (async () => {
      try {
        const cats = await apiClient.getCategories();
        setCategories(cats.categories || cats);
      } catch {}
    })();
  }, []);


  useEffect(() => { load(1, status); }, [status]);

  const toggle = (id) => {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const bulkReactivate = async () => {
    try {
      const ids = Array.from(selected);
      if (ids.length === 0) return toast('No products selected');
      await apiClient.bulkReactivateProducts(ids);
      toast.success(`Reactivated ${ids.length} product(s)`);
      load(page, status);
    } catch (e) {
      console.error(e);
      toast.error('Bulk reactivate failed');
    }
  };

  const bulkFeature = async () => {
    try {
      const ids = Array.from(selected);
      if (ids.length === 0) return toast('No products selected');
      await apiClient.bulkFeatureProducts(ids);
      toast.success(`Featured ${ids.length} product(s)`);
      load(page, status);
    } catch (e) {
      console.error(e);
      toast.error('Bulk feature failed');
    }
  };

  const toggleFeatured = async (id, isFeatured) => {
    try {
      if (isFeatured) {
        await apiClient.unfeatureProduct(id);
        toast.success('Product unfeatured');
      } else {
        await apiClient.featureProduct(id);
        toast.success('Product featured');
      }
      load(page, status);
    } catch (e) {
      console.error(e);
      toast.error('Failed to toggle featured');
    }
  };

  return (
    <Layout title="Admin • Products" serverRole={serverRole}>
      <div className="container" style={{ padding: '2rem 0' }}>
        <h1>Products</h1>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <label>Status:</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); load(1, status, '', e.target.value); }}>
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input type="text" placeholder="Search by name or SKU" onChange={(e) => load(1, status, e.target.value, categoryId)} style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: 6 }} />
          {inactiveCount > 0 && (
            <span style={{ background: '#fee2e2', color: '#dc2626', padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.8rem' }}>
              {inactiveCount} inactive
            </span>
          )}
          <button className="btn" onClick={bulkFeature} disabled={selected.size === 0}>
            ⭐ Feature Selected ({selected.size})
          </button>
          {status === 'inactive' && (
            <button className="btn btn-primary" onClick={bulkReactivate} disabled={selected.size === 0}>
              Bulk Reactivate ({selected.size})
            </button>
          )}
        </div>

        {loading ? (
          <div>Loading…</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}></th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #eee' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #eee' }}>SKU</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #eee' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #eee' }}>Featured</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #eee' }}>Source</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #eee' }}>Updated</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f5f5f5' }}>
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
                    </td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f5f5f5' }}>
                      <a href={`/products/${p.id}`} target="_blank" style={{ color: '#2563eb', textDecoration: 'none' }}>
                        {p.name}
                      </a>
                    </td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f5f5f5' }}>{p.sku}</td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f5f5f5' }}>{p.status}</td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f5f5f5' }}>
                      <button className="btn" onClick={() => toggleFeatured(p.id, !!p.featured)} title={p.featured ? 'Unfeature' : 'Feature'}>
                        {p.featured ? '⭐' : '☆'}
                      </button>
                    </td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <button className="btn" disabled={page <= 1} onClick={() => load(page - 1, status)}>Prev</button>
          <span>Page {page} of {pages}</span>
          <button className="btn" disabled={page >= pages} onClick={() => load(page + 1, status)}>Next</button>
        </div>
      </div>
    </Layout>
  );
}

