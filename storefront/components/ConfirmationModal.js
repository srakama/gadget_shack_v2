import { useEffect } from 'react';

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmStyle = "danger" // "danger", "primary", "secondary"
}) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getConfirmButtonStyle = () => {
    const baseStyle = {
      padding: '0.75rem 1.5rem',
      borderRadius: '6px',
      border: 'none',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    };

    switch (confirmStyle) {
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: '#dc2626',
          color: 'white'
        };
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: '#2563eb',
          color: 'white'
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: '#6b7280',
          color: 'white'
        };
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        animation: 'modalSlideIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            {title}
          </h3>
        </div>

        {/* Message */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{
            margin: 0,
            color: '#6b7280',
            lineHeight: '1.5'
          }}>
            {message}
          </p>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
              color: '#374151',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#f9fafb';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'white';
            }}
          >
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            style={getConfirmButtonStyle()}
            onMouseOver={(e) => {
              if (confirmStyle === 'danger') {
                e.target.style.backgroundColor = '#b91c1c';
              } else if (confirmStyle === 'primary') {
                e.target.style.backgroundColor = '#1d4ed8';
              } else {
                e.target.style.backgroundColor = '#4b5563';
              }
            }}
            onMouseOut={(e) => {
              if (confirmStyle === 'danger') {
                e.target.style.backgroundColor = '#dc2626';
              } else if (confirmStyle === 'primary') {
                e.target.style.backgroundColor = '#2563eb';
              } else {
                e.target.style.backgroundColor = '#6b7280';
              }
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
