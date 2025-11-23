import { createContext, useContext, useMemo, useState } from 'react';

const CartCtx = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); 

  function add(product, qty = 1) {
    setItems((prev) => {
      const ix = prev.findIndex((p) => p.product.id === product.id);
      if (ix >= 0) {
        const clone = [...prev];
        clone[ix] = { product, qty: clone[ix].qty + qty };
        return clone;
      }
      return [...prev, { product, qty }];
    });
  }
  function remove(productId) {
    setItems((prev) => prev.filter((p) => p.product.id !== productId));
  }
  function setQty(productId, qty) {
    setItems((prev) =>
      prev.map((p) => (p.product.id === productId ? { ...p, qty } : p))
    );
  }
  function clear() {
    setItems([]);
  }

  const subtotal = useMemo(
    () => items.reduce((acc, it) => acc + it.product.price * it.qty, 0),
    [items]
  );

  const value = { items, add, remove, setQty, clear, subtotal };
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
};
