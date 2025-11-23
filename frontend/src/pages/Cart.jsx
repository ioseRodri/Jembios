import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../store/cart.jsx';
import { apiQuoteShipping, apiValidateCoupon } from '../services/api';
import './Cart.css';



import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';


import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({ iconUrl, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;


const ORIGIN = [-11.9523, -77.0394];


function LocationPicker({ onSelect }) {
  const [marker, setMarker] = useState(null);
  useMapEvents({
    click(e) {
      setMarker(e.latlng);
      onSelect({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
  });
  return marker ? <Marker position={marker} /> : null;
}


const DISTRICTS = ['Lima Centro', 'Lima Norte', 'Lima Sur', 'Lima Este'];

export default function CartPage() {
  const nav = useNavigate();
  const { items, setQty, remove, subtotal } = useCart();

  
  const [district, setDistrict] = useState('Lima Centro');
  const [location, setLocation] = useState(null); 
  const [ship, setShip] = useState(null);
  const [shipErr, setShipErr] = useState('');
  const [coupon, setCoupon] = useState('');
  const [couponInfo, setCouponInfo] = useState(null);
  const [couponErr, setCouponErr] = useState('');

  const amountBeforeDiscount = useMemo(() => subtotal + (ship?.cost || 0), [subtotal, ship]);
  const discount = couponInfo?.discount ? Number(couponInfo.discount) : 0;
  const total = Math.max(0, amountBeforeDiscount - discount);

  async function quote() {
    setShipErr('');
    try {
      const payload = location
        ? { location, items: items.map(it => ({ productId: it.product.id, qty: it.qty })) }
        : { district, items: items.map(it => ({ productId: it.product.id, qty: it.qty })) };

      const q = await apiQuoteShipping(payload);
      setShip(q);
    } catch (e) {
      setShipErr(String(e.message || e));
      setShip(null);
    }
  }


  async function applyCoupon() {
    setCouponErr('');
    setCouponInfo(null);
    if (!coupon) return;

    try {
      const v = await apiValidateCoupon({ code: coupon, amount: subtotal });
      if (!v.valid) {
        setCouponErr(`Cupón inválido: ${v.reason || 'desconocido'}`);
      } else {
        setCouponInfo(v);
      }
    } catch (e) {
      setCouponErr(String(e.message || e));
    }
  }

  if (items.length === 0) {
  return (
    <div className="cart-container" style={{ textAlign: 'center', padding: '40px 16px' }}>
      <h2>Tu carrito está vacío</h2>
      <p style={{ margin: '20px 0', fontSize: 18, color: '#555' }}>
        Parece que no has añadido ningún producto aún.
      </p>
      <Link
        to="/productos"
        style={{
          display: 'inline-block',
          backgroundColor: '#00a651',
          color: 'white',
          padding: '10px 24px',
          borderRadius: 6,
          textDecoration: 'none',
          fontWeight: '600',
          fontSize: 16,
          transition: 'background-color 0.3s',
        }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#00904d')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#00a651')}
      >
        Volver al catálogo
      </Link>
    </div>
  );
}


  return (

    <div className="cart-container">
      <div style={{ padding: 16 }}>
        <h2>Carrito</h2>

        <table style={{ width: '100%', marginTop: 8, borderCollapse: 'collapse' }}>
          <thead>
            <tr><th style={{ textAlign: 'left' }}>Producto</th><th>Cantidad</th><th>Precio</th><th></th></tr>
          </thead>
          <tbody>
            {items.map(({ product, qty }) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>
                  <input type="number" min="1" value={qty}
                    onChange={(e) => setQty(product.id, Number(e.target.value))}
                    style={{ width: 60 }} />
                </td>
                <td>S/ {(product.price * qty).toFixed(2)}</td>
                <td><button onClick={() => remove(product.id)}>Quitar</button></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 12 }}>
          <b>Subtotal:</b> S/ {subtotal.toFixed(2)}
        </div>

        <hr style={{ margin: '12px 0' }} />

        {/* === NUEVA SECCIÓN: cálculo de envío === */}
        <div style={{ marginTop: 16 }}>
          <h3>Calcular costo de envío</h3>

          <details open>
            <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: 6 }}>
              Selecciona tu ubicación en el mapa (o usa el distrito)
            </summary>

            <MapContainer
              center={ORIGIN}
              zoom={12}
              style={{ height: 320, width: '100%', borderRadius: 8, marginBottom: 8 }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationPicker onSelect={setLocation} />
            </MapContainer>

            {location ? (
              <div style={{ marginBottom: 8 }}>
                📍 Ubicación seleccionada: <b>{location.latitude.toFixed(4)}</b>,{' '}
                <b>{location.longitude.toFixed(4)}</b>
              </div>
            ) : (
              <div style={{ marginBottom: 8 }}>
                O selecciona un distrito manualmente:
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  style={{ marginLeft: 8 }}
                >
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}

            <button onClick={quote}>Cotizar envío</button>
            {shipErr && <span style={{ color: 'red', marginLeft: 8 }}>{shipErr}</span>}
          </details>

          {ship && (
            <div style={{ marginTop: 10 }}>
              {ship.mode === 'distance' && (
                <div>
                  <b>Envío:</b> S/ {ship.cost.toFixed(2)} (distancia: {ship.distanceKm.toFixed(2)} km)
                </div>
              )}
              {ship.mode === 'district' && (
                <div>
                  <b>Envío:</b> S/ {ship.cost.toFixed(2)} (por distrito: {ship.district})
                </div>
              )}
            </div>
          )}
        </div>


        <div style={{ marginTop: 12 }}>
          <input placeholder="Cupón (opcional)" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
          <button onClick={applyCoupon} style={{ marginLeft: 8 }}>Aplicar</button>
          {couponErr && <div style={{ color: 'red' }}>{couponErr}</div>}
          {couponInfo?.valid && <div style={{ color: 'green' }}>Descuento: S/ {couponInfo.discount.toFixed(2)}</div>}
        </div>

        <div style={{ marginTop: 12 }}>
          <b>Total:</b> S/ {total.toFixed(2)}
        </div>

        <div style={{ marginTop: 16 }}>
          <button
            onClick={() =>
              nav('/checkout', { state: { district, ship, coupon: couponInfo, location } })
            }
          >
            Continuar al checkout
          </button>
        </div>
      </div>
    </div>
  );
}
