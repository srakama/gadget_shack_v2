import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCart } from '../context/CartContext';
import UserAvatar from './UserAvatar';

export default function ModernNavbar({ 
  user, 
  isAuthenticated, 
  isAdmin, 
  onLogout, 
  onCartOpen,
  scrolled = false 
}) {
  const router = useRouter();
  const { getCartItemCount } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [router.pathname]);

  const isActive = (path) => {
    if (path === '/') return router.pathname === '/';
    return router.pathname.startsWith(path);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (query) {
      router.push(`/products?search=${encodeURIComponent(query)}`);
      setSearchTerm('');
      setIsSearchOpen(false);
    }
  };

  const cartItemCount = getCartItemCount();

  return (
    <header className={`modern-navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo */}
        <Link href="/" className="navbar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src="/logo.svg" alt="GadgetShack" width={32} height={32} />
            <span className="logo-text">GadgetShack</span>
            <span className="flag">🇿🇦</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <Link href="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            Home
          </Link>
          <Link href="/products" className={`nav-link ${isActive('/products') ? 'active' : ''}`}>
            Products
          </Link>
          <Link href="/categories" className={`nav-link ${isActive('/categories') ? 'active' : ''}`}>
            Categories
          </Link>
        </nav>

        {/* Search Bar */}
        <div className="search-container" ref={searchRef}>
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="search"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </form>
        </div>

        {/* Right Side Actions */}
        <div className="navbar-actions">
          {/* Cart Button */}
          <button onClick={onCartOpen} className="cart-button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V17C17 18.1 16.1 19 15 19H9C7.9 19 7 18.1 7 17V13M17 13H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {cartItemCount > 0 && (
              <span className="cart-badge">{cartItemCount}</span>
            )}
          </button>

          {/* User Menu */}
          {isAuthenticated ? (
            <div className="user-menu" ref={userMenuRef}>
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="user-menu-trigger"
              >
                <UserAvatar user={user} size={32} />
                <svg className="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {isUserMenuOpen && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <UserAvatar user={user} size={40} />
                    <div>
                      <div className="user-name">
                        {user?.first_name && user?.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : user?.first_name || user?.email?.split('@')[0]
                        }
                      </div>
                      <div className="user-email">{user?.email}</div>
                    </div>
                  </div>
                  
                  <div className="dropdown-divider"></div>
                  
                  <Link href="/profile" className="dropdown-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20 21V19C20 17.9 19.1 17 18 17H6C4.9 17 4 17.9 4 19V21M16 7C16 9.2 14.2 11 12 11C9.8 11 8 9.2 8 7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Profile
                    </div>
                  </Link>
                  
                  <Link href="/orders" className="dropdown-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M16 4H18C19.1 4 20 4.9 20 6V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V6C4 4.9 4.9 4 6 4H8M15 2H9C8.4 2 8 2.4 8 3V5C8 5.6 8.4 6 9 6H15C15.6 6 16 5.6 16 5V3C16 2.4 15.6 2 15 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Orders
                    </div>
                  </Link>

                  {isAdmin && (
                    <>
                      <div className="dropdown-divider"></div>
                      <Link href="/admin" className="dropdown-item admin-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M19.4 15C19.2 15.3 19.2 15.7 19.4 16L20.4 17.9C20.6 18.3 20.5 18.8 20.1 19.1L18.4 20.9C18 21.3 17.5 21.4 17.1 21.2L15.2 20.2C14.9 20 14.5 20 14.2 20.2L13 21.2C12.6 21.4 12.1 21.3 11.8 20.9L10.1 19.1C9.7 18.8 9.6 18.3 9.8 17.9L10.8 16C11 15.7 11 15.3 10.8 15L9.8 13.1C9.6 12.7 9.7 12.2 10.1 11.9L11.8 10.1C12.2 9.7 12.7 9.6 13.1 9.8L15 10.8C15.3 11 15.7 11 16 10.8L17.2 9.8C17.6 9.6 18.1 9.7 18.4 10.1L20.1 11.9C20.5 12.2 20.6 12.7 20.4 13.1L19.4 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Admin Panel
                        </div>
                      </Link>
                    </>
                  )}

                  <div className="dropdown-divider"></div>
                  
                  <button onClick={onLogout} className="dropdown-item logout-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 21H5C4.4 21 4 20.6 4 20V4C4 3.4 4.4 3 5 3H9M16 17L21 12L16 7M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link href="/login" className="auth-link">Login</Link>
              <Link href="/register" className="auth-button">Sign Up</Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="mobile-menu-button"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              {isMobileMenuOpen ? (
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              ) : (
                <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-nav">
            <Link href="/" className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`}>
              Home
            </Link>
            <Link href="/products" className={`mobile-nav-link ${isActive('/products') ? 'active' : ''}`}>
              Products
            </Link>
            <Link href="/categories" className={`mobile-nav-link ${isActive('/categories') ? 'active' : ''}`}>
              Categories
            </Link>
          </div>

          {isAuthenticated ? (
            <div className="mobile-user-section">
              <div className="mobile-user-info">
                <UserAvatar user={user} size={40} />
                <div>
                  <div className="mobile-user-name">
                    {user?.first_name && user?.last_name 
                      ? `${user.first_name} ${user.last_name}`
                      : user?.first_name || user?.email?.split('@')[0]
                    }
                  </div>
                  <div className="mobile-user-email">{user?.email}</div>
                </div>
              </div>
              
              <div className="mobile-user-links">
                <Link href="/profile" className="mobile-nav-link">Profile</Link>
                <Link href="/orders" className="mobile-nav-link">Orders</Link>
                {isAdmin && (
                  <Link href="/admin" className="mobile-nav-link admin-link">Admin Panel</Link>
                )}
                <button onClick={onLogout} className="mobile-logout-button">
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="mobile-auth-section">
              <Link href="/login" className="mobile-auth-link">Login</Link>
              <Link href="/register" className="mobile-auth-button">Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
