import { useState, useEffect } from 'react';
import Link from 'next/link';
import SafeImage from './SafeImage';
import { formatPrice } from '../lib/api';

export default function RecentlyViewed({ currentProductId, maxItems = 6 }) {
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentlyViewed();
  }, [currentProductId]);

  const loadRecentlyViewed = () => {
    try {
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      const key = 'gadgetshack_recently_viewed';
      const stored = localStorage.getItem(key);
      
      if (!stored) {
        setRecentlyViewed([]);
        setLoading(false);
        return;
      }

      const items = JSON.parse(stored);
      
      // Filter out current product and invalid items
      const validItems = items.filter(item => 
        item && 
        item.id && 
        item.id !== currentProductId && 
        item.name
      );

      // Sort by timestamp (most recent first) and limit items
      const sortedItems = validItems
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, maxItems);

      setRecentlyViewed(sortedItems);
      setLoading(false);
    } catch (error) {
      console.error('Error loading recently viewed:', error);
      setRecentlyViewed([]);
      setLoading(false);
    }
  };

  // Clear recently viewed (utility function)
  const clearRecentlyViewed = () => {
    try {
      localStorage.removeItem('gadgetshack_recently_viewed');
      setRecentlyViewed([]);
    } catch (error) {
      console.error('Error clearing recently viewed:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
          Recently Viewed
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
          {[...Array(4)].map((_, index) => (
            <div key={index} style={{
              height: '200px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              animation: 'pulse 1.5s ease-in-out infinite'
            }} />
          ))}
        </div>
      </div>
    );
  }

  if (recentlyViewed.length === 0) {
    return null; // Don't show section if no recently viewed items
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1rem' 
      }}>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '600',
          margin: 0,
          color: '#1f2937'
        }}>
          Recently Viewed
        </h3>
        {recentlyViewed.length > 0 && (
          <button
            onClick={clearRecentlyViewed}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              fontSize: '0.875rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
            onMouseOver={(e) => e.target.style.color = '#374151'}
            onMouseOut={(e) => e.target.style.color = '#6b7280'}
          >
            Clear All
          </button>
        )}
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
        gap: '1rem' 
      }}>
        {recentlyViewed.map((item) => (
          <Link 
            key={item.id} 
            href={`/products/${item.id}`}
            style={{ textDecoration: 'none' }}
          >
            <div 
              style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden',
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              {/* Product Image */}
              <div style={{ 
                height: '120px', 
                backgroundColor: '#f9fafb', 
                position: 'relative', 
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {item.image ? (
                  <SafeImage
                    src={item.image}
                    alt={item.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      No Image
                    </span>
                  </div>
                )}
              </div>
              
              {/* Product Info */}
              <div style={{ 
                padding: '0.75rem',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <h4 style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#1f2937',
                  margin: 0,
                  lineHeight: '1.25',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minHeight: '2.5rem'
                }}>
                  {item.name}
                </h4>
                
                {item.price && (
                  <div style={{ 
                    marginTop: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#059669'
                  }}>
                    {formatPrice(item.price)}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Show "View All" link if there are more items */}
      {recentlyViewed.length >= maxItems && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: '1rem' 
        }}>
          <Link 
            href="/products" 
            style={{
              color: '#2563eb',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            View All Products →
          </Link>
        </div>
      )}
    </div>
  );
}
