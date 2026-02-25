import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import ConfirmationModal from '../components/ConfirmationModal';
import { apiClient, formatPrice, formatDate } from '../lib/api';
import toast from 'react-hot-toast';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login?redirect=/orders');
        return;
      }

      const response = await apiClient.getOrders();
      setOrders(response.orders || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      if (error.message.includes('401')) {
        localStorage.removeItem('auth_token');
        router.push('/login?redirect=/orders');
      } else {
        toast.error('Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrderClick = (orderId) => {
    setOrderToCancel(orderId);
    setShowCancelModal(true);
  };

  const handleCancelOrderConfirm = async () => {
    if (!orderToCancel) return;

    try {
      setCancellingOrder(orderToCancel);
      setShowCancelModal(false);

      await apiClient.cancelOrder(orderToCancel);

      // Update the order status in the local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderToCancel
            ? { ...order, status: 'cancelled' }
            : order
        )
      );

      toast.success('Order cancelled successfully');

    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error.response?.data?.error || 'Failed to cancel order');
    } finally {
      setCancellingOrder(null);
      setOrderToCancel(null);
    }
  };

  const handleCancelModalClose = () => {
    setShowCancelModal(false);
    setOrderToCancel(null);
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

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const orderStatuses = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (loading) {
    return (
      <Layout title="My Orders - GadgetShack South Africa">
        <div className="container" style={{ padding: '2rem 0', textAlign: 'center' }}>
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading your orders...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Orders - GadgetShack South Africa">
      <div className="container" style={{ padding: '2rem 0' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h1>My Orders</h1>
          <Link href="/products">
            <button className="btn btn-primary">
              Continue Shopping
            </button>
          </Link>
        </div>

        {/* Filter Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem',
          marginBottom: '2rem',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '1rem'
        }}>
          {orderStatuses.map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '6px',
                background: filter === status ? '#2563eb' : '#f3f4f6',
                color: filter === status ? 'white' : '#374151',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                textTransform: 'capitalize'
              }}
            >
              {status} {status === 'all' ? `(${orders.length})` : `(${orders.filter(o => o.status === status).length})`}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem 2rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <h2 style={{ marginBottom: '1rem', color: '#374151' }}>
              {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              {filter === 'all' 
                ? 'Start shopping to see your orders here!'
                : `You don't have any ${filter} orders at the moment.`
              }
            </p>
            <Link href="/products">
              <button className="btn btn-primary">
                Browse Products
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {filteredOrders.map((order) => (
              <div key={order.id} style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                {/* Order Header */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <div>
                    <h3 style={{ 
                      margin: '0 0 0.5rem 0', 
                      color: '#374151',
                      fontSize: '1.2rem'
                    }}>
                      Order #{order.id}
                    </h3>
                    <div style={{ 
                      display: 'flex', 
                      gap: '1rem',
                      fontSize: '0.9rem',
                      color: '#6b7280'
                    }}>
                      <span>📅 {formatDate(order.created_at)}</span>
                      <span>📦 {order.items?.length || 0} items</span>
                      <span>💳 {order.payment_method}</span>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: '1.3rem', 
                      fontWeight: 'bold',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      {formatPrice(order.total_amount)}
                    </div>
                    <div style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      ...getStatusColor(order.status)
                    }}>
                      {order.status}
                    </div>
                  </div>
                </div>

                {/* Order Items Preview */}
                {order.items && order.items.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ 
                      margin: '0 0 1rem 0', 
                      color: '#374151',
                      fontSize: '1rem'
                    }}>
                      Items Ordered
                    </h4>
                    <div style={{ 
                      display: 'grid', 
                      gap: '0.75rem',
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      {order.items.map((item, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          padding: '0.75rem',
                          backgroundColor: '#f9fafb',
                          borderRadius: '6px'
                        }}>
                          {item.image && (
                            <img 
                              src={item.image}
                              alt={item.name}
                              style={{
                                width: '50px',
                                height: '50px',
                                objectFit: 'cover',
                                borderRadius: '4px'
                              }}
                            />
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontWeight: '500',
                              color: '#374151',
                              fontSize: '0.9rem'
                            }}>
                              {item.name}
                            </div>
                            <div style={{ 
                              fontSize: '0.8rem',
                              color: '#6b7280'
                            }}>
                              Qty: {item.quantity} × {formatPrice(item.price)}
                            </div>
                          </div>
                          <div style={{ 
                            fontWeight: '600',
                            color: '#374151'
                          }}>
                            {formatPrice(item.price * item.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shipping Information */}
                {order.shipping_address && (
                  <div style={{ 
                    backgroundColor: '#f0f9ff',
                    padding: '1rem',
                    borderRadius: '6px',
                    marginBottom: '1rem'
                  }}>
                    <h4 style={{ 
                      margin: '0 0 0.5rem 0', 
                      color: '#0369a1',
                      fontSize: '0.9rem'
                    }}>
                      🚚 Shipping Address
                    </h4>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.85rem',
                      color: '#0369a1'
                    }}>
                      {order.shipping_address}
                    </p>
                  </div>
                )}

                {/* Tracking Information */}
                {order.tracking_number && (
                  <div style={{ 
                    backgroundColor: '#f0fdf4',
                    padding: '1rem',
                    borderRadius: '6px',
                    marginBottom: '1rem'
                  }}>
                    <h4 style={{ 
                      margin: '0 0 0.5rem 0', 
                      color: '#166534',
                      fontSize: '0.9rem'
                    }}>
                      📍 Tracking Information
                    </h4>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.85rem',
                      color: '#166534',
                      fontFamily: 'monospace'
                    }}>
                      Tracking Number: {order.tracking_number}
                    </p>
                  </div>
                )}

                {/* Order Actions */}
                <div style={{ 
                  display: 'flex', 
                  gap: '1rem',
                  justifyContent: 'flex-end',
                  marginTop: '1rem'
                }}>
                  <Link href={`/orders/${order.id}`}>
                    <button className="btn btn-secondary">
                      View Details
                    </button>
                  </Link>
                  
                  {order.status === 'delivered' && (
                    <button className="btn btn-primary">
                      Reorder Items
                    </button>
                  )}
                  
                  {order.status === 'pending' && (
                    <button
                      className="btn btn-secondary"
                      style={{
                        color: '#dc2626',
                        opacity: cancellingOrder === order.id ? 0.6 : 1,
                        cursor: cancellingOrder === order.id ? 'not-allowed' : 'pointer'
                      }}
                      onClick={() => handleCancelOrderClick(order.id)}
                      disabled={cancellingOrder === order.id}
                    >
                      {cancellingOrder === order.id ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Order Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={handleCancelModalClose}
        onConfirm={handleCancelOrderConfirm}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone and you will need to place a new order if you change your mind."
        confirmText="Yes, Cancel Order"
        cancelText="Keep Order"
        confirmStyle="danger"
      />
    </Layout>
  );
}
