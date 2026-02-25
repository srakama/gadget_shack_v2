import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useCart } from '../context/CartContext';
import { formatPrice, apiClient } from '../lib/api';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getCartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Customer Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Shipping Address
    address: '',
    city: '',
    province: '',
    postalCode: '',
    
    // Payment Information
    paymentMethod: 'card',
    
    // Special Instructions
    notes: ''
  });

  const southAfricanProvinces = [
    'Eastern Cape',
    'Free State',
    'Gauteng',
    'KwaZulu-Natal',
    'Limpopo',
    'Mpumalanga',
    'Northern Cape',
    'North West',
    'Western Cape'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if user is logged in
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Please log in to place an order');
        router.push('/login?redirect=/checkout');
        return;
      }

      // Prepare order data in the format expected by the backend
      const orderData = {
        items: items.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        })),
        shipping_address: `${formData.address}, ${formData.city}, ${formData.province} ${formData.postalCode}`,
        billing_address: `${formData.address}, ${formData.city}, ${formData.province} ${formData.postalCode}`
      };

      // Create order
      const response = await apiClient.createOrder(orderData);

      if (response.order) {
        // Store order ID for confirmation page
        localStorage.setItem('last_order_id', response.order.id);
        localStorage.setItem('last_order_total', response.order.total_amount);

        // Clear cart and redirect
        clearCart();
        toast.success('Order placed successfully! You will receive a confirmation email shortly.');
        router.push('/order-confirmation');
      }

    } catch (error) {
      console.error('Order creation error:', error);
      toast.error(error.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout title="Checkout - GadgetShack South Africa">
        <div className="container" style={{ padding: '2rem 0', textAlign: 'center' }}>
          <h1>Your cart is empty</h1>
          <p>Add some products to your cart before checking out.</p>
          <button 
            onClick={() => router.push('/products')}
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
          >
            Continue Shopping
          </button>
        </div>
      </Layout>
    );
  }

  const subtotal = getCartTotal();
  const shipping = subtotal > 500 ? 0 : 50; // Free shipping over R500
  const total = subtotal + shipping;

  return (
    <Layout title="Checkout - GadgetShack South Africa">
      <div className="container" style={{ padding: '2rem 0' }}>
        <h1 style={{ marginBottom: '2rem' }}>Checkout</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
          {/* Checkout Form */}
          <div>
            <form onSubmit={handleSubmit}>
              {/* Customer Information */}
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>Customer Information</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., 082 123 4567"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>Shipping Address</h2>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Street Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Province *</label>
                    <select
                      name="province"
                      value={formData.province}
                      onChange={handleInputChange}
                      required
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    >
                      <option value="">Select Province</option>
                      {southAfricanProvinces.map(province => (
                        <option key={province} value={province}>{province}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Postal Code *</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., 2000"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>Payment Method</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === 'card'}
                      onChange={handleInputChange}
                    />
                    Credit/Debit Card
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="eft"
                      checked={formData.paymentMethod === 'eft'}
                      onChange={handleInputChange}
                    />
                    EFT/Bank Transfer
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={handleInputChange}
                    />
                    Cash on Delivery
                  </label>
                </div>
              </div>

              {/* Special Instructions */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Special Instructions</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Any special delivery instructions..."
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
              >
                {loading ? 'Processing Order...' : `Place Order - ${formatPrice(total)}`}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div>
            <div style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px', 
              padding: '1.5rem',
              backgroundColor: '#f9fafb',
              position: 'sticky',
              top: '2rem'
            }}>
              <h2 style={{ marginBottom: '1rem' }}>Order Summary</h2>
              
              {/* Cart Items */}
              <div style={{ marginBottom: '1rem' }}>
                {items.map((item) => (
                  <div key={item.cartId} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{item.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        Qty: {item.quantity}
                        {item.selectedSize && ` | Size: ${item.selectedSize}`}
                        {item.selectedColor && ` | Color: ${item.selectedColor}`}
                      </div>
                    </div>
                    <div style={{ fontWeight: '500' }}>
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ borderTop: '1px solid #d1d5db', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Subtotal:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Shipping:</span>
                  <span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                </div>
                {shipping === 0 && (
                  <div style={{ fontSize: '0.8rem', color: '#16a34a', marginBottom: '0.5rem' }}>
                    🎉 Free shipping on orders over R500!
                  </div>
                )}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  borderTop: '1px solid #d1d5db',
                  paddingTop: '0.5rem'
                }}>
                  <span>Total:</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
