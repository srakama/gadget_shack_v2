import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

export default function OrderConfirmationPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    // Get order number from localStorage or generate fallback
    const storedOrderNumber = localStorage.getItem('last_order_number');
    if (storedOrderNumber) {
      setOrderNumber(storedOrderNumber);
      localStorage.removeItem('last_order_number'); // Clean up
    } else {
      setOrderNumber(`GS${Date.now().toString().slice(-8)}`);
    }
  }, []);

  return (
    <Layout title="Order Confirmation - GadgetShack South Africa">
      <div className="container" style={{ padding: '2rem 0', textAlign: 'center' }}>
        <div style={{ 
          maxWidth: '600px', 
          margin: '0 auto',
          padding: '2rem',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: '#f9fafb'
        }}>
          {/* Success Icon */}
          <div style={{ 
            fontSize: '4rem', 
            marginBottom: '1rem',
            color: '#16a34a'
          }}>
            ✅
          </div>

          <h1 style={{ 
            color: '#16a34a', 
            marginBottom: '1rem',
            fontSize: '2rem'
          }}>
            Order Confirmed!
          </h1>

          <p style={{ 
            fontSize: '1.1rem', 
            marginBottom: '2rem',
            color: '#374151'
          }}>
            Thank you for your order! Your order has been successfully placed and is being processed.
          </p>

          {/* Order Details */}
          <div style={{ 
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Order Details</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <strong>Order Number:</strong>
                <div style={{ color: '#2563eb', fontWeight: 'bold' }}>{orderNumber}</div>
              </div>
              <div>
                <strong>Order Date:</strong>
                <div>{new Date().toLocaleDateString('en-ZA')}</div>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div style={{ 
            backgroundColor: '#eff6ff',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#1d4ed8' }}>What happens next?</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#16a34a', fontWeight: 'bold' }}>1.</span>
                <span>You'll receive an order confirmation email shortly</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#ea580c', fontWeight: 'bold' }}>2.</span>
                <span>We'll process and prepare your order (1-2 business days)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#7c3aed', fontWeight: 'bold' }}>3.</span>
                <span>Your order will be shipped with tracking information</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#2563eb', fontWeight: 'bold' }}>4.</span>
                <span>Delivery within 3-7 business days (depending on location)</span>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div style={{ 
            backgroundColor: '#f0fdf4',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#16a34a' }}>🚚 Delivery Information</h3>
            
            <div style={{ fontSize: '0.9rem', color: '#374151' }}>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Delivery Areas:</strong> We deliver nationwide across South Africa
              </p>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Delivery Time:</strong> 3-7 business days
              </p>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Tracking:</strong> You'll receive tracking details via email and SMS
              </p>
              <p>
                <strong>Contact:</strong> For any questions, contact us at orders@gadgetshack.co.za
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => router.push('/products')}
              className="btn btn-primary"
              style={{ padding: '0.75rem 1.5rem' }}
            >
              Continue Shopping
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="btn btn-secondary"
              style={{ padding: '0.75rem 1.5rem' }}
            >
              Back to Home
            </button>
          </div>

          {/* Support Information */}
          <div style={{ 
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            fontSize: '0.9rem'
          }}>
            <p style={{ margin: 0 }}>
              <strong>Need Help?</strong> Contact our customer support team at{' '}
              <a href="mailto:support@gadgetshack.co.za" style={{ color: '#2563eb' }}>
                support@gadgetshack.co.za
              </a>{' '}
              or call us at{' '}
              <a href="tel:+27123456789" style={{ color: '#2563eb' }}>
                012 345 6789
              </a>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
