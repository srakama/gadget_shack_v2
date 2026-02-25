export function ProductCardSkeleton() {
  return (
    <div className="product-card" aria-hidden>
      <div className="skeleton" style={{ height: 240 }} />
      <div className="product-info">
        <div className="skeleton skeleton-chip" style={{ width: 120, marginBottom: 8 }} />
        <div className="skeleton skeleton-text" style={{ width: '80%', marginBottom: 8 }} />
        <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: 16 }} />
        <div className="skeleton" style={{ width: 120, height: 28, marginBottom: 12 }} />
        <div className="skeleton" style={{ width: '100%', height: 36, borderRadius: 8 }} />
      </div>
    </div>
  );
}

export function ProductsGridSkeleton({ count = 12 }) {
  return (
    <div className="products-grid">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="container">
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
          <div className="skeleton skeleton-text" style={{ width: '80%', marginBottom: 8 }} />
          <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: 24 }} />
          <div className="skeleton" style={{ width: 180, height: 28, marginBottom: 24 }} />
          <div className="skeleton" style={{ width: '100%', height: 120, borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );
}

