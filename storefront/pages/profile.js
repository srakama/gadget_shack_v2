import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { apiClient, formatPrice, formatDate } from '../lib/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  const southAfricanProvinces = [
    'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
    'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login?redirect=/profile');
        return;
      }

      // Load user profile
      const userResponse = await apiClient.getProfile();
      setUser(userResponse.user);
      setFormData(userResponse.user);

      // Load user orders
      const ordersResponse = await apiClient.getOrders();
      setOrders(ordersResponse.orders || []);

    } catch (error) {
      console.error('Error loading user data:', error);
      if (error.message.includes('401')) {
        localStorage.removeItem('auth_token');
        router.push('/login?redirect=/profile');
      } else {
        toast.error('Failed to load profile data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.updateProfile(formData);
      setUser(response.user);
      setEditMode(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Profile - GadgetShack South Africa">
        <div className="container" style={{ padding: '2rem 0', textAlign: 'center' }}>
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading your profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout title="Profile - GadgetShack South Africa">
        <div className="container" style={{ padding: '2rem 0', textAlign: 'center' }}>
          <h1>Please log in to view your profile</h1>
          <button 
            onClick={() => router.push('/login')}
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
          >
            Go to Login
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Profile - GadgetShack South Africa">
      <div className="container" style={{ padding: '2rem 0' }}>
        <h1 style={{ marginBottom: '2rem' }}>My Account</h1>
        
        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '2rem'
        }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '1rem 2rem',
              border: 'none',
              background: activeTab === 'profile' ? '#2563eb' : 'transparent',
              color: activeTab === 'profile' ? 'white' : '#6b7280',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '1rem 2rem',
              border: 'none',
              background: activeTab === 'orders' ? '#2563eb' : 'transparent',
              color: activeTab === 'orders' ? 'white' : '#6b7280',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Order History ({orders.length})
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div style={{ 
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h2>Profile Information</h2>
              <button
                onClick={() => editMode ? handleSaveProfile() : setEditMode(true)}
                className="btn btn-primary"
                disabled={loading}
              >
                {editMode ? 'Save Changes' : 'Edit Profile'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Personal Information */}
              <div>
                <h3 style={{ marginBottom: '1rem', color: '#374151' }}>Personal Information</h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    First Name
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name || ''}
                      onChange={handleInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  ) : (
                    <p style={{ padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                      {user.first_name}
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Last Name
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name || ''}
                      onChange={handleInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  ) : (
                    <p style={{ padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                      {user.last_name}
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Email Address
                  </label>
                  {editMode ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  ) : (
                    <p style={{ padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                      {user.email}
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Phone Number
                  </label>
                  {editMode ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  ) : (
                    <p style={{ padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                      {user.phone || 'Not provided'}
                    </p>
                  )}
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 style={{ marginBottom: '1rem', color: '#374151' }}>Address Information</h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Street Address
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      name="address"
                      value={formData.address || ''}
                      onChange={handleInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  ) : (
                    <p style={{ padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                      {user.address || 'Not provided'}
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    City
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      name="city"
                      value={formData.city || ''}
                      onChange={handleInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  ) : (
                    <p style={{ padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                      {user.city || 'Not provided'}
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Province
                  </label>
                  {editMode ? (
                    <select
                      name="province"
                      value={formData.province || ''}
                      onChange={handleInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    >
                      <option value="">Select Province</option>
                      {southAfricanProvinces.map(province => (
                        <option key={province} value={province}>{province}</option>
                      ))}
                    </select>
                  ) : (
                    <p style={{ padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                      {user.province || 'Not provided'}
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Postal Code
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      name="postal_code"
                      value={formData.postal_code || ''}
                      onChange={handleInputChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  ) : (
                    <p style={{ padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                      {user.postal_code || 'Not provided'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {editMode && (
              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                <button
                  onClick={handleSaveProfile}
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setEditMode(false);
                    setFormData(user);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div style={{ 
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ marginBottom: '2rem' }}>Order History</h2>
            
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>No orders yet</p>
                <p>Start shopping to see your orders here!</p>
                <button
                  onClick={() => router.push('/products')}
                  className="btn btn-primary"
                  style={{ marginTop: '1rem' }}
                >
                  Browse Products
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {orders.map((order) => (
                  <div key={order.id} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    backgroundColor: '#f9fafb'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <h3 style={{ margin: 0, color: '#374151' }}>
                          Order #{order.order_number}
                        </h3>
                        <p style={{ margin: '0.25rem 0', color: '#6b7280', fontSize: '0.9rem' }}>
                          Placed on {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: '1.1rem', 
                          fontWeight: 'bold',
                          color: '#374151'
                        }}>
                          {formatPrice(order.total_amount)}
                        </div>
                        <div style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          backgroundColor: order.status === 'completed' ? '#dcfce7' : '#fef3c7',
                          color: order.status === 'completed' ? '#166534' : '#92400e'
                        }}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                      <p>Items: {order.items?.length || 0}</p>
                      <p>Payment: {order.payment_method}</p>
                      {order.tracking_number && (
                        <p>Tracking: {order.tracking_number}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
