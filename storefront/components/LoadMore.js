import { useState } from 'react';

export default function LoadMore({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage, 
  onLoadMore,
  loading = false,
  showInfo = true
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadMore = async () => {
    if (currentPage < totalPages && !loading && !isLoading) {
      setIsLoading(true);
      try {
        await onLoadMore(currentPage + 1);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const startItem = 1;
  const endItem = currentPage * itemsPerPage;
  const hasMore = currentPage < totalPages;

  if (totalPages <= 1) return null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.5rem',
      padding: '2rem 0',
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      margin: '2rem 0'
    }}>
      {/* Progress Info */}
      {showInfo && (
        <div style={{
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '0.9rem'
        }}>
          <div style={{ fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
            Showing {endItem.toLocaleString()} of {totalItems.toLocaleString()} products
          </div>
          <div style={{ fontSize: '0.8rem' }}>
            {hasMore ? `${totalItems - endItem} more products available` : 'All products loaded'}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div style={{
        width: '100%',
        maxWidth: '300px',
        height: '8px',
        backgroundColor: '#f3f4f6',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${(endItem / totalItems) * 100}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
          borderRadius: '4px',
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Load More Button */}
      {hasMore ? (
        <button
          onClick={handleLoadMore}
          disabled={loading || isLoading}
          style={{
            padding: '1rem 2rem',
            border: 'none',
            borderRadius: '12px',
            background: loading || isLoading 
              ? '#9ca3af' 
              : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            color: 'white',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: loading || isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            if (!loading && !isLoading) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && !isLoading) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
            }
          }}
        >
          {loading || isLoading ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Loading...
            </>
          ) : (
            <>
              📦 Load More Products
            </>
          )}
        </button>
      ) : (
        <div style={{
          padding: '1rem 2rem',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          borderRadius: '12px',
          fontSize: '1rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
        }}>
          ✅ All products loaded
        </div>
      )}

      {/* Quick Stats */}
      <div style={{
        display: 'flex',
        gap: '2rem',
        fontSize: '0.8rem',
        color: '#9ca3af',
        textAlign: 'center'
      }}>
        <div>
          <div style={{ fontWeight: '600', color: '#374151' }}>{currentPage}</div>
          <div>Pages Loaded</div>
        </div>
        <div>
          <div style={{ fontWeight: '600', color: '#374151' }}>{totalPages}</div>
          <div>Total Pages</div>
        </div>
        <div>
          <div style={{ fontWeight: '600', color: '#374151' }}>{Math.round((endItem / totalItems) * 100)}%</div>
          <div>Complete</div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
