import { useState } from 'react';

export default function OAuthSetupInstructions() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div style={{
      backgroundColor: '#fef3c7',
      border: '1px solid #f59e0b',
      borderRadius: '8px',
      padding: '1rem',
      margin: '1rem 0'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer'
      }} onClick={() => setIsExpanded(!isExpanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#f59e0b">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span style={{ fontWeight: '600', color: '#92400e' }}>
            OAuth Not Configured - Click to Setup
          </span>
        </div>
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="#92400e"
          style={{ 
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        >
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </div>

      {isExpanded && (
        <div style={{ marginTop: '1rem', color: '#92400e', fontSize: '14px' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#92400e' }}>
            🔧 Setup Google OAuth Authentication:
          </h4>
          
          <ol style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
            <li>
              <strong>Go to Google Cloud Console:</strong>
              <br />
              <a 
                href="https://console.cloud.google.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#1d4ed8', textDecoration: 'underline' }}
              >
                https://console.cloud.google.com/
              </a>
            </li>
            
            <li style={{ marginTop: '0.5rem' }}>
              <strong>Create or select a project</strong>
            </li>
            
            <li style={{ marginTop: '0.5rem' }}>
              <strong>Enable APIs:</strong>
              <br />
              Go to "APIs & Services" → "Library" → Enable "Google+ API"
            </li>
            
            <li style={{ marginTop: '0.5rem' }}>
              <strong>Create OAuth Credentials:</strong>
              <br />
              "APIs & Services" → "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
            </li>
            
            <li style={{ marginTop: '0.5rem' }}>
              <strong>Configure Authorized Origins:</strong>
              <br />
              Add: <code style={{ backgroundColor: '#fbbf24', padding: '2px 4px', borderRadius: '3px' }}>
                http://localhost:8000
              </code>
            </li>
            
            <li style={{ marginTop: '0.5rem' }}>
              <strong>Copy Client ID and add to .env.local:</strong>
              <br />
              <code style={{ 
                backgroundColor: '#1f2937', 
                color: '#f9fafb', 
                padding: '0.5rem', 
                borderRadius: '4px', 
                display: 'block', 
                marginTop: '0.25rem',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
              </code>
            </li>
            
            <li style={{ marginTop: '0.5rem' }}>
              <strong>Restart the development server</strong>
            </li>
          </ol>

          <div style={{
            backgroundColor: '#dbeafe',
            border: '1px solid #3b82f6',
            borderRadius: '6px',
            padding: '0.75rem',
            marginTop: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#3b82f6">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <strong style={{ color: '#1e40af' }}>Quick Test:</strong>
            </div>
            <p style={{ margin: 0, color: '#1e40af', fontSize: '13px' }}>
              Once configured, the "Google OAuth Not Configured" button will change to 
              "Continue with Google" and become functional.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
