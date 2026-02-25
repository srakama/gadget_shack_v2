import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { apiClient } from '../lib/api';
import toast from 'react-hot-toast';
import GoogleLoginButton from '../components/GoogleLoginButton';
import FacebookLoginButton from '../components/FacebookLoginButton';
import OAuthSetupInstructions from '../components/OAuthSetupInstructions';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    acceptTerms: false
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
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.first_name || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.acceptTerms) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.register({
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || '',
        address: formData.address || '',
        city: formData.city || '',
        province: formData.province || '',
        postal_code: formData.postal_code || ''
      });
      
      // Store token
      localStorage.setItem('auth_token', response.token);
      
      toast.success('Registration successful!');
      router.push('/');
      
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // OAuth success handler
  const handleOAuthSuccess = (data) => {
    setOauthLoading(false);

    // Store token
    localStorage.setItem('auth_token', data.token);

    toast.success(`Welcome ${data.user.first_name || data.user.email}! Registration successful.`);
    router.push('/');
  };

  // OAuth error handler
  const handleOAuthError = (error) => {
    setOauthLoading(false);
    console.error('OAuth error:', error);
    toast.error(error || 'Social login failed. Please try again.');
  };

  return (
    <Layout title="Register - GadgetShack">
      <div className="container">
        <div style={{ 
          maxWidth: '400px', 
          margin: '3rem auto', 
          padding: '2rem',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Register</h1>

          {/* OAuth Setup Instructions */}
          {(!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
            process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.includes('your-actual-google-client-id')) && (
            <OAuthSetupInstructions />
          )}

          {/* OAuth Login Buttons */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <GoogleLoginButton
                onSuccess={handleOAuthSuccess}
                onError={handleOAuthError}
                disabled={loading || oauthLoading}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <FacebookLoginButton
                onSuccess={handleOAuthSuccess}
                onError={handleOAuthError}
                disabled={loading || oauthLoading}
              />
            </div>

            {/* Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '1.5rem 0',
              color: '#6b7280',
              fontSize: '14px'
            }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
              <span style={{ padding: '0 1rem' }}>or register with email</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
                placeholder="Enter your first name"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
                placeholder="Enter your last name"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
                placeholder="Enter your email"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
                placeholder="Enter your phone number"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
                placeholder="Enter your password"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
                placeholder="Confirm your password"
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  required
                  style={{ marginRight: '0.5rem' }}
                />
                <span style={{ fontSize: '0.9rem' }}>
                  I accept the{' '}
                  <a href="#" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                    Terms and Conditions
                  </a>
                  {' '}and{' '}
                  <a href="#" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                    Privacy Policy
                  </a>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ 
                width: '100%', 
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <p>
              Already have an account?{' '}
              <a href="/login" style={{ color: '#2563eb' }}>
                Login here
              </a>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
