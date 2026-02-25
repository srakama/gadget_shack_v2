import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';
import { CartProvider, useCart } from '../context/CartContext';

function CartBridge() {
  const { addToCart } = useCart();
  useEffect(() => {
    const onAdd = (e) => addToCart(e.detail.product, 1);
    window.addEventListener('cart:add', onAdd);
    return () => window.removeEventListener('cart:add', onAdd);
  }, [addToCart]);
  return null;
}

function MyApp({ Component, pageProps }) {
  return (
    <CartProvider>
      <CartBridge />
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            theme: {
              primary: '#4aed88',
            },
          },
        }}
      />
    </CartProvider>
  );
}

export default MyApp;
