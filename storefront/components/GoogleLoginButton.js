import { useState, useEffect } from 'react';

export default function GoogleLoginButton({ onSuccess, onError, disabled = false }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  // Check if OAuth is configured
  const isConfigured = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID &&
                      !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.includes('your-actual-google-client-id');

  useEffect(() => {
    // Check if Google Client ID is configured
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId || clientId.includes('your-actual-google-client-id')) {
      console.warn('Google OAuth not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local');
      setIsGoogleLoaded(false);
      return;
    }

    // Load Google Identity Services
    const loadGoogleScript = () => {
      if (window.google) {
        setIsGoogleLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google) {
          setIsGoogleLoaded(true);
          initializeGoogle();
        }
      };
      script.onerror = () => {
        console.error('Failed to load Google Identity Services');
        setIsGoogleLoaded(false);
      };
      document.head.appendChild(script);
    };

    const initializeGoogle = () => {
      if (window.google && window.google.accounts) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });
        } catch (error) {
          console.error('Google OAuth initialization failed:', error);
          setIsGoogleLoaded(false);
        }
      }
    };

    loadGoogleScript();
  }, []);

  const handleGoogleResponse = async (response) => {
    setIsLoading(true);
    try {
      // Send the credential to our backend
      const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api'}/auth/oauth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: response.credential
        }),
      });

      const data = await result.json();

      if (result.ok) {
        onSuccess(data);
      } else {
        onError(data.error || 'Google login failed');
      }
    } catch (error) {
      console.error('Google login error:', error);
      onError('Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId || clientId.includes('your-actual-google-client-id')) {
      onError('Google OAuth not configured. Please set up Google credentials in .env.local');
      return;
    }

    if (!isGoogleLoaded || !window.google) {
      onError('Google services not loaded. Please check your internet connection.');
      return;
    }

    setIsLoading(true);
    try {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback to popup
          window.google.accounts.oauth2.initTokenClient({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',
            scope: 'email profile',
            callback: async (response) => {
              if (response.access_token) {
                try {
                  const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api'}/auth/oauth/google`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      token: response.access_token
                    }),
                  });

                  const data = await result.json();

                  if (result.ok) {
                    onSuccess(data);
                  } else {
                    onError(data.error || 'Google login failed');
                  }
                } catch (error) {
                  console.error('Google login error:', error);
                  onError('Google login failed');
                }
              } else {
                onError('Google login cancelled');
              }
              setIsLoading(false);
            },
          }).requestAccessToken();
        } else {
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('Google login error:', error);
      onError('Google login failed');
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={disabled || isLoading || !isGoogleLoaded}
      style={{
        width: '100%',
        padding: '12px 16px',
        border: '1px solid #dadce0',
        borderRadius: '8px',
        backgroundColor: 'white',
        color: '#3c4043',
        fontSize: '14px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        cursor: disabled || isLoading || !isGoogleLoaded || !isConfigured ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: disabled || isLoading || !isGoogleLoaded || !isConfigured ? 0.6 : 1
      }}
      onMouseOver={(e) => {
        if (!disabled && !isLoading && isGoogleLoaded && isConfigured) {
          e.target.style.backgroundColor = '#f8f9fa';
          e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        }
      }}
      onMouseOut={(e) => {
        if (!disabled && !isLoading && isGoogleLoaded && isConfigured) {
          e.target.style.backgroundColor = 'white';
          e.target.style.boxShadow = 'none';
        }
      }}
    >
      {isLoading ? (
        <>
          <div style={{
            width: '18px',
            height: '18px',
            border: '2px solid #f3f3f3',
            borderTop: '2px solid #4285f4',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Signing in...
        </>
      ) : !isConfigured ? (
        <>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#9ca3af">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Google OAuth Not Configured
        </>
      ) : (
        <>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </>
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}
