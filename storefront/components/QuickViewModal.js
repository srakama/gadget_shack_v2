import SafeImage from './SafeImage';
import { formatPrice, truncateText } from '../lib/api';

export default function QuickViewModal({ product, isOpen, onClose, onAddToCart }) {
  if (!isOpen || !product) return null;
  const primaryImage = product.images?.[0] || 'https://picsum.photos/400/300?random=quickview';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ position: 'relative', width: '100%', height: '300px', overflow: 'hidden', borderRadius: '8px' }}>
            <SafeImage
              src={primaryImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </div>
          <div>
            <div className="product-category" style={{ marginBottom: 8 }}>{product.category_name}</div>
            <h3 style={{ margin: '0 0 8px 0' }}>{product.name}</h3>
            <div style={{ fontWeight: 800, color: '#2563eb', marginBottom: 8 }}>{formatPrice(product.price)}</div>
            <p style={{ color: '#6b7280', marginBottom: 12 }}>{truncateText(product.description, 120)}</p>
            <button className="btn btn-primary" onClick={() => onAddToCart(product)}>Add to Cart</button>
          </div>
        </div>
      </div>
    </div>
  );
}

