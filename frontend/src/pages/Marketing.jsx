import { useState } from "react";
import { postForm } from "../services/http";
import "../styles/marketing.css";

export default function Marketing() {
  const [selectedTab, setSelectedTab] = useState("inicio");
  const [formData, setFormData] = useState({
    nombre: "",
    principioActivo: "",
    descripcion: "",
    sku: "",
    precio: "",
    categoria: "",
    imagenes: null,
    certificados: null,
  });
  const [status, setStatus] = useState("");
  const [previewImage, setPreviewImage] = useState(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "imagenes" && files && files[0]) {
      setPreviewImage(URL.createObjectURL(files[0]));
      setFormData({ ...formData, [name]: files[0] });
      return;
    }
    if (name === "certificados" && files && files[0]) {
      setFormData({ ...formData, [name]: files[0] });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };







  const handleAutoFillDescription = async () => {
  const productName = formData.nombre;
  if (!productName) {
    setStatus("❌ Debes ingresar el nombre del producto.");
    return;
  }

  setStatus("Generando descripción...");

  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma3:1b",  
        prompt: `Genera una descripción tecnica , corta y clara en español para un producto llamado "${productName}", destacando sus beneficios principales y características clave.`,
        stream: false,  
        format: "json",  
      })
    });

    const data = await response.json();
    console.log("Respuesta de la API:", data); 

    const responseObject = JSON.parse(data.response);

    const generatedDesc = responseObject[Object.keys(responseObject)[0]] || "Descripción no disponible."; 

    setFormData({ ...formData, descripcion: generatedDesc });
    setStatus(""); 
  } catch (err) {
    setStatus("❌ Error al generar la descripción: " + err.message);
  }
};



















  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = new FormData();
    form.append("nombre", formData.nombre);
    if (formData.principioActivo) form.append("principioActivo", formData.principioActivo);
    if (formData.descripcion) form.append("descripcion", formData.descripcion);
    if (formData.sku) form.append("sku", formData.sku);
    form.append("precio", formData.precio);
    form.append("categoria", formData.categoria);
    if (formData.imagenes) form.append("imagenes", formData.imagenes);
    if (formData.certificados) form.append("certificados", formData.certificados);

    try {
      const result = await postForm("/api/marketing/productos", form);
      if (result.ok) {
        setStatus("✅ Producto enviado a Administración correctamente");
        setFormData({
          nombre: "",
          principioActivo: "",
          descripcion: "",
          sku: "",
          precio: "",
          categoria: "",
          imagenes: null,
          certificados: null,
        });
        setPreviewImage(null);
      } else {
        setStatus("❌ Error: " + (result.error || "Desconocido"));
      }
    } catch (err) {
      setStatus("❌ Error al enviar: " + err.message);
    }
  };

  return (
    <div className="mkt-wrap">
      {/* Sidebar */}
      <aside className="mkt-side">
        <h2>Marketing</h2>
        <button
          className={`mkt-tab ${selectedTab === "inicio" ? "active" : ""}`}
          onClick={() => setSelectedTab("inicio")}
        >
          Inicio
        </button>
        <button
          className={`mkt-tab ${selectedTab === "formulario" ? "active" : ""}`}
          onClick={() => setSelectedTab("formulario")}
        >
          Formulario de Producto
        </button>
      </aside>

      {/* Main */}
      <main className="mkt-main">
        {selectedTab === "inicio" && (
          <>
            <h1 className="mkt-title">Panel de Marketing</h1>
            <div className="mkt-card">
              <p style={{ color: "#4b5563", lineHeight: 1.6 }}>
                Gestiona altas de producto con sus imágenes y certificados. Los envíos pasan
                al área de Administración para aprobación.
              </p>
            </div>
          </>
        )}

        {selectedTab === "formulario" && (
          <>
            <h1 className="mkt-title">Alta de Producto</h1>
            <div className="mkt-card">
              <form onSubmit={handleSubmit} className="mkt-grid">
                <div>
                  <label className="mkt-label">Nombre comercial</label>
                  <input className="mkt-input" name="nombre" value={formData.nombre} onChange={handleChange} required />
                </div>

                <div>
                  <label className="mkt-label">Principio activo / fórmula</label>
                  <input className="mkt-input" name="principioActivo" value={formData.principioActivo} onChange={handleChange} />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="mkt-label">Descripción técnica</label>
                  <textarea className="mkt-textarea" name="descripcion" value={formData.descripcion} onChange={handleChange} />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <button type="button" onClick={handleAutoFillDescription} className="mkt-submit">
                    Llenado automático con IA
                  </button>
                </div>


                <div>
                  <label className="mkt-label">Código SKU / interno</label>
                  <input className="mkt-input" name="sku" value={formData.sku} onChange={handleChange} />
                </div>

                <div>
                  <label className="mkt-label">Precio sugerido</label>
                  <input type="number" step="0.01" className="mkt-input" name="precio" value={formData.precio} onChange={handleChange} required />
                </div>

                <div>
                  <label className="mkt-label">Categoría</label>
                  <select className="mkt-select" name="categoria" value={formData.categoria} onChange={handleChange} required>
                    <option value="">Selecciona categoría</option>
                    <option value="medicamento">Medicamento</option>
                    <option value="suplemento">Suplemento</option>
                    <option value="cosmetico">Cosmético</option>
                  </select>
                </div>

                {/* Imagen */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <input id="imagenes" type="file" name="imagenes" accept="image/*" className="mkt-file" onChange={handleChange} />
                  <label htmlFor="imagenes" className="mkt-filelabel">Subir imágenes</label>
                  <span className="mkt-fileinfo">
                    {formData.imagenes ? formData.imagenes.name : "Ningún archivo seleccionado"}
                  </span>

                  {previewImage && (
                    <div className="mkt-preview">
                      <img className="mkt-img" src={previewImage} alt="Preview" />
                    </div>
                  )}
                </div>

                {/* Certificado */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <input id="certificados" type="file" name="certificados" accept="application/pdf" className="mkt-file" onChange={handleChange} />
                  <label htmlFor="certificados" className="mkt-filelabel">Subir certificados PDF</label>
                  <span className="mkt-fileinfo">
                    {formData.certificados ? formData.certificados.name : "Ningún archivo seleccionado"}
                  </span>
                </div>

                <div className="mkt-actions" style={{ gridColumn: "1 / -1" }}>
                  <button type="submit" className="mkt-submit">Enviar a Administración</button>
                </div>

                {status && (
                  <div className="mkt-status" style={{ gridColumn: "1 / -1" }}>
                    {status}
                  </div>
                )}
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
