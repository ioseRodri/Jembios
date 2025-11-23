
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../store/cart.jsx';
import { useUser } from '../store/user.jsx';
import { useEffect, useState } from 'react';
import './Header.css';

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { items } = useCart();
  const count = items.reduce((a, it) => a + it.qty, 0);

  
  
  
  const userCtx = useUser && typeof useUser === 'function' ? useUser() : null;
  const usuario = userCtx?.usuario ?? null;
  const logout = userCtx?.logout ?? (() => {
    
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
  });


  const [trackId, setTrackId] = useState(null);

  
  useEffect(() => {
    const id = localStorage.getItem('trackOrderId');
    setTrackId(id ? Number(id) : null);
  }, [pathname]);

  const navItems = [
    { path: '/', label: 'Inicio' },
    { path: '/nosotros', label: 'Nosotros' },
    { path: '/productos', label: 'Productos' },
    { path: '/Servicios', label: 'Servicios' },
{ path: '/Catalogos', label: 'Catalogos' },

    { path: '/contacto', label: 'Contacto' },
  ];

  const handleLogout = () => {
    
    logout();
    localStorage.removeItem('cart');
    localStorage.removeItem('trackOrderId');

    
    navigate('/login', { replace: true });
  };

  return (
    <header className="header">
      <div className="header-top">
        <div className="container">
          <span>jembios@hotmail.com</span>
          <span>Mza. V Lote. 4 Int. 202 A.H. Juan Pablo II, Lima – Carabayllo</span>
        </div>
      </div>

      <div className="header-main">
        <div className="container header-content">
          <div className="logo">
            <img src="/logo-jembios.png" alt="Jembios" />
          </div>

          <nav className="nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${pathname === item.path ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="actions">
            <button className="btn-informes">INFORMES</button>

            <Link to="/cart" className="cart-btn" aria-label="Ver carrito">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M7 4h-2l-1 2v2h2l3.6 7.59-1.35 2.41A1 1 0 0 0 9 20h10v-2H9.42l.93-1.66h7.72a1 1 0 0 0 .92-.62L22 8H6.42l-.72-2H7V4z" fill="currentColor" />
              </svg>
              <span className="cart-text">Carrito</span>
              {count > 0 && <span className="cart-badge">{count}</span>}
            </Link>

            {trackId && (
              <Link to={`/tracking/${trackId}`} className="btn-informes" style={{ background: '#28a745' }}>
                Seguimiento
              </Link>
            )}

            {!usuario ? (
              <Link
                to="/login"
                className="btn-informes"
                style={{ background: '#ffffff', color: '#1e3a8a', border: '1px solid #1e3a8a' }}
              >
                Iniciar sesión
              </Link>
            ) : (
              <>
                <span style={{ marginRight: '10px', fontWeight: 'bold' }}>
                  Hola, {usuario.nombre || usuario.correo} 👋
                </span>
                <button
                  onClick={handleLogout}
                  className="btn-informes"
                  style={{ background: '#ffffff', color: '#1e3a8a', border: '1px solid #1e3a8a' }}
                >
                  Cerrar sesión
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
