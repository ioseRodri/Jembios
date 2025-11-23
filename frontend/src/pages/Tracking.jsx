import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; 
import { apiGetOrder, apiCreateComplaint } from '../services/api'; 
import './Tracking.css';


import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const Icon = L.icon({ iconUrl, shadowUrl: iconShadow, iconAnchor: [12, 41] });


const PackageIcon = L.divIcon({
    className: 'pkg-icon',
    html: '📦',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

const ORIGIN = [-11.9523, -77.0394];


function lerp(a, b, t) { return a + (b - a) * t; }

export default function TrackingPage() {
    const nav = useNavigate();
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(true);

    
    const [pos, setPos] = useState(ORIGIN);
    const [running, setRunning] = useState(false);
    const tRef = useRef(0);
    const hRef = useRef(null);

    const [askConfirm, setAskConfirm] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [reason, setReason] = useState('');

    const dest = order?.dest_lat && order?.dest_lng
        ? [Number(order.dest_lat), Number(order.dest_lng)]
        : null;

    async function load() {
        try {
            setErr('');
            setLoading(true);
            const d = await apiGetOrder(id);
            setOrder(d.order);
        } catch (e) {
            setErr(String(e.message || e));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, [id]);

    function start() {
        if (!dest) return alert('Esta orden no tiene ubicación seleccionada.');
        setRunning(true);
        setAskConfirm(false);
        setShowModal(false);
        tRef.current = 0;
        setPos(ORIGIN);
        if (hRef.current) clearInterval(hRef.current);

        
        hRef.current = setInterval(() => {
            tRef.current += 0.0025;
            const t = Math.min(1, tRef.current);
            const lat = lerp(ORIGIN[0], dest[0], t);
            const lng = lerp(ORIGIN[1], dest[1], t);
            setPos([lat, lng]);

            if (t >= 1) {
                clearInterval(hRef.current);
                setRunning(false);
                
                setAskConfirm(true);
            }
        }, 50);
    }


    function reset() {
        if (hRef.current) clearInterval(hRef.current);
        setRunning(false);
        setPos(ORIGIN);
    }

    function finishAndGoHome() {
        
        localStorage.removeItem('trackOrderId');
        nav('/');
    }

    async function confirmYes() {
        
        setAskConfirm(false);
        finishAndGoHome();
    }

    function confirmNo() {
        
        setAskConfirm(false);
        setShowModal(true);
    }

    async function submitComplaint() {
        if (!reason.trim()) {
            alert('Por favor describe el problema.');
            return;
        }
        try {
            await apiCreateComplaint({ orderId: Number(id), reason });
            
            setReason(''); 
            
            setTimeout(() => {
                setShowModal(false);
                finishAndGoHome();
            }, 5000);
        } catch (e) {
            alert(`Error al registrar reclamo: ${e.message || e}`);
        }
    }


    if (loading) return <div className="tracking-container">Cargando seguimiento...</div>;
    if (err) return <div className="tracking-container" style={{ color: 'red' }}>Error: {err}</div>;
    if (!order) return <div className="tracking-container">Orden no encontrada</div>;

    return (
        <div className="tracking-container">
            <div className="tracking-header">
                <h2>Seguimiento — Orden #{order.id}</h2>
                <div className="sub">
                    Estado: <b>{order.status}</b> · Cliente: <b>{order.customer_name}</b>
                </div>
            </div>

            <div className="tracking-mapwrap">
                <MapContainer center={ORIGIN} zoom={12} style={{ height: 420 }}>
                    <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Origen */}
                    <Marker position={ORIGIN} icon={Icon} />

                    {/* Destino */}
                    {dest && <Marker position={dest} icon={Icon} />}

                    {/* Línea */}
                    {dest && <Polyline positions={[ORIGIN, dest]} />}

                    {/* Repartidor (posición animada) */}
                    <Marker position={pos} icon={PackageIcon} />
                </MapContainer>
            </div>

            <div className="tracking-actions">
                <button disabled={!dest || running} onClick={start} className="btn-primary">Iniciar ruta</button>
                <button onClick={reset} className="btn-secondary">Reiniciar</button>
                <Link to={`/order/${order.id}`} className="btn-secondary">Volver a la orden</Link>


                {askConfirm && (
                    <div className="confirm-banner">
                        <span>¿Está conforme con el envío del paquete?</span>
                        <div className="confirm-actions">
                            <button className="btn-primary" onClick={confirmYes}>Sí</button>
                            <button className="btn-secondary" onClick={confirmNo}>No</button>
                        </div>
                    </div>
                )}

                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal">
                            <h3>Reclamo / Queja</h3>
                            <p>Describe el problema y adjunta detalles relevantes.</p>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Ej.: El producto llegó dañado, embalaje roto, etc."
                            />
                            <div className="modal-actions">
                                <button className="btn-primary" onClick={submitComplaint}>Enviar reclamo</button>
                                <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                            </div>
                            <div className="modal-footer">
                                Comunícate al <b>999-888-777</b> para coordinar tu reembolso.
                                <br />
                                Este cuadro se cerrará automáticamente en 5 segundos después de enviar el reclamo.
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {!dest && (
                <div className="warn">
                    Esta orden no tiene ubicación (lat/lng). Pide al cliente seleccionarla en el carrito.
                </div>
            )}
        </div>
    );
}
