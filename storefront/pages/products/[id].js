import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import SafeImage from '../../components/SafeImage';
import Layout from '../../components/Layout';
import RecentlyViewed from '../../components/RecentlyViewed';
import { apiClient, formatPrice, formatDate } from '../../lib/api';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

export default function ProductPage() {
  const router = useRouter();
  const { id } = router.query;
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
      setIsAdmin(!!payload && payload.role === 'admin');
    } catch { setIsAdmin(false); }
  }, []);

  const sanitizePublic = (text) => {
    if (!text) return '';
    return text
      .replace(/techmarkit\.co\.za/ig, '')
      .replace(/techmarkit south africa/ig, '')
      .replace(/techmarkit/ig, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  const [selectedColor, setSelectedColor] = useState('');

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  // Track recently viewed products after product is loaded
  useEffect(() => {
    if (product && id) {
      try {
        const key = 'gadgetshack_recently_viewed';
        const current = JSON.parse(localStorage.getItem(key) || '[]');
        const entry = {
          id: id,
          name: product.name || '',
          image: (product.images && product.images.length > 0) ? product.images[0] : null,
          price: product.price || 0,
          timestamp: Date.now()
        };
        // Remove current product if it already exists
        const without = current.filter((x) => x.id !== id);
        // Add current product to the beginning and limit to 10 items
        const next = [entry, ...without].slice(0, 10);
        localStorage.setItem(key, JSON.stringify(next));
      } catch (error) {
        console.error('Error tracking recently viewed:', error);
      }
    }
  }, [product, id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getProduct(id);
      setProduct(data.product);
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Product not found');
      router.push('/products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Loading Product...">
        <div className="container">
          <div style={{ padding: '2rem 0' }}>
            <div className="skeleton" style={{ width: '100%', height: 24, marginBottom: 16 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
              <div>
                <div className="skeleton" style={{ width: '100%', height: 450, borderRadius: 12 }} />
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ width: 90, height: 90, borderRadius: 8 }} />
                  ))}
                </div>
              </div>
              <div>
                <div className="skeleton skeleton-chip" style={{ width: 120, marginBottom: 12 }} />
                <div className="skeleton skeleton-text" style={{ width: '70%', marginBottom: 8 }} />
                <div className="skeleton skeleton-text" style={{ width: '50%', marginBottom: 24 }} />
                <div className="skeleton" style={{ width: 180, height: 28, marginBottom: 24 }} />
                <div className="skeleton" style={{ width: '100%', height: 120, borderRadius: 8 }} />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout title="Product Not Found">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <h1>Product Not Found</h1>
            <p>The product you're looking for doesn't exist.</p>
            <button onClick={() => router.push('/products')} className="btn btn-primary">
              Back to Products
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const {
    sku,
    name,
    description,
    price,
    images,
    sizes,
    colors,
    category_name,
    stock_quantity,
    scraped_at,
    source_url
  } = product;

  const productImages = images && images.length > 0 ? images : ['https://picsum.photos/500/500?random=product'];

  return (
    <Layout title={`${name} - GadgetShack`}>
      <div className="container" style={{ paddingBottom: '90px' }}>
        {/* Breadcrumb */}
        <nav style={{
          marginBottom: '2rem',
          fontSize: '0.9rem',
          color: '#6b7280',
          background: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <a href="/" style={{
              color: '#3b82f6',
              textDecoration: 'none',
              fontWeight: '500',
              transition: 'color 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
            onMouseEnter={(e) => e.target.style.color = '#2563eb'}
            onMouseLeave={(e) => e.target.style.color = '#3b82f6'}
            >
              🏠 Home
            </a>
            <span style={{ color: '#d1d5db' }}>→</span>
            <a href="/products" style={{
              color: '#3b82f6',
              textDecoration: 'none',
              fontWeight: '500',
              transition: 'color 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
            onMouseEnter={(e) => e.target.style.color = '#2563eb'}
            onMouseLeave={(e) => e.target.style.color = '#3b82f6'}
            >
              📦 Products
            </a>
            {category_name && (
              <>
                <span style={{ color: '#d1d5db' }}>→</span>
                <span style={{
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}>
                  {category_name}
                </span>
              </>
            )}
            <span style={{ color: '#d1d5db' }}>→</span>
            <span style={{
              fontWeight: '600',
              color: '#1f2937',
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {name}
            </span>
          </div>
        </nav>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '3rem',
          marginBottom: '3rem'
        }}>
          {/* Product Images */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{
              marginBottom: '1.5rem',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '12px'
            }}>
              <div style={{ position: 'relative', height: '450px' }}>
                <SafeImage
                  src={productImages[selectedImage]}
                  alt={name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ borderRadius: '12px' }}
                />
              </div>

              {/* Image Navigation Arrows */}
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage(selectedImage > 0 ? selectedImage - 1 : productImages.length - 1)}
                    style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(0, 0, 0, 0.7)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(0, 0, 0, 0.5)';
                    }}
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setSelectedImage(selectedImage < productImages.length - 1 ? selectedImage + 1 : 0)}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(0, 0, 0, 0.7)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(0, 0, 0, 0.5)';
                    }}
                  >
                    →
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Images */}
            {productImages.length > 1 && (
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                overflowX: 'auto',
                padding: '0.5rem',
                justifyContent: 'center'
              }}>
                {productImages.map((image, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    style={{
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      transform: selectedImage === index ? 'scale(1.1)' : 'scale(1)',
                      opacity: selectedImage === index ? 1 : 0.7
                    }}
                    onMouseEnter={(e) => {
                      if (selectedImage !== index) {
                        e.currentTarget.style.opacity = '0.9';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedImage !== index) {
                        e.currentTarget.style.opacity = '0.7';
                        e.currentTarget.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    <SafeImage
                      src={image}
                      alt={`${name} ${index + 1}`}
                      width={90}
                      height={90}
                      sizes="90px"
                      style={{
                        borderRadius: '8px',
                        border: selectedImage === index ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                        flexShrink: 0,
                        boxShadow: selectedImage === index ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    {selectedImage === index && (
                      <div style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        background: '#3b82f6',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {category_name && (
              <div className="product-category" style={{ marginBottom: '1rem' }}>
                {category_name}
              </div>
            )}

            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{name}</h1>

            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb', marginBottom: '1rem' }}>
              {formatPrice(price)}
              {product?.compare_at_price && product.compare_at_price > price && (
                <span style={{ marginLeft: '0.5rem', color: '#9ca3af', textDecoration: 'line-through', fontSize: '0.9rem' }}>
                  {formatPrice(product.compare_at_price)}
                </span>
              )}
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <strong>SKU:</strong> {sku}
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <strong>Stock:</strong>
              <span style={{
                color: stock_quantity > 10 ? '#16a34a' : stock_quantity > 0 ? '#ea580c' : '#dc2626',
                marginLeft: '0.5rem'
              }}>
                {stock_quantity > 0 ? `${stock_quantity} available` : 'Out of stock'}
              </span>
            </div>

            {description && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>Description</h3>
                <p style={{ lineHeight: '1.6', color: '#666' }}>{sanitizePublic(description)}</p>
              </div>
            )}

            {/* Admin: View Original Source */}
            {isAdmin && name && (
              <div style={{
                marginBottom: '2rem',
                padding: '1rem',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                border: '2px solid #f59e0b',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>🔗</span>
                  <strong style={{ color: '#92400e' }}>Admin Only</strong>
                </div>
                {source_url && (
                  <a
                    href={source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      background: '#f59e0b',
                      borderColor: '#f59e0b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    🌐 View Original Source
                  </a>
                )}
                <a
                  href={`https://techmarkit.co.za/search?q=${encodeURIComponent(name || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  🔎 Search on TechMarkIt
                </a>
                <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '0.5rem' }}>
                  Click to view this product on the original retailer's website
                </div>
              </div>
            )}

            {/* Delivery & returns info */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Delivery & Returns</h3>
              <ul style={{ color: '#6b7280', marginLeft: '1rem' }}>
                <li>Delivery nationwide in 2–5 business days</li>
                <li>Free returns within 7 days in original packaging</li>
                <li>Order support: support@gadgetshack.co.za</li>
              </ul>
            </div>

            {sizes && sizes.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>Available Sizes:</strong> {Array.isArray(sizes) ? sizes.join(', ') : sizes}
              </div>
            )}

            {colors && colors.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <strong>Available Colors:</strong> {Array.isArray(colors) ? colors.join(', ') : colors}
              </div>
            )}

            {/* Add to Cart Section */}
            {stock_quantity > 0 && (
              <div style={{
                padding: '1.5rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#f9fafb',
                marginBottom: '2rem'
              }}>
                <h3 style={{ marginBottom: '1rem' }}>Add to Cart</h3>

                {/* Quantity Selector */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Quantity:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      style={{
                        width: '32px',
                        height: '32px',
                        border: '1px solid #d1d5db',
                        background: 'white',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      max={stock_quantity}
                      style={{
                        width: '60px',
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        textAlign: 'center'
                      }}
                    />
                    <button
                      onClick={() => setQuantity(Math.min(stock_quantity, quantity + 1))}
                      style={{
                        width: '32px',
                        height: '32px',
                        border: '1px solid #d1d5db',
                        background: 'white',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Size Selector */}
                {sizes && Array.isArray(sizes) && sizes.length > 1 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Size:
                    </label>
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        width: '100%'
                      }}
                    >
                      <option value="">Select Size</option>
                      {sizes.map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Color Selector */}
                {colors && Array.isArray(colors) && colors.length > 1 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Color:
                    </label>
                    <select
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        width: '100%'
                      }}
                    >
                      <option value="">Select Color</option>
                      {colors.map((color) => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Add to Cart Button */}
                <button
                  onClick={() => {
                    addToCart(product, quantity, selectedSize, selectedColor);
                    setQuantity(1);
                    setSelectedSize('');
                    setSelectedColor('');
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem' }}
                >
                  Add {quantity} to Cart - {formatPrice(price * quantity)}
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <button
                className="btn btn-primary"
                disabled={stock_quantity === 0}
                style={{
                  flex: 1,
                  opacity: stock_quantity === 0 ? 0.5 : 1,
                  cursor: stock_quantity === 0 ? 'not-allowed' : 'pointer'
                }}
                onClick={() => toast.success('Add to cart functionality coming soon!')}
              >
                {stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => toast.success('Wishlist functionality coming soon!')}
              >
                Add to Wishlist
              </button>
            </div>

            {scraped_at && (
              <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2rem' }}>
                Product data updated: {formatDate(scraped_at)}
              </div>
            )}
          </div>
        </div>

        {/* Recently Viewed */}
        <RecentlyViewed currentProductId={id} maxItems={6} />

        {/* Back to Products */}
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <button
            onClick={() => router.push('/products')}
            className="btn btn-secondary"
          >
            ← Back to All Products
          </button>
        </div>
        {/* Sticky Add-to-Cart Bar */}
        {stock_quantity > 0 && (
          <div className="sticky-atc">
            <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{name}</div>
                <div style={{ color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>SKU: {sku}</div>
              </div>
              <div style={{ fontWeight: 800, color: '#2563eb' }}>{formatPrice(price * quantity)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button className="quantity-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <div style={{ minWidth: '32px', textAlign: 'center' }}>{quantity}</div>
                <button className="quantity-btn" onClick={() => setQuantity(Math.min(stock_quantity, quantity + 1))}>+</button>
              </div>
              <button className="btn btn-primary" onClick={() => addToCart(product, quantity, selectedSize, selectedColor)}>
                Add to Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
