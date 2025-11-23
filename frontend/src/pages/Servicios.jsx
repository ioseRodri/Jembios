import { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import "./Servicios.css";


const emailEmpresa = "jembios@hotmail.com";


const generarMailTo = (asunto, cuerpo) => {
  const asuntoEnc = encodeURIComponent(asunto);
  const cuerpoEnc = encodeURIComponent(cuerpo);
  return `mailto:${emailEmpresa}?subject=${asuntoEnc}&body=${cuerpoEnc}`;
};

export default function Servicios() {
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  
  const navigate = useNavigate();

  
  const handleServiceClick = (title) => {
    let mailtoLink = "";

    switch (title) {
      case "Asesoría":
        mailtoLink = generarMailTo(
          "Solicitud de Asesoría",
          "Deseo una asesoría"
        );
        window.location.href = mailtoLink;
        break;

      case "Mantenimiento":
        mailtoLink = generarMailTo(
          "Solicitud de Mantenimiento",
          "Necesito mantenimiento en mi equipo: "
        );
        window.location.href = mailtoLink;
        break;

      case "Orientación y":
        mailtoLink = generarMailTo(
          "Solicitud de Capacitación",
          "Deseo capacitarme en el uso de "
        );
        window.location.href = mailtoLink;
        break;

      case "Venta de Repuestos":
        
        navigate("/productos");
        break;

      case "Revisión y":
        mailtoLink = generarMailTo(
          "Agendar Cita de Diagnóstico",
          "Quiero agendar una cita"
        );
        window.location.href = mailtoLink;
        break;

      case "Preinstalación e":
        
        setIsModalOpen(true);
        break;

      default:
        console.warn("Servicio no reconocido:", title);
    }
  };

  
  const handleModalAsesorClick = () => {
    const mailtoLink = generarMailTo(
      "Solicitud de Asistencia de Instalación",
      "Deseo agendar la asistencia para la instalación de un equipo medico"
    );
    window.location.href = mailtoLink;
    setIsModalOpen(false); 
  };

  return (
    <section className="servicios-section">
      <div className="servicios-header">
        {/* ... (tu cabecera de servicios se mantiene igual) ... */}
        <p className="servicios-subtitle">Tecnología Médica a tu Alcance</p>
        <h2>Servicios para el óptimo funcionamiento de tu laboratorio</h2>
        <p className="servicios-desc">
          En JEMBIOS, nos aseguramos de que tu laboratorio funcione correctamente
          ofreciendo servicios de mantenimiento preventivo y correctivo en
          hematología, banco de sangre, inmunología, microscopía y más. <br />
          Nuestro equipo técnico especializado garantiza un servicio confiable,
          oportuno y respaldado por años de experiencia en tecnología médica.
        </p>
      </div>

      <div className="servicios-grid">
        {[
          {
            title: "Asesoría",
            subtitle: "especializada",
            img: "https://www.jembios.com/wp-content/uploads/2025/08/Asesoria-personalizada-1-768x887.png",
          },
          {
            title: "Mantenimiento",
            subtitle: "Preventivo y Correctivo",
            img: "https://www.jembios.com/wp-content/uploads/2025/08/Mantenimiento-preventivo-y-correctivo-768x887.png",
          },
          {
            title: "Orientación y",
            subtitle: "Capacitación",
            img: "https://www.jembios.com/wp-content/uploads/2025/08/capacitacion-768x887.png",
          },
          {
            title: "Venta de Repuestos",
            subtitle: "y Consumibles",
            img: "https://www.jembios.com/wp-content/uploads/2025/08/Sin-titulo-3-768x887.png",
          },
          {
            title: "Revisión y",
            subtitle: "Diagnóstico",
            img: "https://www.jembios.com/wp-content/uploads/2025/08/revision-y-diagnostico-768x887.png",
          },
          {
            title: "Preinstalación e",
            subtitle: "Instalación",
            img: "https://www.jembios.com/wp-content/uploads/2025/08/servicio-de-preinstalacion-768x887.png",
          },
        ].map((card, i) => (
          <div key={i} className="servicio-card">
            <img src={card.img} alt={card.title} className="servicio-img" />
            <div className="servicio-overlay">
              <div className="servicio-text">
                <h3>
                  {card.title} <span>{card.subtitle}</span>
                </h3>
                {/* 10. Botón actualizado con el nuevo manejador de clic */}
                <button
                  className="servicio-btn"
                  onClick={() => handleServiceClick(card.title)}
                >
                  Informes
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 11. EL MODAL
        Este bloque de JSX solo se mostrará si 'isModalOpen' es verdadero 
      */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()} 
          >
            <button
              className="modal-close-btn"
              onClick={() => setIsModalOpen(false)}
            >
              &times; {/* Este es el ícono 'X' */}
            </button>
            
            <h4>Instalación de Equipos</h4>
            <p>Puedes ver un video en YouTube para guiarte en el proceso:</p>
            
            <a
              href="https://www.youtube.com/watch?v=njiT7LgnVXo"
              target="_blank" 
              rel="noopener noreferrer"
              className="modal-btn youtube"
            >
              Aquí
            </a>
            
            <p className="modal-divider-text">o</p>
            
            <p>Solicita asistencia de un técnico especializado:</p>
            <button className="modal-btn asesor" onClick={handleModalAsesorClick}>
              Deseo un asesor
            </button>

          </div>
        </div>
      )}
    </section>
  );
}