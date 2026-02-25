import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { apiClient, formatPrice, formatDate } from '../../lib/api';
import toast from 'react-hot-toast';

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login?redirect=/orders/' + id);
        return;
      }

      const response = await apiClient.getOrder(id);
      setOrder(response.order);
    } catch (error) {
      console.error('Error loading order:', error);
      if (error.message.includes('401')) {
        localStorage.removeItem('auth_token');
        router.push('/login?redirect=/orders/' + id);
      } else if (error.message.includes('404')) {
        toast.error('Order not found');
        router.push('/orders');
      } else {
        toast.error('Failed to load order details');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return { bg: '#fef3c7', color: '#92400e' };
      case 'processing':
        return { bg: '#dbeafe', color: '#1e40af' };
      case 'shipped':
        return { bg: '#e0e7ff', color: '#5b21b6' };
      case 'delivered':
        return { bg: '#dcfce7', color: '#166534' };
      case 'cancelled':
        return { bg: '#fee2e2', color: '#dc2626' };
      default:
        return { bg: '#f3f4f6', color: '#374151' };
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.125rem' }}>Loading order details...</div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Order Not Found</h1>
          <p style={{ marginBottom: '2rem', color: '#6b7280' }}>
            The order you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Link href="/orders" style={{ 
            color: '#2563eb', 
            textDecoration: 'underline',
            fontSize: '1rem'
          }}>
            ← Back to Orders
          </Link>
        </div>
      </Layout>
    );
  }

  const statusStyle = getStatusColor(order.status);

  return (
    <Layout>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/orders" style={{ 
            color: '#2563eb', 
            textDecoration: 'underline',
            fontSize: '0.875rem',
            marginBottom: '1rem',
            display: 'inline-block'
          }}>
            ← Back to Orders
          </Link>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0 }}>
              Order #{order.id}
            </h1>
            <span style={{
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: '500',
              backgroundColor: statusStyle.bg,
              color: statusStyle.color,
              textTransform: 'capitalize'
            }}>
              {order.status}
            </span>
          </div>
        </div>

        {/* Order Info */}
        <div style={{ 
          backgroundColor: '#f9fafb', 
          padding: '1.5rem', 
          borderRadius: '8px', 
          marginBottom: '2rem',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Order Information
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Order Date</div>
              <div style={{ fontWeight: '500' }}>{formatDate(order.created_at)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total Amount</div>
              <div style={{ fontWeight: '500', fontSize: '1.125rem' }}>{formatPrice(order.total_amount)}</div>
            </div>
            {order.shipping_address && (
              <div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Shipping Address</div>
                <div style={{ fontWeight: '500' }}>{order.shipping_address}</div>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div style={{ 
          backgroundColor: 'white', 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            padding: '1.5rem', 
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
              Order Items ({order.items?.length || 0})
            </h2>
          </div>
          
          <div style={{ padding: '1.5rem' }}>
            {order.items && order.items.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {order.items.map((item, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    paddingBottom: '1.5rem',
                    borderBottom: index < order.items.length - 1 ? '1px solid #e5e7eb' : 'none'
                  }}>
                    {/* Product Image */}
                    <div style={{ 
                      width: '80px', 
                      height: '80px', 
                      backgroundColor: '#f3f4f6',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {item.product_images && item.product_images.length > 0 ? (
                        <img 
                          src={item.product_images[0]} 
                          alt={item.product_name}
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover', 
                            borderRadius: '8px' 
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>No Image</span>
                      )}
                    </div>
                    
                    {/* Product Details */}
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        fontSize: '1rem', 
                        fontWeight: '600', 
                        marginBottom: '0.5rem',
                        margin: 0
                      }}>
                        {item.product_name}
                      </h3>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: '#6b7280', 
                        marginBottom: '0.5rem',
                        margin: '0.25rem 0'
                      }}>
                        SKU: {item.product_sku}
                      </p>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          Quantity: {item.quantity}
                        </span>
                        <span style={{ fontSize: '1rem', fontWeight: '600' }}>
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                No items found for this order.
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div style={{ 
          marginTop: '2rem',
          padding: '1.5rem',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            fontSize: '1.25rem',
            fontWeight: '600'
          }}>
            <span>Total</span>
            <span>{formatPrice(order.total_amount)}</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
