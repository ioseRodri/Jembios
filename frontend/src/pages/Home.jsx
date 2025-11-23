import { useEffect, useState } from 'react';
import { apiGetProducts } from '../services/api';
import { useCart } from '../store/cart';
import './Home.css';

export default function Home() {
  const { add } = useCart();

  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [approved, setApproved] = useState([]);
  const [filteredApproved, setFilteredApproved] = useState([]);

  const [categories, setCategories] = useState([]);
  const [selectedCats, setSelectedCats] = useState([]);
  const [search, setSearch] = useState('');

  
  const [selectedProduct, setSelectedProduct] = useState(null);

  function openDetails(p) {
    setSelectedProduct(p);
  }

  function closeDetails() {
    setSelectedProduct(null);
  }


  useEffect(() => {
    (async () => {
      
      const data = await apiGetProducts();

      const normalProducts = data.filter(p => p.category !== 'Maquinaria Certificada');
      setProducts(normalProducts);
      setFiltered(normalProducts);

      
      const approvedData = await fetch('http://localhost:5000/api/marketing/productos/aprobados');
      const approvedProducts = await approvedData.json();

      
      setApproved(approvedProducts);
      setFilteredApproved(approvedProducts);

      
      const uniqueCats = [...new Set(normalProducts.map(p => p.category))];
      setCategories(uniqueCats);
    })();
  }, []);


  useEffect(() => {
    let result = products;
    if (selectedCats.length > 0) {
      result = result.filter(p => selectedCats.includes(p.category));
    }
    if (search.trim()) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(result);

    let approvedResult = approved;
    if (search.trim()) {
      approvedResult = approvedResult.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredApproved(approvedResult);
  }, [search, selectedCats, products, approved]);

  function toggleCat(cat) {
    setSelectedCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  }

  const getImageUrl = (p) => {
    
    if (p.imagen_url?.startsWith('http')) return p.imagen_url;

    
    if (p.imagen_url) return `http://localhost:5000/uploads/${p.imagen_url}`;

    
    return `https://via.placeholder.com/250x200?text=${encodeURIComponent(p.name)}`;
  };
  return (
    <div className="page-container">
      <aside className="sidebar">
        <input
          type="text"
          placeholder="Buscar productos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-box"
        />
        <div className="filter-section">
          {categories.map(cat => (
            <label key={cat} className="filter-item">
              <input
                type="checkbox"
                checked={selectedCats.includes(cat)}
                onChange={() => toggleCat(cat)}
              />
              {cat}
            </label>
          ))}
        </div>
      </aside>

      <main className="products-section">
        <h2>Todos los productos</h2>
        {filtered.length === 0 ? (
          <p>No hay productos disponibles.</p>
        ) : (
          <div className="product-grid">
            {filtered.map(p => (
              <div key={p.id} className="product-card">
                <img
                  src={getImageUrl(p)}
                  alt={p.name}
                  className="product-img"
                />
                <h3 className="product-name">{p.name}</h3>
                <p className="product-cat">{p.category}</p>

                <button
                  className="add-btn"
                  style={{ background: '#fff', color: '#1e3a8a', border: '1px solid #1e3a8a', marginBottom: 6 }}
                  onClick={() => openDetails(p)}
                >
                  Descripción
                </button>

                <button
                  className="add-btn"
                  onClick={() => add(p, 1)}
                  disabled={p.stock <= 0}
                >
                  Agregar al carrito
                </button>
              </div>
            ))}

          </div>
        )}

        <h2>Maquinaria Certificada</h2>
        {filteredApproved.length === 0 ? (
          <p>No hay productos aprobados disponibles.</p>
        ) : (
          <div className="product-grid">
            {filteredApproved.map(p => (
              <div key={p.id} className="product-card">
                <img
                  src={getImageUrl(p)}
                  alt={p.name}
                  className="product-img"
                />
                <h3 className="product-name">{p.name}</h3>
                <p className="product-cat">{p.category}</p>


                <button
                  className="add-btn"
                  style={{ background: '#fff', color: '#1e3a8a', border: '1px solid #1e3a8a', marginBottom: 6 }}
                  onClick={() => openDetails(p)}
                >
                  Descripción
                </button>

                
              </div>
            ))}
          </div>
        )}


        {selectedProduct && (
  <div
    onClick={closeDetails}
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: 'min(720px, 92vw)',
        maxHeight: '86vh',
        overflow: 'auto',
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        padding: 18
      }}
    >
      <div style={{ display: 'flex', gap: 16 }}>
        <img
          src={getImageUrl(selectedProduct)}
          alt={selectedProduct.name}
          style={{ width: 220, height: 180, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
        />
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 6px' }}>{selectedProduct.name}</h3>
          <div style={{ color: '#4b5563', marginBottom: 8 }}>
            {selectedProduct.category}
          </div>

          {/* Mostrar solo la descripción para Maquinaria Certificada */}
          {selectedProduct.estado === 'aprobado' && (
            <div style={{ marginBottom: 10 }}>
              <b>Descripción:</b>
              <div style={{ color: '#374151' }}>
                {selectedProduct.descripcion || 'Sin descripción disponible.'}
              </div>
            </div>
          )}

          {/* Mostrar todos los detalles para otros productos (Todos los productos) */}
          {selectedProduct.estado !== 'aprobado' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div><b>Precio:</b> {selectedProduct.price != null ? `S/ ${Number(selectedProduct.price).toFixed(2)}` : '—'}</div>
                <div><b>Stock:</b> {selectedProduct.stock ?? '—'}</div>
                <div><b>Peso:</b> {selectedProduct.weight != null ? `${selectedProduct.weight} kg` : '—'}</div>
                
              </div>
            </>
          )}

          {/* Si el producto tiene principio activo, mostrarlo */}
          {selectedProduct.principio_activo && (
            <div style={{ marginTop: 6 }}>
              <b>Principio activo:</b> {selectedProduct.principio_activo}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        
        <button
          onClick={closeDetails}
          className="add-btn"
          style={{ background: '#fff', color: '#1e3a8a', border: '1px solid #1e3a8a' }}
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
)}




      </main>
    </div>
  );
}
