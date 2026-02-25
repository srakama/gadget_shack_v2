import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { apiClient } from '../../lib/api';
import toast from 'react-hot-toast';

import { requireAdminSSR } from './_guard';

export const getServerSideProps = (ctx) => requireAdminSSR(ctx);

export default function AdminDashboard({ serverRole }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Try to access admin stats to verify admin access
      const data = await apiClient.getAdminStats();
      setStats(data.stats);
      setIsAdmin(true);
    } catch (error) {
      console.error('Admin access denied:', error);
      toast.error('Admin access required');
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Admin Dashboard - GadgetShack">
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading admin dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout title="Access Denied - GadgetShack">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <h1>Access Denied</h1>
            <p>You need admin privileges to access this page.</p>
            <p>Please log in with an admin account.</p>
            <a href="/login" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Login
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Dashboard - GadgetShack">
      <div className="container">
        <h1 style={{ marginBottom: '2rem' }}>Admin Dashboard</h1>

        {/* Stats Overview */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1rem',
          marginBottom: '3rem'
        }}>
          <div style={{ 
            background: '#f8f9fa', 
            padding: '1.5rem', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#2563eb', fontSize: '2rem', marginBottom: '0.5rem' }}>
              {stats?.products?.total_products || 0}
            </h3>
            <p>Total Products</p>
            <small style={{ color: '#666' }}>
              {stats?.products?.active_products || 0} active, {stats?.products?.inactive_products || 0} inactive
            </small>
          </div>

          <div style={{ 
            background: '#f8f9fa', 
            padding: '1.5rem', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#16a34a', fontSize: '2rem', marginBottom: '0.5rem' }}>
              {stats?.orders?.total_orders || 0}
            </h3>
            <p>Total Orders</p>
            <small style={{ color: '#666' }}>
              {stats?.orders?.pending_orders || 0} pending, {stats?.orders?.delivered_orders || 0} delivered
            </small>
          </div>

          <div style={{ 
            background: '#f8f9fa', 
            padding: '1.5rem', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#dc2626', fontSize: '2rem', marginBottom: '0.5rem' }}>
              ${(stats?.orders?.total_revenue || 0).toFixed(2)}
            </h3>
            <p>Total Revenue</p>
          </div>

          <div style={{ 
            background: '#f8f9fa', 
            padding: '1.5rem', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#7c3aed', fontSize: '2rem', marginBottom: '0.5rem' }}>
              {stats?.users?.total_users || 0}
            </h3>
            <p>Total Users</p>
            <small style={{ color: '#666' }}>
              {stats?.users?.customer_users || 0} customers, {stats?.users?.admin_users || 0} admins
            </small>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Quick Actions</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a href="/admin/products" className="btn btn-primary">
              📦 Manage Products
            </a>
            <a href="/admin/orders" className="btn btn-primary">
              🛒 View Orders
            </a>
            <a href="/admin/users" className="btn btn-primary">
              👥 Manage Users
            </a>
            <a href="/admin/analytics" className="btn btn-primary">
              📊 Analytics
            </a>
            <a href="/admin/products-inactive" className="btn btn-secondary">
              ⚠️ Inactive Products
            </a>
            <a href="/admin/refresh" className="btn btn-secondary">
              🔄 Refresh Data
            </a>
            <a href="/products" className="btn btn-secondary">
              🏪 View Storefront
            </a>
          </div>
        </div>

        {/* Recent Orders */}
        {stats?.recent_orders && stats.recent_orders.length > 0 && (
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Recent Orders</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                background: 'white',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <thead style={{ background: '#f8f9fa' }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>Order ID</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>Customer</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>Amount</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>Items</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_orders.map((order) => (
                    <tr key={order.id}>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #f1f1f1' }}>#{order.id}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #f1f1f1' }}>{order.customer_email}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #f1f1f1' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '0.8rem',
                          background: order.status === 'delivered' ? '#dcfce7' : 
                                     order.status === 'shipped' ? '#dbeafe' :
                                     order.status === 'processing' ? '#fef3c7' : '#fee2e2',
                          color: order.status === 'delivered' ? '#166534' : 
                                 order.status === 'shipped' ? '#1e40af' :
                                 order.status === 'processing' ? '#92400e' : '#dc2626'
                        }}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #f1f1f1' }}>${order.total_amount}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #f1f1f1' }}>{order.item_count}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #f1f1f1' }}>
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Low Stock Products */}
        {stats?.low_stock_products && stats.low_stock_products.length > 0 && (
          <div>
            <h2 style={{ marginBottom: '1rem' }}>Low Stock Alert</h2>
            <div style={{ 
              background: '#fef3c7', 
              border: '1px solid #f59e0b', 
              borderRadius: '8px', 
              padding: '1rem' 
            }}>
              <p style={{ marginBottom: '1rem', color: '#92400e' }}>
                ⚠️ The following products are running low on stock:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {stats.low_stock_products.map((product) => (
                  <div key={product.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    background: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px'
                  }}>
                    <span>
                      <strong>{product.name}</strong> (SKU: {product.sku})
                    </span>
                    <span style={{ 
                      color: product.stock_quantity === 0 ? '#dc2626' : '#ea580c',
                      fontWeight: 'bold'
                    }}>
                      {product.stock_quantity} left
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
