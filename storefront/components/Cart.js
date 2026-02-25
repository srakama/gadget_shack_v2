import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../lib/api';

export default function Cart({ isOpen, onClose }) {
  const { items, updateQuantity, removeFromCart, getCartTotal, getCartItemCount } = useCart();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="cart-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999
        }}
      />
      
      {/* Cart Sidebar */}
      <div 
        className="cart-sidebar"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '400px',
          height: '100vh',
          backgroundColor: 'white',
          boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
            Shopping Cart ({getCartItemCount()})
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            ×
          </button>
        </div>

        {/* Cart Items */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem'
        }}>
          {items.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#6b7280'
            }}>
              <p>Your cart is empty</p>
              <Link href="/products">
                <button className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  Continue Shopping
                </button>
              </Link>
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <CartItem 
                  key={item.cartId}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeFromCart}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{
            padding: '1rem',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              fontSize: '1.125rem',
              fontWeight: 'bold'
            }}>
              <span>Total:</span>
              <span>{formatPrice(getCartTotal())}</span>
            </div>
            
            <Link href="/checkout">
              <button 
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: '0.5rem' }}
                onClick={onClose}
              >
                Proceed to Checkout
              </button>
            </Link>
            
            <button 
              className="btn btn-secondary"
              style={{ width: '100%' }}
              onClick={onClose}
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function CartItem({ item, onUpdateQuantity, onRemove }) {
  return (
    <div style={{
      display: 'flex',
      gap: '1rem',
      padding: '1rem 0',
      borderBottom: '1px solid #e5e7eb'
    }}>
      {/* Product Image */}
      <div style={{ flexShrink: 0 }}>
        {item.image ? (
          <img 
            src={item.image}
            alt={item.name}
            style={{
              width: '60px',
              height: '60px',
              objectFit: 'cover',
              borderRadius: '4px'
            }}
          />
        ) : (
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#f3f4f6',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            color: '#6b7280'
          }}>
            No Image
          </div>
        )}
      </div>

      {/* Product Details */}
      <div style={{ flex: 1 }}>
        <h4 style={{ 
          margin: '0 0 0.25rem 0', 
          fontSize: '0.875rem',
          fontWeight: '500'
        }}>
          {item.name}
        </h4>
        
        <p style={{ 
          margin: '0 0 0.5rem 0', 
          fontSize: '0.75rem',
          color: '#6b7280'
        }}>
          SKU: {item.sku}
        </p>

        {(item.selectedSize || item.selectedColor) && (
          <p style={{ 
            margin: '0 0 0.5rem 0', 
            fontSize: '0.75rem',
            color: '#6b7280'
          }}>
            {item.selectedSize && `Size: ${item.selectedSize}`}
            {item.selectedSize && item.selectedColor && ' | '}
            {item.selectedColor && `Color: ${item.selectedColor}`}
          </p>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontWeight: '500' }}>
            {formatPrice(item.price)}
          </span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => onUpdateQuantity(item.cartId, item.quantity - 1)}
              style={{
                width: '24px',
                height: '24px',
                border: '1px solid #d1d5db',
                background: 'white',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              -
            </button>
            
            <span style={{ 
              minWidth: '20px', 
              textAlign: 'center',
              fontSize: '0.875rem'
            }}>
              {item.quantity}
            </span>
            
            <button
              onClick={() => onUpdateQuantity(item.cartId, item.quantity + 1)}
              style={{
                width: '24px',
                height: '24px',
                border: '1px solid #d1d5db',
                background: 'white',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              +
            </button>
            
            <button
              onClick={() => onRemove(item.cartId)}
              style={{
                marginLeft: '0.5rem',
                color: '#ef4444',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
