const BASE = 'http://localhost:5000/api';

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || `Error HTTP ${res.status}`);
  }
  return res.json();
}


export const apiGetProducts = () => req('/products');


export const apiQuoteShipping = (payload) =>
  req('/shipping/quote', { method: 'POST', body: JSON.stringify(payload) });


export const apiValidateCoupon = (payload) =>
  req('/coupons/validate', { method: 'POST', body: JSON.stringify(payload) });


export const apiCreateOrder = (payload) =>
  req('/orders', { method: 'POST', body: JSON.stringify(payload) });

export const apiGetOrder = (id) => req(`/orders/${id}`);

export const apiPayOrder = (id, payload) =>
  req(`/orders/${id}/pay`, { method: 'POST', body: JSON.stringify(payload) });

export const apiCreateComplaint = (payload) =>
  req('/complaints', { method: 'POST', body: JSON.stringify(payload) });


export default {
  apiGetProducts,
  apiQuoteShipping,
  apiValidateCoupon,
  apiCreateOrder,
  apiGetOrder,
  apiPayOrder,
  apiCreateComplaint,
};
