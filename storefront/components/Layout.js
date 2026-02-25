import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '../context/CartContext';
import Cart from './Cart';
import UserAvatar from './UserAvatar';
import ModernNavbar from './ModernNavbar';

export default function Layout({ children, title = 'GadgetShack South Africa - Private E-commerce', serverRole }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(serverRole === 'admin');
  const [isClient, setIsClient] = useState(false);
  const [inactiveCount, setInactiveCount] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const { getCartItemCount } = useCart();

  // Function to fetch user information
  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setUser(null);
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api'}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
      } else {
        // Token might be invalid, clear it
        localStorage.removeItem('auth_token');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      setUser(null);
    }
  };

  useEffect(() => {
    // Set client flag to prevent hydration mismatch
    setIsClient(true);

    // Check if user has auth token & role
    const token = localStorage.getItem('auth_token');
    setIsAuthenticated(!!token);
    try {
      const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
      setIsAdmin(!!payload && payload.role === 'admin');

      // Fetch user information if authenticated
      if (token) {
        fetchUserInfo();
      }
    } catch {
      setIsAdmin(false);
    }

    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll);

    let timeout;
    const fetchSuggest = async (q) => {
      if (!q || q.length < 2) { setSuggestions([]); return; }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api'}/products?limit=5&search=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.products || []);
        }
      } catch {}
    };

    const onInput = (e) => {
      const q = e.target.value;
      setSearchTerm(q);
      clearTimeout(timeout);
      timeout = setTimeout(() => fetchSuggest(q), 250);
    };

    const el = document.querySelector('.header-search-input');
    if (el) el.addEventListener('input', onInput);

    const onDocClick = (e) => {
      if (!e.target.closest('.header-search-input') && !e.target.closest('.search-suggestions')) {
        setOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (el) el.removeEventListener('input', onInput);
      document.removeEventListener('click', onDocClick);
      clearTimeout(timeout);
    };
  }, []);

  // Fetch inactive count for badge if admin
  useEffect(() => {
    if (!isClient || !isAdmin) return;
    (async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api';
        const token = localStorage.getItem('auth_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${base}/admin/products?status=inactive&page=1&limit=1`, { headers });
        if (res.ok) {
          const data = await res.json();
          setInactiveCount(data?.pagination?.total || 0);
        }
      } catch {}
    })();
  }, [isClient, isAdmin]);

  // Listen for admin refresh completion to update inactive badge
  useEffect(() => {
    if (!isClient || !isAdmin) return;
    const handler = () => {
      (async () => {
        try {
          const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api';
          const token = localStorage.getItem('auth_token');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const res = await fetch(`${base}/admin/products?status=inactive&page=1&limit=1`, { headers });
          if (res.ok) {
            const data = await res.json();
            setInactiveCount(data?.pagination?.total || 0);
          }
        } catch {}
      })();
    };

    window.addEventListener('refresh:completed', handler);
    return () => window.removeEventListener('refresh:completed', handler);
  }, [isClient, isAdmin]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    // Clear cookie as well
    if (typeof document !== 'undefined') {
      document.cookie = 'auth_token=; Path=/; Max-Age=0; SameSite=Lax';
    }
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUser(null); // Clear user information
    window.location.reload();
  };

  const isActive = (path) => router.pathname === path || router.pathname.startsWith(path + '/');

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Private e-commerce platform powered by GadgetShack" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
        <link rel="apple-touch-icon" href="/logo.svg" />
      </Head>

      <ModernNavbar
        user={user}
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        onCartOpen={() => setIsCartOpen(true)}
        scrolled={scrolled}
      />

      <main className="main">
        {children}
      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2025 GadgetShack South Africa. Crafted with ❤️ by <a href="https://azaniadigital.co.za" target="_blank" rel="noopener noreferrer">Azania Digital</a></p>
        </div>
      </footer>

      {/* Cart Sidebar */}
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
