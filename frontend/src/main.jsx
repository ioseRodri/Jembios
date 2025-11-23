
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { UserProvider, useUser } from './store/user.jsx';
import { CartProvider } from './store/cart.jsx';

import Home from './pages/Home.jsx';
import Ventas from './ventas/index.jsx';
import Facturas from './facturas/index.jsx';
import Header from './components/Header.jsx';
import Nosotros from './pages/Nosotros.jsx';
import Servicios from './pages/Servicios.jsx';
import Catalogos from './pages/Catalogos.jsx';
import Contacto from './pages/Contacto.jsx';





import CartPage from './pages/Cart.jsx';
import CheckoutPage from './pages/Checkout.jsx';
import OrderPage from './pages/Order.jsx';
import TrackingPage from './pages/Tracking.jsx';


import Login from './pages/login.jsx';
import Admin from './pages/Admin.jsx';
import MarketingPage from './pages/Marketing.jsx';


function RequireAuth({ children, roles }) {
  const { usuario } = useUser(); 

  if (!usuario) return <Navigate to="/login" replace />;

  if (roles) {
    const allow = Array.isArray(roles) ? roles : [roles];
    if (!allow.includes(usuario.rol)) return <Navigate to="/" replace />;
  }

  return children;
}


function App() {
  
  
  const handleLogin = (u) => {
    localStorage.setItem('usuario', JSON.stringify(u));
    
  };

  return (
    <>
      <Header />

      <Routes>
        {/* Rutas públicas que ya tenías */}
        <Route path="/" element={<Ventas />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/productos" element={<Home />} />
        <Route path="/servicios" element={<Servicios />} />
        <Route path="/catalogos" element={<Catalogos />} />
        <Route path="/contacto" element={<Contacto />} />

        <Route path="/ventas" element={<Ventas />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order/:id" element={<OrderPage />} />
        <Route path="/tracking/:id" element={<TrackingPage />} />

        {/* Login */}
        <Route path="/login" element={<Login onLogin={handleLogin} />} />

        {/* Rutas protegidas por rol */}
        <Route
          path="/admin"
          element={
            <RequireAuth roles="Administrador">
              <Admin />
            </RequireAuth>
          }
        />
        <Route
          path="/marketing"
          element={
            <RequireAuth roles={['Marketing', 'Administrador']}>
              <MarketingPage />
            </RequireAuth>
          }
        />
      </Routes>
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <UserProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </UserProvider>
    </BrowserRouter>
  </StrictMode>
);
