import { useState, useEffect } from 'react';

export default function FacebookLoginButton({ onSuccess, onError, disabled = false }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFacebookLoaded, setIsFacebookLoaded] = useState(false);

  useEffect(() => {
    // Load Facebook SDK
    const loadFacebookSDK = () => {
      if (window.FB) {
        setIsFacebookLoaded(true);
        return;
      }

      window.fbAsyncInit = function() {
        window.FB.init({
          appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '1234567890123456',
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
        setIsFacebookLoaded(true);
      };

      // Load the SDK asynchronously
      const script = document.createElement('script');
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      document.head.appendChild(script);
    };

    loadFacebookSDK();
  }, []);

  const handleFacebookLogin = () => {
    if (!isFacebookLoaded || !window.FB) {
      onError('Facebook SDK not loaded');
      return;
    }

    setIsLoading(true);

    window.FB.login(async (response) => {
      try {
        if (response.authResponse) {
          // Send the access token to our backend
          const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api'}/auth/oauth/facebook`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: response.authResponse.accessToken
            }),
          });

          const data = await result.json();

          if (result.ok) {
            onSuccess(data);
          } else {
            onError(data.error || 'Facebook login failed');
          }
        } else {
          onError('Facebook login cancelled');
        }
      } catch (error) {
        console.error('Facebook login error:', error);
        onError('Facebook login failed');
      } finally {
        setIsLoading(false);
      }
    }, { scope: 'email,public_profile' });
  };

  return (
    <button
      onClick={handleFacebookLogin}
      disabled={disabled || isLoading || !isFacebookLoaded}
      style={{
        width: '100%',
        padding: '12px 16px',
        border: 'none',
        borderRadius: '8px',
        backgroundColor: '#1877f2',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        cursor: disabled || isLoading || !isFacebookLoaded ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: disabled || isLoading || !isFacebookLoaded ? 0.6 : 1
      }}
      onMouseOver={(e) => {
        if (!disabled && !isLoading && isFacebookLoaded) {
          e.target.style.backgroundColor = '#166fe5';
        }
      }}
      onMouseOut={(e) => {
        if (!disabled && !isLoading && isFacebookLoaded) {
          e.target.style.backgroundColor = '#1877f2';
        }
      }}
    >
      {isLoading ? (
        <>
          <div style={{
            width: '18px',
            height: '18px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTop: '2px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Signing in...
        </>
      ) : (
        <>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Continue with Facebook
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
