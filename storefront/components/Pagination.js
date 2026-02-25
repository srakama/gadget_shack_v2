import { useState, useEffect } from 'react';

export default function Pagination({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage, 
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
  showInfo = true,
  maxVisiblePages = 7
}) {
  const [visiblePages, setVisiblePages] = useState([]);

  useEffect(() => {
    generateVisiblePages();
  }, [currentPage, totalPages, maxVisiblePages]);

  const generateVisiblePages = () => {
    const pages = [];
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate start and end pages
      let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      // Adjust start if we're near the end
      if (end - start + 1 < maxVisiblePages) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      
      // Add first page and ellipsis if needed
      if (start > 1) {
        pages.push(1);
        if (start > 2) {
          pages.push('...');
        }
      }
      
      // Add visible pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis and last page if needed
      if (end < totalPages) {
        if (end < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }
    
    setVisiblePages(pages);
  };

  const handlePageClick = (page) => {
    if (page !== '...' && page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    if (onItemsPerPageChange) {
      onItemsPerPageChange(newItemsPerPage);
    }
  };

  const getPageButtonStyle = (page, isActive = false) => ({
    padding: '0.75rem 1rem',
    border: isActive ? '2px solid #3b82f6' : '1px solid #e5e7eb',
    borderRadius: '8px',
    background: isActive ? '#3b82f6' : 'white',
    color: isActive ? 'white' : '#374151',
    cursor: page === '...' ? 'default' : 'pointer',
    fontSize: '0.9rem',
    fontWeight: isActive ? '600' : '500',
    transition: 'all 0.2s ease',
    minWidth: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none'
  });

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalPages <= 1) return null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      alignItems: 'center',
      padding: '2rem 0',
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      margin: '2rem 0'
    }}>
      {/* Pagination Info */}
      {showInfo && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#6b7280',
          fontSize: '0.9rem'
        }}>
          <div style={{ fontWeight: '600', color: '#374151' }}>
            Showing {startItem.toLocaleString()} to {endItem.toLocaleString()} of {totalItems.toLocaleString()} results
          </div>
          <div style={{ fontSize: '0.8rem' }}>
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {/* First Page Button */}
        <button
          onClick={() => handlePageClick(1)}
          disabled={currentPage === 1}
          style={{
            ...getPageButtonStyle(1),
            opacity: currentPage === 1 ? 0.5 : 1,
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
          }}
          onMouseEnter={(e) => {
            if (currentPage !== 1) {
              e.target.style.borderColor = '#9ca3af';
              e.target.style.background = '#f9fafb';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== 1) {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.background = 'white';
            }
          }}
        >
          ⏮️
        </button>

        {/* Previous Page Button */}
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            ...getPageButtonStyle(currentPage - 1),
            opacity: currentPage === 1 ? 0.5 : 1,
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
          }}
          onMouseEnter={(e) => {
            if (currentPage !== 1) {
              e.target.style.borderColor = '#9ca3af';
              e.target.style.background = '#f9fafb';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== 1) {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.background = 'white';
            }
          }}
        >
          ← Prev
        </button>

        {/* Page Numbers */}
        {visiblePages.map((page, index) => (
          <button
            key={index}
            onClick={() => handlePageClick(page)}
            style={getPageButtonStyle(page, page === currentPage)}
            onMouseEnter={(e) => {
              if (page !== currentPage && page !== '...') {
                e.target.style.borderColor = '#9ca3af';
                e.target.style.background = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              if (page !== currentPage && page !== '...') {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.background = 'white';
              }
            }}
          >
            {page}
          </button>
        ))}

        {/* Next Page Button */}
        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            ...getPageButtonStyle(currentPage + 1),
            opacity: currentPage === totalPages ? 0.5 : 1,
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
          }}
          onMouseEnter={(e) => {
            if (currentPage !== totalPages) {
              e.target.style.borderColor = '#9ca3af';
              e.target.style.background = '#f9fafb';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== totalPages) {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.background = 'white';
            }
          }}
        >
          Next →
        </button>

        {/* Last Page Button */}
        <button
          onClick={() => handlePageClick(totalPages)}
          disabled={currentPage === totalPages}
          style={{
            ...getPageButtonStyle(totalPages),
            opacity: currentPage === totalPages ? 0.5 : 1,
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
          }}
          onMouseEnter={(e) => {
            if (currentPage !== totalPages) {
              e.target.style.borderColor = '#9ca3af';
              e.target.style.background = '#f9fafb';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== totalPages) {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.background = 'white';
            }
          }}
        >
          ⏭️
        </button>
      </div>

      {/* Items Per Page Selector */}
      {showItemsPerPage && onItemsPerPageChange && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          fontSize: '0.9rem',
          color: '#6b7280'
        }}>
          <span>Show:</span>
          {[12, 24, 48, 96].map((count) => (
            <button
              key={count}
              onClick={() => handleItemsPerPageChange(count)}
              style={{
                padding: '0.5rem 0.75rem',
                border: itemsPerPage === count ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                borderRadius: '6px',
                background: itemsPerPage === count ? '#3b82f6' : 'white',
                color: itemsPerPage === count ? 'white' : '#374151',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: itemsPerPage === count ? '600' : '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (itemsPerPage !== count) {
                  e.target.style.borderColor = '#9ca3af';
                  e.target.style.background = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (itemsPerPage !== count) {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.background = 'white';
                }
              }}
            >
              {count}
            </button>
          ))}
          <span>per page</span>
        </div>
      )}
    </div>
  );
}
