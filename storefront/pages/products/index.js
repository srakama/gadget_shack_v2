import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import ProductCard from '../../components/ProductCard';
import Pagination from '../../components/Pagination';
import QuickViewModal from '../../components/QuickViewModal';
import { apiClient } from '../../lib/api';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === 'undefined') return 'grid';
    return localStorage.getItem('gadgetshack_view_mode') || 'grid';
  }); // 'grid' | 'list'
  const [quickView, setQuickView] = useState({ isOpen: false, product: null });
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    category: '',
    search: '',
    minPrice: '',
    maxPrice: '',
    sort: '' // 'price_asc' | 'price_desc' | 'newest'
  });

  // Handle URL parameters
  useEffect(() => {
    if (router.isReady) {
      const { search, category, page, sort } = router.query;
      setFilters(prev => ({
        ...prev,
        search: search || '',
        category: category || '',
        page: parseInt(page) || 1,
        sort: sort || ''
      }));
    }
  }, [router.isReady, router.query]);

  useEffect(() => {
    setMounted(true);
    if (router.isReady) {
      loadProducts();
    }
  }, [filters, router.isReady]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gadgetshack_view_mode', viewMode);
    }
  }, [viewMode]);

  useEffect(() => {
    const onOpen = (e) => setQuickView({ isOpen: true, product: e.detail.product });
    const onClose = () => setQuickView({ isOpen: false, product: null });
    window.addEventListener('quickview:open', onOpen);
    window.addEventListener('quickview:close', onClose);
    return () => {
      window.removeEventListener('quickview:open', onOpen);
      window.removeEventListener('quickview:close', onClose);
    };
  }, []);

  useEffect(() => {
    if (mounted) {
      loadCategories();
    }
  }, [mounted]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      
      const data = await apiClient.getProducts(cleanFilters);
      setProducts(data.products || []);
      setPagination(data.pagination || {});
      
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await apiClient.getCategories();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = {
      ...filters,
      [key]: value,
      page: 1 // Reset to first page when filters change
    };

    setFilters(newFilters);

    // Update URL
    const query = {};
    if (newFilters.search) query.search = newFilters.search;
    if (newFilters.category) query.category = newFilters.category;
    if (newFilters.sort) query.sort = newFilters.sort;
    if (newFilters.page > 1) query.page = newFilters.page;

    router.push({
      pathname: '/products',
      query
    }, undefined, { shallow: true });
  };

  const handlePageChange = (newPage) => {
    const newFilters = {
      ...filters,
      page: newPage
    };

    setFilters(newFilters);

    // Update URL
    const query = {};
    if (newFilters.search) query.search = newFilters.search;
    if (newFilters.category) query.category = newFilters.category;
    if (newFilters.sort) query.sort = newFilters.sort;
    if (newFilters.page > 1) query.page = newFilters.page;

    router.push({
      pathname: '/products',
      query
    }, undefined, { shallow: true });

    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newLimit) => {
    setFilters(prev => ({
      ...prev,
      limit: newLimit,
      page: 1 // Reset to first page when changing items per page
    }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 12,
      category: '',
      search: '',
      minPrice: '',
      maxPrice: '',
      sort: ''
    });

    // Clear URL parameters
    router.push('/products', undefined, { shallow: true });
  };

  return (
    <Layout title="Products - GadgetShack South Africa">
      <div className="container">
        <h1 style={{ marginBottom: '2rem' }}>All Products</h1>

        {/* Filters */}
        <div style={{ 
          background: '#f8f9fa', 
          padding: '1.5rem', 
          borderRadius: '8px', 
          marginBottom: '2rem' 
        }}>
          <h3 style={{ marginBottom: '1rem' }}>Filters</h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            {/* Search */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Search Products
              </label>
              <input
                type="text"
                placeholder="Search by name, description, or SKU"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            {/* Category */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.product_count})
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Min Price
              </label>
              <input
                type="number"
                placeholder="0"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Max Price
              </label>
              <input
                type="number"
                placeholder="1000"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            {/* Sort */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Sort By
              </label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="">Relevance</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>

          <button
            onClick={clearFilters}
            className="btn btn-secondary"
            style={{ fontSize: '0.9rem' }}
          >
            Clear Filters
          </button>
        </div>

        {/* Results Info + View Toggle */}
        <div style={{ marginBottom: '1rem', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            {pagination.total !== undefined && (
              <>Showing {products.length} of {pagination.total} products{filters.search && ` for "${filters.search}"`}</>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className={`pagination-button ${viewMode==='grid'?'active':''}`} onClick={()=>setViewMode('grid')}>Grid</button>
            <button className={`pagination-button ${viewMode==='list'?'active':''}`} onClick={()=>setViewMode('list')}>List</button>
          </div>
        </div>

        {/* Products Grid */}
        {!mounted ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Initializing...</p>
          </div>
        ) : loading ? (
          <>
            {viewMode === 'grid' ? (
              <div className="products-grid">
                {Array.from({ length: filters.limit }).map((_, i) => (
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
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Array.from({ length: filters.limit }).map((_, i) => (
                  <div key={i} className="product-card" style={{ display: 'grid', gridTemplateColumns: '160px 1fr 180px', gap: '1rem', alignItems: 'center' }} aria-hidden>
                    <div className="skeleton" style={{ width: 160, height: 120, borderRadius: 8 }} />
                    <div>
                      <div className="skeleton skeleton-chip" style={{ width: 120, marginBottom: 8 }} />
                      <div className="skeleton skeleton-text" style={{ width: '80%', marginBottom: 8 }} />
                      <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: 16 }} />
                    </div>
                    <div>
                      <div className="skeleton" style={{ width: 120, height: 28, margin: '0 auto' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : products.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
              <div className="products-grid">
                {products
                  .slice()
                  .sort((a, b) => {
                    if (filters.sort === 'price_asc') return a.price - b.price;
                    if (filters.sort === 'price_desc') return b.price - a.price;
                    if (filters.sort === 'newest') return new Date(b.created_at) - new Date(a.created_at);
                    return 0;
                  })
                  .map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {products
                  .slice()
                  .sort((a, b) => {
                    if (filters.sort === 'price_asc') return a.price - b.price;
                    if (filters.sort === 'price_desc') return b.price - a.price;
                    if (filters.sort === 'newest') return new Date(b.created_at) - new Date(a.created_at);
                    return 0;
                  })
                  .map((product) => (
                    <div key={product.id} className="product-card" style={{ display: 'grid', gridTemplateColumns: '160px 1fr 180px', gap: '1rem', alignItems: 'center' }}>
                      <img src={product.images?.[0] || 'https://picsum.photos/160/120?random=list'} alt={product.name} className="product-image" style={{ height: 120 }} />
                      <div>
                        <div className="product-category" style={{ marginBottom: 8 }}>{product.category_name}</div>
                        <h3 className="product-name" style={{ marginBottom: 4 }}>{product.name}</h3>
                        <p className="product-description">{product.description}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div className="product-price">R {product.price?.toLocaleString?.('en-ZA') || product.price}</div>
                        <button className="btn btn-primary" onClick={()=>window.dispatchEvent(new CustomEvent('quickview:open', { detail: { product } }))}>Quick View</button>
                        <a className="btn btn-secondary" href={`/products/${product.id}`}>View</a>
                      </div>
                    </div>
                  ))}
              </div>
            )}

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
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <h3>No products found</h3>
            <p>Try adjusting your filters or search terms.</p>
          </div>
        )}

        {/* Quick View Modal */}
        <QuickViewModal
          product={quickView.product}
          isOpen={quickView.isOpen}
          onClose={() => setQuickView({ isOpen: false, product: null })}
          onAddToCart={(p) => window.dispatchEvent(new CustomEvent('cart:add', { detail: { product: p } }))}
        />
      </div>
    </Layout>
  );
}
