import "./Ventas.css";

export default function Ventas() {
  return (
    <section className="ventas-section">
      {/* Fondo con superposición azul */}
      <div className="ventas-overlay"></div>

      {/* Imagen de fondo */}
      <img
        src="https://media.istockphoto.com/id/1402332215/es/v%C3%ADdeo/cient%C3%ADfico-del-laboratorio-de-ciencias-m%C3%A9dicas-mirando-la-muestra-bajo-el-microscopio.jpg?s=640x640&k=20&c=kKFf_uceA0P-xLitY0jjdoO9iajEGJLcNwVnI5HXiFk="
        alt="Doctora profesional"
        className="ventas-bg"
      />

      {/* Contenido */}
      <div className="ventas-content">
        <div className="ventas-text">
          <p className="ventas-subtitle">Dirigido por expertos apasionados.</p>

          <h1 className="ventas-title">
            Equipos, reactivos, materiales e insumos médicos para laboratorio
            clínico.
          </h1>

          <p className="ventas-desc">
            Tecnología Europea en el Perú: Distribuidores Exclusivos QCA
          </p>
        </div>

        <div className="ventas-image">
          <img
            src="https://media.istockphoto.com/id/1402332215/es/v%C3%ADdeo/cient%C3%ADfico-del-laboratorio-de-ciencias-m%C3%A9dicas-mirando-la-muestra-bajo-el-microscopio.jpg?s=640x640&k=20&c=kKFf_uceA0P-xLitY0jjdoO9iajEGJLcNwVnI5HXiFk="
            alt="Doctora laboratorio"
          />
        </div>
      </div>
    </section>
  );
}
