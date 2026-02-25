import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { apiClient } from '../lib/api';
import toast from 'react-hot-toast';
import GoogleLoginButton from '../components/GoogleLoginButton';
import FacebookLoginButton from '../components/FacebookLoginButton';
import OAuthSetupInstructions from '../components/OAuthSetupInstructions';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('Input changed:', name, value); // Debug log
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Get values directly from form elements as fallback
    const formElement = e.target;
    const emailInput = formElement.elements.email;
    const passwordInput = formElement.elements.password;

    // Use form element values if state is empty (handles autofill issues)
    const email = (formData.email || emailInput?.value || '').trim();
    const password = (formData.password || passwordInput?.value || '').trim();

    console.log('Form data:', { email, password, formData });
    console.log('Email check:', !email, 'Password check:', !password);
    console.log('Form element values:', {
      emailFromInput: emailInput?.value,
      passwordFromInput: passwordInput?.value
    });

    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.login({
        email: email,
        password: password
      });
      
      // Store token (client)
      localStorage.setItem('auth_token', response.token);
      // Also set cookie for SSR checks
      if (typeof document !== 'undefined') {
        const oneDay = 24 * 60 * 60;
        document.cookie = `auth_token=${response.token}; Path=/; Max-Age=${oneDay}; SameSite=Lax`;
      }

      toast.success('Login successful!');
      
      // Redirect based on user role
      if (response.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // OAuth success handler
  const handleOAuthSuccess = (data) => {
    setOauthLoading(false);

    // Store token
    localStorage.setItem('auth_token', data.token);

    toast.success(`Welcome back ${data.user.first_name || data.user.email}!`);

    // Redirect based on user role
    if (data.user.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/');
    }
  };

  // OAuth error handler
  const handleOAuthError = (error) => {
    setOauthLoading(false);
    console.error('OAuth error:', error);
    toast.error(error || 'Social login failed. Please try again.');
  };

  return (
    <Layout title="Login - GadgetShack">
      <div className="container">
        <div style={{ 
          maxWidth: '400px', 
          margin: '3rem auto', 
          padding: '2rem',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Login</h1>

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
              <span style={{ padding: '0 1rem' }}>or login with email</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Email
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

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Password
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
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div style={{ 
            textAlign: 'center', 
            marginTop: '2rem', 
            padding: '1rem',
            background: '#f8f9fa',
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            <p style={{ marginBottom: '1rem', fontWeight: '500' }}>Demo Credentials:</p>
            <p><strong>Admin:</strong> admin@gadgetshack.com / admin123</p>
            <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.5rem' }}>
              (Created automatically during data import)
            </p>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <p>
              Don't have an account?{' '}
              <a href="/register" style={{ color: '#2563eb' }}>
                Register here
              </a>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
