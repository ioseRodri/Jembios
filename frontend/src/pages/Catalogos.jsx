import { useState } from "react";
import "./Catalogos.css";
import "@google/model-viewer";

const modelos = [
  
  
  {
    id: 1,
    nombre: "Máquina de Resonancia",
    src: "/mri-machine-jembios.glb",
    alt: "Modelo 3D de Máquina de Resonancia Magnética",
    descripcion:
      "Nuestra máquina de resonancia magnética (MRI) ofrece imágenes de alta resolución para diagnósticos precisos. Equipada con la última tecnología para el confort del paciente.",
  },
  {
    id: 2,
    nombre: "Estetoscopio",
    src: "/stethoscope-jembios.glb",
    alt: "Modelo 3D de Estetoscopio",
    descripcion:
      "Estetoscopio de grado cardiológico. Diseñado para una auscultación clara y precisa de sonidos cardíacos, pulmonares y vasculares.",
  },
  {
    id: 3,
    nombre: "Termómetro Digital",
    src: "/thermometer-jembios.glb",
    alt: "Modelo 3D de Termómetro",
    descripcion:
      "Termómetro infrarrojo sin contacto. Lecturas instantáneas y precisas, ideal para un tamizaje rápido y seguro en cualquier entorno clínico.",
  },
  {
    id: 4,
    nombre: "Máquina de Ultrasonido",
    src: "/ultrasound-machine-jembios.glb",
    alt: "Modelo 3D de Máquina de Ultrasonido",
    descripcion:
      "Sistema de ultrasonido portátil y versátil. Proporciona imágenes de alta calidad en tiempo real para una amplia gama de aplicaciones diagnósticas.",
  },
  {
    id: 5,
    nombre: "Silla de Ruedas",
    src: "/wheelchair-jembios.glb",
    alt: "Modelo 3D de Silla de Ruedas",
    descripcion:
      "Silla de ruedas ergonómica y ligera. Fabricada con materiales duraderos para ofrecer máxima movilidad y confort al paciente.",
  },
  {
    id: 6,
    nombre: "Máquina de Rayos X",
    src: "/x-ray-machine-jembios.glb",
    alt: "Modelo 3D de Máquina de Rayos X",
    descripcion:
      "Equipo de Rayos X digital de última generación. Baja dosis de radiación y alta definición de imagen para diagnósticos fiables.",
  },
];

export default function Catalogos() {
  const [selectedModel, setSelectedModel] = useState(modelos[0]);

  return (
    <div className="catalogos-container">
      <h1 className="catalogos-title">Mira nuestros equipos de catalogo</h1>

      {/* La galería de modelos 3D */}
      <div className="catalogos-content">
        {modelos.map((modelo) => (
          <div
            key={modelo.id}
            className={`catalogo-card ${
              selectedModel.id === modelo.id ? "selected" : ""
            }`}
            onClick={() => setSelectedModel(modelo)}
          >
            <model-viewer
              class="catalogo-imagen"
              src={modelo.src}
              alt={modelo.alt}
              camera-controls
              auto-rotate
              ar
              shadow-intensity="1"
            ></model-viewer>

            <h3 className="catalogo-card-title">{modelo.nombre}</h3>

            {/*
             * -------------------------------------------------
             * ¡CAMBIO IMPORTANTE!
             * La descripción ahora se renderiza DENTRO de la tarjeta
             * solo si este es el modelo seleccionado.
             * -------------------------------------------------
             */}
            {selectedModel.id === modelo.id && (
              <div className="card-description-content">
                <p>{modelo.descripcion}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/*
       * -------------------------------------------------
       * ¡CAMBIO IMPORTANTE!
       * Recuperamos tu bloque de contacto original
       * y lo ponemos al final, como un "footer".
       * -------------------------------------------------
       */}
      <div className="catalogo-contacto">
        <h2>Llámanos</h2>
        <p>Atención al Cliente: +51 999 999 999</p>
      </div>
    </div>
  );
}