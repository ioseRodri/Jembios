import "./Nosotros.css";

export default function Nosotros() {
  return (
    <section className="nosotros-section">
      {/* Fondo */}
      <div className="nosotros-hero">
        <div className="nosotros-overlay"></div>
        <img
          src="https://media.istockphoto.com/id/909908830/es/foto/microscopio-con-cristaler%C3%ADa-de-laboratorio.jpg?s=170667a&w=0&k=20&c=X7MVA3nddO8d27pW_Ixxea3rN7vh0Mfh515--0p7n1c="
          alt="Fondo laboratorio"
          className="nosotros-bg"
        />
        <div className="nosotros-hero-content">
          <p className="nosotros-top">Nosotros te proporcionamos el mejor servicio para la mejor investigación</p>
          <h1>
            Proporcionamos el mejor servicio para potenciar la investigación en laboratorio,
            <br /> ofreciendo soluciones integrales
          </h1>
        </div>
      </div>

      {/* Cards de servicios */}
      <div className="nosotros-cards">
        {[
          {
            icon: "",
            title: "Mantenimiento Correctivo y Preventivo",
            desc: "Garantizamos el funcionamiento óptimo de tus equipos con mantenimientos regulares y correctivos especializados.",
          },
          {
            icon: "",
            title: "Instalación de Equipos",
            desc: "Instalamos y configuramos equipos médicos y de laboratorio asegurando precisión y seguridad.",
          },
          {
            icon: "",
            title: "Suministros de Repuestos",
            desc: "Contamos con repuestos originales certificados para tus equipos, asegurando su durabilidad y rendimiento.",
          },
          {
            icon: "",
            title: "Entrenamiento de Uso",
            desc: "Brindamos capacitación personalizada al personal técnico y médico sobre el uso adecuado de equipos.",
          },
          {
            icon: "",
            title: "Servicio en Sitio",
            desc: "Atención técnica directa en tu laboratorio o institución médica en todo el país.",
          },
        ].map((card, index) => (
          <div className="flip-card" key={index}>
            <div className="flip-inner">
              <div className="flip-front">
                <span className="flip-icon">{card.icon}</span>
                <p>{card.title}</p>
              </div>
              <div className="flip-back">
                <p>{card.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sección de información */}
      <div className="nosotros-info-container">
        <div className="nosotros-info-left">
          <h3>¿Por qué elegir a <span>JEMBIOS</span>?</h3>
          <h2>
            Somos especialistas en tecnología médica con respaldo internacional
          </h2>
          <p>
            En JEMBIOS, ofrecemos una de las líneas más completas del mercado en insumos y equipos médicos, trabajando con marcas reconocidas internacionalmente en áreas clave como bioquímica, hematología, inmunología, uroanálisis, pruebas rápidas, gases arteriales, banco de sangre, microscopía y más.
          </p>
          <p>
            Representamos marcas líderes como QCA, Zybio, Excbio, Seamaty, Labomed, Lifotronic, VivaDiag, Urit, entre otras, lo que nos permite garantizar calidad, precisión y respaldo técnico especializado en cada solución que brindamos.
          </p>
        </div>

        <div className="nosotros-info-right">
          <div className="info-box">
            <h4>Delivery a Nivel Nacional:</h4>
            <p>
              Ofrecemos un servicio delivery rápido y confiable en todo el Perú, con entrega gratuita en Lima Metropolitana, garantizando que tus productos lleguen siempre a tiempo y en perfectas condiciones.
            </p>
          </div>

          <div className="info-box">
            <h4>Servicio de PostVenta:</h4>
            <p>
              En JEMBIOS garantizamos un soporte postventa eficaz y oportuno. Contamos con un equipo especializado en tecnología médica e ingeniería biomédica, listo para brindarte atención técnica y acompañamiento en todo momento.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
