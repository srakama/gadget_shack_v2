import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { apiClient, formatPrice, formatDate } from '../../lib/api';
import toast from 'react-hot-toast';
import { requireAdminSSR } from './_guard';

export const getServerSideProps = (ctx) => requireAdminSSR(ctx);

export default function AdminOrdersPage({ serverRole }) {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      
      const data = await apiClient.getAdminOrders(params);
      setOrders(data.orders || []);
      setPages(data.pagination?.pages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await apiClient.updateOrderStatus(orderId, newStatus);
      toast.success('Order status updated successfully');
      loadOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending: '#fbbf24',
      processing: '#3b82f6',
      shipped: '#8b5cf6',
      delivered: '#10b981',
      cancelled: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  return (
    <Layout title="Admin • Orders" serverRole={serverRole}>
      <div className="container" style={{ padding: '2rem 0' }}>
        <h1 style={{ marginBottom: '2rem' }}>Order Management</h1>

        {/* Filters */}
        <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label>Filter by Status:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <span style={{ marginLeft: 'auto', color: '#666' }}>
            Total: {total} orders
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner"></div>
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <p>No orders found</p>
          </div>
        ) : (
          <>
            {/* Orders Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Order ID</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Customer</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Items</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '1rem' }}>
                        <strong>#{order.id}</strong>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div>{order.first_name} {order.last_name}</div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>{order.customer_email}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {formatDate(order.created_at)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>
                        {formatPrice(order.total_amount)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {order.item_count}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          background: getStatusBadgeColor(order.status) + '20',
                          color: getStatusBadgeColor(order.status),
                        }}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            fontSize: '0.875rem'
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-secondary"
                  style={{ opacity: page === 1 ? 0.5 : 1 }}
                >
                  Previous
                </button>
                <span style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center' }}>
                  Page {page} of {pages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="btn btn-secondary"
                  style={{ opacity: page === pages ? 0.5 : 1 }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Back to Dashboard */}
        <div style={{ marginTop: '2rem' }}>
          <a href="/admin" className="btn btn-secondary">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </Layout>
  );
}

