import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import { apiClient } from '../lib/api';
import toast from 'react-hot-toast';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load products and categories in parallel
      const [productsData, categoriesData] = await Promise.all([
        search
          ? apiClient.getProducts({ limit: 8, search })
          : apiClient.getHomepage({ limit: 8 }),
        apiClient.getCategories()
      ]);

      setProducts(productsData.products || []);
      setCategories(categoriesData.categories || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadProductsByCategory = async (categoryId) => {
    try {
      setLoading(true);
      const params = categoryId ? { category: categoryId } : {};
      if (search) params.search = search;
      const data = await apiClient.getProducts(params);
      setProducts(data.products || []);
      setSelectedCategory(categoryId);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="GadgetShack South Africa - Private E-commerce Store">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1>Welcome to GadgetShack South Africa</h1>
          <p>Your private e-commerce destination for quality South African gadgets and accessories</p>
          <p style={{ fontSize: '0.9rem', opacity: '0.8', marginTop: '1rem' }}>
            🇿🇦 All prices in ZAR (South African Rand) | Delivered nationwide
          </p>
          <div style={{
            display: 'flex',
            gap: '2rem',
            marginTop: '1.5rem',
            fontSize: '0.85rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span>📱 Smartphones & Accessories</span>
            <span>🔌 Chargers & Cables</span>
            <span>📺 DStv Decoders</span>
            <span>🎧 Audio Equipment</span>
          </div>
        </div>
      </section>

      <div className="container">
        {/* Categories Filter */}
        {categories.length > 0 && (
          <section style={{
            marginBottom: '3rem',
            background: 'white',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1f2937'
              }}>
                🏷️ Shop by Category
              </h2>
              <Link href="/categories">
                <button style={{
                  background: 'transparent',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f9fafb';
                  e.target.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.borderColor = '#d1d5db';
                }}
                >
                  View All Categories →
                </button>
              </Link>
            </div>

            <div style={{
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <button
                className={`category-filter-btn ${selectedCategory === '' ? 'active' : ''}`}
                onClick={() => loadProductsByCategory('')}
                style={{
                  padding: '0.75rem 1.25rem',
                  border: selectedCategory === '' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                  borderRadius: '25px',
                  background: selectedCategory === '' ? '#3b82f6' : 'white',
                  color: selectedCategory === '' ? 'white' : '#6b7280',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  if (selectedCategory !== '') {
                    e.target.style.borderColor = '#9ca3af';
                    e.target.style.background = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory !== '') {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.background = 'white';
                  }
                }}
              >
                🏠 All Products
              </button>

              {categories.map((category) => {
                const getCategoryIcon = (name) => {
                  const categoryName = name?.toLowerCase() || '';
                  if (categoryName.includes('smartphone') || categoryName.includes('phone')) return '📱';
                  if (categoryName.includes('laptop') || categoryName.includes('computer')) return '💻';
                  if (categoryName.includes('tablet')) return '📱';
                  if (categoryName.includes('audio') || categoryName.includes('headphone')) return '🎧';
                  if (categoryName.includes('gaming')) return '🎮';
                  if (categoryName.includes('camera')) return '📷';
                  if (categoryName.includes('watch')) return '⌚';
                  return '📦';
                };

                return (
                  <button
                    key={category.id}
                    className={`category-filter-btn ${selectedCategory === category.id ? 'active' : ''}`}
                    onClick={() => loadProductsByCategory(category.id)}
                    style={{
                      padding: '0.75rem 1.25rem',
                      border: selectedCategory === category.id ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                      borderRadius: '25px',
                      background: selectedCategory === category.id ? '#3b82f6' : 'white',
                      color: selectedCategory === category.id ? 'white' : '#6b7280',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCategory !== category.id) {
                        e.target.style.borderColor = '#9ca3af';
                        e.target.style.background = '#f9fafb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCategory !== category.id) {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.background = 'white';
                      }
                    }}
                  >
                    {getCategoryIcon(category.name)} {category.name} ({category.product_count || 0})
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Search + Products Section */}
        <section>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="form-input"
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={loadData}>Search</button>
          </div>

          <h2 style={{ marginBottom: '1rem' }}>
            {selectedCategory ? 'Filtered Products' : search ? `Search results for "${search}"` : 'Featured Products'}
          </h2>

          {!mounted ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Initializing...</p>
            </div>
          ) : loading ? (
            <>
              <div className="products-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="product-card" aria-hidden>
                    <div className="skeleton" style={{ height: 240 }} />
                    <div className="product-info">
                      <div className="skeleton skeleton-chip" style={{ width: 120, marginBottom: 8 }} />
                      <div className="skeleton skeleton-text" style={{ width: '80%', marginBottom: 8 }} />
                      <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: 16 }} />
                      <div className="skeleton" style={{ width: 120, height: 28, marginBottom: 12 }} />
                      <div className="skeleton" style={{ width: '100%', height: 36, borderRadius: 8 }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : products.length > 0 ? (
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
              <h3>No products found</h3>
              <p>Try selecting a different category or check back later.</p>
            </div>
          )}
        </section>

        {/* Call to Action */}
        {!selectedCategory && products.length > 0 && (
          <section style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '16px',
            margin: '3rem 0',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background Pattern */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              opacity: 0.3
            }}></div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛍️</div>
              <h2 style={{
                fontSize: '2rem',
                marginBottom: '1rem',
                fontWeight: '700'
              }}>
                Discover More Amazing Products
              </h2>
              <p style={{
                marginBottom: '2rem',
                opacity: '0.9',
                fontSize: '1.1rem',
                maxWidth: '600px',
                margin: '0 auto 2rem'
              }}>
                Browse our complete catalog of {products.length > 0 ? '100+' : 'quality'} tech gadgets, smartphones, and accessories.
                Find the perfect device for your needs with authentic products and competitive prices.
              </p>

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <a href="/products" style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.transform = 'translateY(0)';
                }}
                >
                  🔍 View All Products
                </a>

                <a href="/categories" style={{
                  background: 'transparent',
                  color: 'white',
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.transform = 'translateY(0)';
                }}
                >
                  📂 Browse Categories
                </a>
              </div>

              {/* Quick Stats */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '2rem',
                marginTop: '2rem',
                flexWrap: 'wrap'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>100+</div>
                  <div style={{ fontSize: '0.9rem', opacity: '0.8' }}>Products</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>5+</div>
                  <div style={{ fontSize: '0.9rem', opacity: '0.8' }}>Categories</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>🇿🇦</div>
                  <div style={{ fontSize: '0.9rem', opacity: '0.8' }}>South African</div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
