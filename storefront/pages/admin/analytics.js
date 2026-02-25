import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { apiClient, formatPrice, formatDate } from '../../lib/api';
import toast from 'react-hot-toast';
import { requireAdminSSR } from './_guard';

export const getServerSideProps = (ctx) => requireAdminSSR(ctx);

export default function AdminAnalyticsPage({ serverRole }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getAnalyticsDashboard({ period });
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Admin • Analytics" serverRole={serverRole}>
        <div className="container" style={{ padding: '2rem 0' }}>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner"></div>
            <p>Loading analytics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin • Analytics" serverRole={serverRole}>
      <div className="container" style={{ padding: '2rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>Analytics Dashboard</h1>
          <select 
            value={period} 
            onChange={(e) => setPeriod(Number(e.target.value))}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1rem',
          marginBottom: '3rem'
        }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            padding: '1.5rem', 
            borderRadius: '8px',
            color: 'white',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
              {formatPrice(analytics?.sales?.totalRevenue || 0)}
            </h3>
            <p style={{ opacity: 0.9 }}>Total Revenue</p>
            <small style={{ opacity: 0.8 }}>
              {analytics?.sales?.totalOrders || 0} orders
            </small>
          </div>

          <div style={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
            padding: '1.5rem', 
            borderRadius: '8px',
            color: 'white',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
              {formatPrice(analytics?.sales?.averageOrderValue || 0)}
            </h3>
            <p style={{ opacity: 0.9 }}>Average Order Value</p>
          </div>

          <div style={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
            padding: '1.5rem', 
            borderRadius: '8px',
            color: 'white',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
              {analytics?.customers?.totalCustomers || 0}
            </h3>
            <p style={{ opacity: 0.9 }}>Total Customers</p>
            <small style={{ opacity: 0.8 }}>
              {analytics?.customers?.newCustomers || 0} new
            </small>
          </div>

          <div style={{ 
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', 
            padding: '1.5rem', 
            borderRadius: '8px',
            color: 'white',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
              {analytics?.inventory?.totalProducts || 0}
            </h3>
            <p style={{ opacity: 0.9 }}>Total Products</p>
            <small style={{ opacity: 0.8 }}>
              {analytics?.inventory?.lowStockCount || 0} low stock
            </small>
          </div>
        </div>

        {/* Top Products */}
        {analytics?.sales?.topProducts && analytics.sales.topProducts.length > 0 && (
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Top Selling Products</h2>
            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Product</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Units Sold</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.sales.topProducts.map((product, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '1rem' }}>
                        <strong>{product.name}</strong>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>SKU: {product.sku}</div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {product.total_sold}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>
                        {formatPrice(product.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sales by Day */}
        {analytics?.sales?.salesByDay && analytics.sales.salesByDay.length > 0 && (
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Daily Sales</h2>
            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Orders</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.sales.salesByDay.slice(0, 10).map((day, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '1rem' }}>
                        {formatDate(day.date)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {day.orders}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>
                        {formatPrice(day.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Customer Analytics */}
        {analytics?.customers && (
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Customer Insights</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px' }}>
                <h3 style={{ color: '#2563eb', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                  {analytics.customers.repeatCustomers || 0}
                </h3>
                <p>Repeat Customers</p>
              </div>
              <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px' }}>
                <h3 style={{ color: '#2563eb', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                  {formatPrice(analytics.customers.averageCustomerValue || 0)}
                </h3>
                <p>Avg Customer Value</p>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Status */}
        {analytics?.inventory && (
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Inventory Status</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px' }}>
                <h3 style={{ color: '#10b981', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                  {analytics.inventory.inStockCount || 0}
                </h3>
                <p>In Stock</p>
              </div>
              <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px' }}>
                <h3 style={{ color: '#f59e0b', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                  {analytics.inventory.lowStockCount || 0}
                </h3>
                <p>Low Stock</p>
              </div>
              <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px' }}>
                <h3 style={{ color: '#ef4444', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                  {analytics.inventory.outOfStockCount || 0}
                </h3>
                <p>Out of Stock</p>
              </div>
            </div>
          </div>
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

