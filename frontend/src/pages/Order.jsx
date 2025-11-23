import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGetOrder, apiPayOrder } from '../services/api';
import { jsPDF } from 'jspdf';
import './Order.css';
import StripeCheckoutModal from '../components/StripeCheckoutModal';

export default function OrderPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [showStripe, setShowStripe] = useState(false);

  async function load() {
    setErr('');
    setLoading(true);
    try {
      const d = await apiGetOrder(id);
      setData(d);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  
  
  
  const frontendTotal = data
    ? data.items.reduce((a, it) => a + it.unit_price * it.qty, 0)
    : 0;

  
  
  
  function generatePDF() {
    if (!data) return;
    const { order, items } = data;

    const doc = new jsPDF();
    const lineHeight = 8;
    let y = 20;

    const primaryColor = '#2E86C1';
    const secondaryColor = '#F2F3F4';

    doc.setFillColor(primaryColor);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor('#ffffff');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CORPORACIÓN JEM BIOS E.I.R.L.', 105, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('RUC: 20557788841', 105, 22, { align: 'center' });

    y = 40;
    doc.setTextColor('#000000');

    doc.setFont('helvetica', 'bold');
    doc.text('Factura a:', 10, y);
    doc.setFont('helvetica', 'normal');
    doc.text(order.customer_name, 40, y);
    y += lineHeight;

    doc.setFont('helvetica', 'bold');
    doc.text('Orden ID:', 10, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(order.id), 40, y);
    y += lineHeight;

    doc.setFont('helvetica', 'bold');
    doc.text('Fecha:', 10, y);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleString(), 40, y);
    y += lineHeight * 2;

    
    doc.setFillColor(secondaryColor);
    doc.rect(10, y, 190, lineHeight, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Producto', 12, y + 6);
    doc.text('Cantidad', 100, y + 6);
    doc.text('Precio Unit.', 130, y + 6);
    doc.text('Total', 170, y + 6);
    y += lineHeight;

    doc.setFont('helvetica', 'normal');
    items.forEach((it) => {
      doc.text(it.name, 12, y + 6);
      doc.text(String(it.qty), 100, y + 6);
      doc.text(`S/ ${it.unit_price.toFixed(2)}`, 130, y + 6);
      doc.text(`S/ ${(it.unit_price * it.qty).toFixed(2)}`, 170, y + 6);
      y += lineHeight;
    });

    y += lineHeight / 2;

    const totalFront = frontendTotal;

    doc.setFillColor(secondaryColor);
    doc.rect(10, y, 190, lineHeight * 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`TOTAL:`, 130, y + 10);
    doc.text(`S/ ${totalFront.toFixed(2)}`, 170, y + 10, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Gracias por su compra!', 105, 290, { align: 'center' });

    doc.save(`Factura_Orden_${order.id}.pdf`);
  }

  
  
  
  if (loading) return <div style={{ padding: 16 }}>Cargando orden...</div>;
  if (err) return <div style={{ color: 'red', padding: 16 }}>Error: {err}</div>;
  if (!data) return <div style={{ padding: 16 }}>No hay datos.</div>;

  const { order, items } = data;
  const statusClass = `status-badge status-${(order.status || '').replace(/\s+/g, '_')}`;

  return (
    <div className="order-container">
      <h2 className="order-title">Orden #{order.id}</h2>

      <div className="order-header">
        <div className="order-meta">
          <div className="status-wrap">
            <span className="status-label">Estado:</span>
            <span className={statusClass}>{order.status}</span>
          </div>

          <div>
            Cliente: <b>{order.customer_name}</b>
          </div>
        </div>

        {/* 🟦 TOTAL SOLO FRONT */}
        <div className="order-total">
          Total: S/ {frontendTotal.toFixed(2)}
        </div>
      </div>

      {/* Items */}
      <div className="items-block">
        <h3 className="items-title">Items</h3>
        <ul className="items-list">
          {items.map((it) => (
            <li key={it.id}>
              <span>
                {it.name} x {it.qty}
              </span>
              <span>S/ {(it.unit_price * it.qty).toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="actions">

        {order.status === 'awaiting_payment' && (
          <button className="btn-primary" onClick={() => setShowStripe(true)}>
            Pagar con tarjeta 💳
          </button>
        )}

        {order.status === 'paid' && (
          <button className="btn-primary" onClick={generatePDF}>
            Descargar Factura PDF
          </button>
        )}

        <Link to="/productos" className="btn-secondary">
          Volver a productos
        </Link>

        {/* 🟦 Stripe usando total FRONT */}
        {showStripe && (
          <StripeCheckoutModal
            amount={Math.round(frontendTotal * 100)} 
            onClose={() => setShowStripe(false)}
            onSuccess={async () => {
              await apiPayOrder(id, { method: 'stripe', result: 'success' });
              localStorage.setItem('trackOrderId', String(id));
              await load();
              setShowStripe(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
