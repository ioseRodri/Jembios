import "./Contacto.css";

export default function Contacto() {
  return (
    <div className="contacto-container">
      
      

      {/* Sección principal */}
      <div className="contacto-content">
        <div className="contacto-texto">
          <span className="subtitulo">Póngase en contacto</span>
          <h2>Ponte en contacto</h2>
          <p>
            Comunícate con nuestro equipo y recibe asesoría especializada en
            insumos, reactivos y equipos médicos de última tecnología. En
            <strong> JEMBIOS</strong>, estamos listos para brindarte soluciones
            confiables y personalizadas para tu laboratorio.
          </p>
        </div>

        <div className="contacto-tarjetas">
          <div className="tarjeta-info">
            <h3>Oficina</h3>
            <p>
              <span className="dot">•</span> Mza. V lote. 4 int. 202 A.H. Juan Pablo II Lima – Lima – Carabayllo.
            </p>

            <h3>Email</h3>
            <p>
              <span className="dot">•</span> jembios@hotmail.com
            </p>

            <h3>Horario de Atención</h3>
            <p>
              <span className="dot">•</span> Lun – Sab 8:00 am – 18:00 pm
            </p>
          </div>

          <div className="tarjeta-llamanos">
            <h2>Llámanos</h2>
            <p>Atención al Cliente</p>
          </div>
        </div>
      </div>
    </div>
  );
}
