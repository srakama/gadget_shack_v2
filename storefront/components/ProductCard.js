import Link from 'next/link';
import SafeImage from './SafeImage';
import { formatPrice, truncateText } from '../lib/api';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();

  const {
    id,
    sku,
    name,
    description,
    price,
    images,
    sizes,
    colors,
    category_name,
    stock_quantity
  } = product;

  const primaryImage = images && images.length > 0 ? images[0] : 'https://picsum.photos/300/300?random=default';

  return (
    <div className="product-card">
      {/* Badges */}
      {stock_quantity <= 0 && (
        <div className="badge badge-danger" title="Out of stock">Out of stock</div>
      )}
      {product?.compare_at_price && product.compare_at_price > price && (
        <div className="badge badge-sale" title={`On sale: ${Math.round((1 - price / product.compare_at_price) * 100)}% off`}>
          -{Math.round((1 - price / product.compare_at_price) * 100)}%
        </div>
      )}

      <Link href={`/products/${id}`}>
        <div style={{ position: 'relative', width: '100%', height: '200px', overflow: 'hidden', borderRadius: '8px' }}>
          <SafeImage
            src={primaryImage}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </Link>

      <div className="product-info">
        <div className="product-category">{category_name}</div>

        <Link href={`/products/${id}`}>
          <h3 className="product-name">{name}</h3>
        </Link>

        <p className="product-description">
          {truncateText(description, 80)}
        </p>

        <div className="product-price">
          {formatPrice(price)}
          {product?.compare_at_price && product.compare_at_price > price && (
            <span style={{ marginLeft: '0.5rem', color: '#9ca3af', textDecoration: 'line-through', fontSize: '0.9rem' }} title="Compare at price">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>

        <div className="product-meta">
          <span>SKU: {sku}</span>
          <span>Stock: {stock_quantity}</span>
        </div>

        {sizes && sizes.length > 0 && (
          <div className="product-meta">
            <span>Sizes: {Array.isArray(sizes) ? sizes.join(', ') : sizes}</span>
          </div>
        )}

        {colors && colors.length > 0 && (
          <div className="product-meta">
            <span>Colors: {Array.isArray(colors) ? colors.join(', ') : colors}</span>
          </div>
        )}

        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <Link href={`/products/${id}`}>
            <button className="btn btn-secondary" style={{ flex: 1 }}>
              View Details
            </button>
          </Link>

          <button
            className="btn btn-primary"
            style={{ flex: 1, opacity: stock_quantity <= 0 ? 0.6 : 1 }}
            onClick={(e) => {
              e.preventDefault();
              if (stock_quantity <= 0) return;
              addToCart(product, 1);
            }}
            disabled={stock_quantity <= 0}
          >
            {stock_quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>

          <button
            className="btn"
            style={{ flex: 1, border: '1px solid #e5e7eb' }}
            onClick={(e) => {
              e.preventDefault();
              const event = new CustomEvent('quickview:open', { detail: { product } });
              window.dispatchEvent(event);
            }}
          >
            Quick View
          </button>
        </div>
      </div>
    </div>
  );
}
