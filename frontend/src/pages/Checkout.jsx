import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../store/cart.jsx';
import { apiCreateOrder } from '../services/api';
import { useUser } from '../store/user.jsx'; 
import { useState, useEffect } from 'react';
import './Checkout.css';

export default function CheckoutPage() {
  const nav = useNavigate();
  const { state } = useLocation() || {};
  const { items, clear } = useCart();
  const { usuario, login } = useUser();


  const [form, setForm] = useState({
    name: usuario?.nombre || '',
    docType: usuario?.docType || 'DNI',
    doc: usuario?.doc || '',
    email: usuario?.correo || '',
    phone: usuario?.telefono || '',
    address: usuario?.direccion || '',
    district: state?.district || usuario?.district || 'Lima Centro',
    city: usuario?.city || 'Lima',
  });

  //a
  
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  if (!items.length) {
    return (
      <div style={{ padding: 16 }}>
        <div>No hay items en el carrito.</div>
        <Link to="/">Volver al catálogo</Link>
      </div>
    );
  }

  async function submit() {
    setErr('');
    setLoading(true);
    try {
      const totalFront = items.reduce((a, it) => a + it.product.price * it.qty, 0);

const payload = {
  customer: { ...form, location: state?.location || null },
  total_amount: totalFront,       
  items: items.map(it => ({
    productId: it.product.id,
    qty: it.qty,
    unit_price: it.product.price  
  })),
};

      const res = await apiCreateOrder(payload);

      
      if (usuario) {
        login({
          ...usuario,
          nombre: form.name,
          correo: form.email,
          telefono: form.phone,
          direccion: form.address,
          district: form.district,
          city: form.city,
        });
      }

      clear();
      nav(`/order/${res.id}`);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>

      <div className="checkout-grid">
        <div className="checkout-form">
          <h3>Datos del cliente</h3>

          <input
            placeholder="Nombre completo"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
          <select
            value={form.docType}
            onChange={e => setForm({ ...form, docType: e.target.value })}
          >
            <option value="DNI">DNI</option>
            <option value="RUC">RUC</option>
          </select>
          <input
            placeholder="Documento"
            value={form.doc}
            onChange={e => setForm({ ...form, doc: e.target.value })}
          />
          <input
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
          <input
            placeholder="Teléfono"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
          />
          <input
            placeholder="Dirección (referencia)"
            value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
          />
          <input
            placeholder="Distrito"
            value={form.district}
            onChange={e => setForm({ ...form, district: e.target.value })}
          />
          <input
            placeholder="Ciudad"
            value={form.city}
            onChange={e => setForm({ ...form, city: e.target.value })}
          />

          {err && <div className="error">{err}</div>}

          {state?.location && (
            <div style={{ fontSize: 13, color: '#555' }}>
              Ubicación seleccionada: <b>{state.location.latitude.toFixed(5)}</b>,{' '}
              <b>{state.location.longitude.toFixed(5)}</b>
            </div>
          )}
        </div>

        <div className="checkout-summary">
          <h3>Resumen</h3>
          <ul>
            {items.map(it => (
              <li key={it.product.id}>
                <span>{it.product.name} x {it.qty}</span>
                <span>S/ {(it.product.price * it.qty).toFixed(2)}</span>
              </li>
            ))}
          </ul>

          <div className="total">
            Total: S/ {items.reduce((a, it) => a + it.product.price * it.qty, 0).toFixed(2)}
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <button className="btn-secondary" onClick={() => nav('/cart')}>← Volver</button>
            <button className="btn-primary" onClick={submit} disabled={loading}>
              {loading ? 'Creando...' : 'Crear orden'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}