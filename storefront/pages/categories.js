import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import { apiClient } from '../lib/api';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getCategories();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  // When categories load, select from URL or default to first
  useEffect(() => {
    if (!categories || categories.length === 0) return;
    const qId = router.query?.category ? parseInt(router.query.category, 10) : null;
    if (qId) {
      const c = categories.find(cat => cat.id === qId);
      if (c) {
        loadProductsByCategory(c);
        return;
      }
    }
    if (!selectedCategory) {
      const c0 = categories[0];
      loadProductsByCategory(c0);
    }
  }, [categories]);

  const handleSelectCategory = (cat) => {
    router.push({ pathname: '/categories', query: { category: cat.id } }, undefined, { shallow: true });
    loadProductsByCategory(cat);
  };

  const loadProductsByCategory = async (catOrId, nameMaybe, resetPage = true) => {
    try {
      setProductsLoading(true);
      const categoryId = typeof catOrId === 'object' ? catOrId.id : catOrId;
      const categoryName = typeof catOrId === 'object' ? catOrId.name : nameMaybe;
      setSelectedCategory({ id: categoryId, name: categoryName });

      if (resetPage) {
        setFilters(prev => ({ ...prev, page: 1 }));
      }

      const params = {
        category: categoryId,
        page: resetPage ? 1 : filters.page,
        limit: filters.limit
      };

      const data = await apiClient.getProducts(params);
      setProducts(data.products || []);
      setPagination(data.pagination || {});

      if (data.products?.length === 0) {
        toast.info(`No products found in ${categoryName} category`);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
      setProducts([]);
      setPagination({});
    } finally {
      setProductsLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    if (selectedCategory) {
      loadProductsByCategory(selectedCategory.id, selectedCategory.name, false);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newLimit) => {
    setFilters(prev => ({ ...prev, limit: newLimit, page: 1 }));
    if (selectedCategory) {
      loadProductsByCategory(selectedCategory.id, selectedCategory.name, true);
    }
  };

  const getCategoryIcon = (categoryName) => {
    const name = categoryName?.toLowerCase() || '';
    if (name.includes('smartphone') || name.includes('phone')) return '📱';
    if (name.includes('laptop') || name.includes('computer')) return '💻';
    if (name.includes('tablet') || name.includes('ipad')) return '📱';
    if (name.includes('audio') || name.includes('headphone') || name.includes('speaker')) return '🎧';
    if (name.includes('gaming') || name.includes('game')) return '🎮';
    if (name.includes('camera')) return '📷';
    if (name.includes('watch')) return '⌚';
    if (name.includes('accessory') || name.includes('accessories')) return '🔌';
    return '📦';
  };

  if (loading) {
    return (
      <Layout title="Categories - GadgetShack South Africa">
        <div className="container" style={{ padding: '2rem 0', textAlign: 'center' }}>
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading categories...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Shop by Category - GadgetShack South Africa">
      <div className="container" style={{ padding: '2rem 0' }}>
        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Shop by Category
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#6b7280',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Discover our wide range of tech products organized by category.
            Find exactly what you're looking for with ease.
          </p>
        </div>

        {/* Categories Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => handleSelectCategory(category)}
              style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              {/* Category Icon */}
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem',
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
              }}>
                {getCategoryIcon(category.name)}
              </div>

              {/* Selected badge */}
              {selectedCategory?.id === category.id && (
                <span style={{ position: 'absolute', top: 12, right: 12, background: '#e0e7ff', color: '#4338ca', padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: 12 }}>
                  Selected
                </span>
              )}
              {/* Category Name */}
              <h3 style={{
                fontSize: '1.3rem',
                fontWeight: '700',
                marginBottom: '0.5rem',
                color: '#1f2937'
              }}>
                {category.name}
              </h3>

              {/* Product Count */}
              <p style={{
                color: '#6b7280',
                fontSize: '0.9rem',
                marginBottom: '1.5rem'
              }}>
                {category.product_count || 0} products available
              </p>

              {/* Browse Button */}
              <div style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '25px',
                fontSize: '0.9rem',
                fontWeight: '600',
                display: 'inline-block',
                transition: 'all 0.2s ease'
              }}>
                Browse {category.name} →
              </div>
            </div>
          ))}
        </div>

        {/* Selected Category Products */}
        {selectedCategory && (
          <div style={{ marginTop: '4rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '2rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div>
                <h2 style={{
                  fontSize: '1.8rem',
                  fontWeight: '700',
                  margin: '0 0 0.5rem 0',
                  color: '#1f2937'
                }}>
                  {getCategoryIcon(selectedCategory.name)} {selectedCategory.name}
                </h2>
                <p style={{
                  color: '#6b7280',
                  margin: 0,
                  fontSize: '1rem'
                }}>
                  {products.length} products found
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setProducts([]);
                }}
                style={{
                  background: 'rgba(107, 114, 128, 0.1)',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(107, 114, 128, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(107, 114, 128, 0.1)';
                }}
              >
                ✕ Clear Filter
              </button>
            </div>

            {productsLoading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>Loading {selectedCategory.name} products...</p>
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="products-grid">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Enhanced Pagination */}
                <Pagination
                  currentPage={pagination.page || 1}
                  totalPages={pagination.pages || 1}
                  totalItems={pagination.total || 0}
                  itemsPerPage={filters.limit}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  showItemsPerPage={true}
                  showInfo={true}
                  maxVisiblePages={7}
                />
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                <h3 style={{ marginBottom: '1rem', color: '#374151' }}>
                  No products in {selectedCategory.name}
                </h3>
                <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
                  We're working on adding more products to this category. Check back soon!
                </p>
                <Link href="/products">
                  <button className="btn btn-primary">
                    Browse All Products
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Call to Action */}
        {!selectedCategory && (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '16px',
            marginTop: '3rem'
          }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.8rem' }}>
              Can't find what you're looking for?
            </h2>
            <p style={{ marginBottom: '2rem', opacity: '0.9' }}>
              Browse all our products or use our search feature to find exactly what you need.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/products">
                <button className="btn btn-secondary">
                  View All Products
                </button>
              </Link>
              <Link href="/search">
                <button className="btn btn-primary">
                  🔍 Search Products
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
