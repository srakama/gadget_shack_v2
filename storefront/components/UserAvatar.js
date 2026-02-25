import { useState } from 'react';

export default function UserAvatar({
  user,
  size = 32,
  showName = false,
  showStatus = false,
  className = '',
  style = {}
}) {
  const [imageError, setImageError] = useState(false);

  // Return null or placeholder if user is not provided
  if (!user) {
    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          backgroundColor: '#e5e7eb',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
          fontSize: `${size * 0.4}px`,
          fontWeight: '500',
          ...style
        }}
        className={className}
      >
        ?
      </div>
    );
  }

  // Generate initials from user's name or email
  const getInitials = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    } else if (user.first_name) {
      return user.first_name.charAt(0).toUpperCase();
    } else if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Generate a consistent color based on user ID or email
  const getAvatarColor = () => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];

    // Fallback to first color if user data is incomplete
    if (!user || (!user.id && !user.email)) {
      return colors[0];
    }

    const index = (user.id || user.email.charCodeAt(0)) % colors.length;
    return colors[index];
  };

  const avatarStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${size * 0.4}px`,
    fontWeight: '600',
    color: 'white',
    backgroundColor: getAvatarColor(),
    border: '2px solid #e5e7eb',
    overflow: 'hidden',
    position: 'relative',
    ...style
  };

  const containerStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: showName ? '8px' : '0'
  };

  return (
    <div style={containerStyle} className={className}>
      <div style={avatarStyle}>
        {user?.profile_picture && !imageError ? (
          <img
            src={user.profile_picture}
            alt={`${user.first_name || user.email || 'User'}'s profile`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%'
            }}
            onError={() => setImageError(true)}
            onLoad={() => setImageError(false)}
          />
        ) : (
          <span>{getInitials()}</span>
        )}
        
        {/* Status indicator */}
        {showStatus && (
          <div
            style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              width: `${size * 0.25}px`,
              height: `${size * 0.25}px`,
              backgroundColor: '#10b981',
              border: '2px solid white',
              borderRadius: '50%'
            }}
          />
        )}
      </div>

      {/* User name */}
      {showName && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            lineHeight: '1.2'
          }}>
            {user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`
              : user.first_name || (user.email ? user.email.split('@')[0] : 'User')
            }
          </span>
          {user?.oauth_provider && (
            <span style={{
              fontSize: '12px',
              color: '#6b7280',
              lineHeight: '1.2'
            }}>
              via {user.oauth_provider === 'google' ? 'Google' : 'Facebook'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Preset sizes for common use cases
UserAvatar.sizes = {
  small: 24,
  medium: 32,
  large: 48,
  xlarge: 64
};

// Example usage:
// <UserAvatar user={user} size={UserAvatar.sizes.large} showName={true} showStatus={true} />
