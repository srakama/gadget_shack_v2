import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

export default function DebugPage() {
  const [apiTest, setApiTest] = useState('Testing...');
  const [products, setProducts] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    testAPI();
  }, []);

  const testAPI = async () => {
    try {
      console.log('Testing API connection...');
      
      // Test 1: Direct fetch to backend
      const response = await fetch('http://localhost:9000/api/products');
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      setProducts(data.products);
      setApiTest('✅ API Connection Successful');
      
    } catch (err) {
      console.error('API Test Error:', err);
      setError(err.message);
      setApiTest('❌ API Connection Failed');
    }
  };

  return (
    <Layout title="Debug - GadgetShack">
      <div className="container">
        <h1>Debug Information</h1>
        
        <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
          <h3>API Connection Test</h3>
          <p><strong>Status:</strong> {apiTest}</p>
          <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api'}</p>
          {error && (
            <p style={{ color: 'red' }}><strong>Error:</strong> {error}</p>
          )}
        </div>

        <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
          <h3>Environment Variables</h3>
          <p><strong>NEXT_PUBLIC_API_URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</p>
          <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV || 'Not set'}</p>
        </div>

        <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
          <h3>Browser Information</h3>
          <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Server-side'}</p>
          <p><strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent : 'Server-side'}</p>
        </div>

        {products && (
          <div style={{ marginBottom: '2rem', padding: '1rem', background: '#e8f5e8', borderRadius: '8px' }}>
            <h3>Products Retrieved ({products.length})</h3>
            {products.slice(0, 3).map((product, index) => (
              <div key={index} style={{ marginBottom: '1rem', padding: '0.5rem', background: 'white', borderRadius: '4px' }}>
                <p><strong>Name:</strong> {product.name}</p>
                <p><strong>SKU:</strong> {product.sku}</p>
                <p><strong>Price:</strong> ${product.price}</p>
                <p><strong>Category:</strong> {product.category_name}</p>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '2rem' }}>
          <button onClick={testAPI} className="btn btn-primary">
            Retry API Test
          </button>
        </div>
      </div>
    </Layout>
  );
}
