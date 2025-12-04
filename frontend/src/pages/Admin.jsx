import { useState, useEffect, useMemo } from "react";
import { getJson, patchJson, http } from "../services/http";
import "../styles/admin.css";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Admin() {
  const [view, setView] = useState("pendientes");
  const [toast, setToast] = useState("");

  const [pendientes, setPendientes] = useState([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [weight, setWeight] = useState("");
  const [active, setActive] = useState(true);
  const [imagen, setImagen] = useState(null);

  const [prodList, setProdList] = useState([]);
  const [prodLoading, setProdLoading] = useState(false);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersErr, setOrdersErr] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const [showGraphModal, setShowGraphModal] = useState(false);

  const fmtLima = (value) => {
    if (!value) return "—";
    const asIso = value.includes("T") ? value : value.replace(" ", "T") + "Z";
    const d = new Date(asIso);
    return new Intl.DateTimeFormat("es-PE", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Lima",
    }).format(d);
  };

  const fetchProducts = async () => {
    setProdLoading(true);
    try {
      const rows = await http.get("/api/products").then((r) => r.data);
      setProdList(rows);
    } catch (e) {
      setToast("Error cargando productos");
      console.error(e);
    } finally {
      setProdLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    const ok = window.confirm(
      `¿Eliminar el producto #${id}? Esta acción es permanente.`
    );
    if (!ok) return;
    try {
      await http.delete(`/api/products/${id}`);
      setToast("Producto eliminado");
      fetchProducts();
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        "No se pudo eliminar (puede estar referenciado en órdenes)";
      setToast(msg);
      console.error(e);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    setOrdersErr("");
    try {
      const rows = await http.get("/api/orders").then((r) => r.data);

      const enhanced = await Promise.all(
        rows.map(async (o) => {
          try {
            const details = await http
              .get(`/api/orders/${o.id}`)
              .then((r) => r.data);
            return { ...o, total_amount: details.order?.total_amount };
          } catch (err) {
            console.error(err);
            return { ...o, total_amount: 0 };
          }
        })
      );
      setOrders(enhanced);
    } catch (e) {
      setOrdersErr("Error cargando órdenes");
      console.error(e);
    } finally {
      setOrdersLoading(false);
    }
  };

  const openOrderDetail = async (id) => {
    try {
      const data = await http.get(`/api/orders/${id}`).then((r) => r.data);
      setDetailData(data);
      setDetailOpen(true);
    } catch (e) {
      setToast("No se pudo cargar el detalle");
      setDetailData(null);
      setDetailOpen(false);
      console.error(e);
    }
  };

  const closeOrderDetail = () => {
    setDetailOpen(false);
  };

  const fetchPendientes = async () => {
    try {
      const res = await getJson("/api/marketing/productos/pendientes");
      setPendientes(res);
    } catch (err) {
      console.error(err);
    }
  };

  const aprobarProducto = async (id) => {
    try {
      await patchJson(`/api/marketing/productos/${id}/aprobar`, {});
      setToast("Producto aprobado correctamente");
      fetchPendientes();
    } catch (err) {
      console.error(err);
      setToast("Error al aprobar el producto");
    }
  };

  const rechazarProducto = async (id) => {
    try {
      await patchJson(`/api/marketing/productos/${id}/rechazar`, {});
      setToast("Producto rechazado correctamente");
      fetchPendientes();
    } catch (err) {
      console.error(err);
      setToast("Error al rechazar el producto");
    }
  };

  const handleSubmitProducto = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append("nombre", name);
      data.append("categoria", category);
      data.append("precio", price);
      data.append("stock", stock);
      data.append("weight", weight);
      data.append("active", active ? "1" : "0");
      if (imagen) data.append("imagenes", imagen);
      await http.post("/api/marketing/productos/directo", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setToast("Producto registrado correctamente");
      setView("pendientes");

      setName("");
      setCategory("");
      setPrice("");
      setStock("");
      setWeight("");
      setActive(true);
      setImagen(null);
      fetchPendientes();
    } catch (err) {
      console.error(err);
      setToast("Error al registrar el producto");
    }
  };

  const [empList, setEmpList] = useState([]);
  const [empName, setEmpName] = useState("");
  const [empRole, setEmpRole] = useState("Almacén");
  const [empStatus, setEmpStatus] = useState(true);

  const fetchEmployees = async () => {
    try {
      const rows = await http.get("/api/employees").then((r) => r.data);
      setEmpList(rows);
    } catch (e) {
      console.error(e);
      setToast("Error cargando empleados");
    }
  };

  const createEmployee = async (e) => {
    e.preventDefault();
    if (!empName.trim() || !empRole.trim()) return;
    try {
      await http.post("/api/employees", {
        name: empName.trim(),
        role: empRole.trim(),
        status: empStatus ? "ACTIVO" : "INACTIVO",
      });
      setToast("Empleado registrado");
      setEmpName("");
      setEmpRole("Almacén");
      setEmpStatus(true);
      fetchEmployees();
    } catch (err) {
      console.error(err);
      setToast("Error al registrar empleado");
    }
  };

  const toggleEmployeeStatus = async (emp) => {
    try {
      const next = emp.status === "ACTIVO" ? "INACTIVO" : "ACTIVO";
      await http.patch(`/api/employees/${emp.id}`, { status: next });
      setToast(`Empleado ${next === "ACTIVO" ? "activado" : "desactivado"}`);
      fetchEmployees();
    } catch (err) {
      console.error(err);
      setToast("Error al cambiar estado");
    }
  };

  const [taskEmployees, setTaskEmployees] = useState([]);
  const [taskOrders, setTaskOrders] = useState([]);
  const [taskList, setTaskList] = useState([]);
  const [selEmployeeId, setSelEmployeeId] = useState("");
  const [selOrderId, setSelOrderId] = useState("");
  const [selType, setSelType] = useState("Empaquetado");

  const fetchTasksData = async () => {
    try {
      const [emps, orders, tasks] = await Promise.all([
        http.get("/api/employees").then((r) => r.data),
        http
          .get("/api/orders", { params: { status: "activas" } })
          .then((r) => r.data),
        http.get("/api/tasks").then((r) => r.data),
      ]);
      setTaskEmployees(emps);
      setTaskOrders(orders);
      setTaskList(tasks);

      const computedBusy = new Set(
        tasks
          .filter((t) => {
            const status = String(t.status || "").toLowerCase();
            const type = String(t.type || "").toLowerCase();
            return t.assignee_id && status !== "done" && type !== "picking";
          })
          .map((t) => Number(t.assignee_id))
      );
      if (!selEmployeeId) {
        const firstActiveFree = emps.find(
          (x) => x.status !== "INACTIVO" && !computedBusy.has(Number(x.id))
        );
        setSelEmployeeId(firstActiveFree ? String(firstActiveFree.id) : "");
      }
      if (!selOrderId) {
        setSelOrderId(orders.length ? String(orders[0].id) : "");
      }
    } catch (e) {
      console.error(e);
      setToast("Error cargando datos de tareas");
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    const employeeIdNum = Number(selEmployeeId);
    const orderIdNum = Number(selOrderId);
    const taskType = String(selType || "").trim();
    const isBusyNow = busyEmpIds.has(employeeIdNum);
    if (isBusyNow) {
      setToast("El empleado ya tiene una tarea en curso");
      return;
    }
    if (!employeeIdNum || !orderIdNum || !taskType) {
      setToast("Selecciona empleado, orden y tipo de tarea");
      return;
    }
    const hasActiveEmp = taskEmployees.some(
      (e) => e.status !== "INACTIVO" && Number(e.id) === employeeIdNum
    );
    if (!hasActiveEmp) {
      setToast("Empleado inexistente o inactivo");
      return;
    }
    const hasOrder = taskOrders.some((o) => Number(o.id) === orderIdNum);
    if (!hasOrder) {
      setToast("Orden no encontrada o no activa");
      return;
    }
    try {
      await http.post("/api/tasks", {
        employeeId: employeeIdNum,
        orderId: orderIdNum,
        type: taskType,
      });
      setToast("Tarea asignada");
      await fetchTasksData();
    } catch (err) {
      const msg = err?.response?.data?.error || "Error al asignar tarea";
      console.error("POST /api/tasks error:", err?.response || err);
      setToast(msg);
    }
  };

  const completeTask = async (id) => {
    try {
      await http.patch(`/api/tasks/${id}/complete`);
      setToast("Tarea marcada como CUMPLIDO");
      await fetchTasksData();
    } catch (e) {
      console.error(e);
      setToast("Error al finalizar tarea");
    }
  };

  const exportOrdersToCSV = () => {
  if (orders.length === 0) {
    setToast("No hay órdenes para exportar");
    return;
  }

  const headers = ["ID", "Cliente", "Estado", "Fecha", "Total"];
  const rows = orders.map(order => [
    order.id,
    order.name || order.customer_name || "—",
    order.status,
    fmtLima(order.created_at),
    Number(order.total_amount || 0).toFixed(2)
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "ordenes.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


  useEffect(() => {
    if (view === "productos") fetchProducts();
    if (view === "ordenes") fetchOrders();
  }, [view]);

  useEffect(() => {
    if (view === "pendientes") fetchPendientes();
  }, [view]);

  useEffect(() => {
    if (view === "empleados") fetchEmployees();
  }, [view]);

  useEffect(() => {
    if (view === "tareas" || view === "historial") fetchTasksData();
  }, [view]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const uploadsBase = `${http.defaults.baseURL}/uploads/`;

  const busyEmpIds = useMemo(() => {
    return new Set(
      taskList
        .filter((t) => {
          const status = String(t.status || "").toLowerCase();
          const type = String(t.type || "").toLowerCase();
          return t.assignee_id && status !== "done" && type !== "picking";
        })
        .map((t) => Number(t.assignee_id))
    );
  }, [taskList]);

  const graphData = useMemo(() => {
    const counts = {};
    const totals = {};
    orders.forEach((o) => {
      if (!o?.created_at) return;
      const datePart = o.created_at.split("T")[0];
      counts[datePart] = (counts[datePart] || 0) + 1;
      const amt = Number(o.total_amount || 0);
      totals[datePart] = (totals[datePart] || 0) + amt;
    });
    const labels = Object.keys(counts).sort();
    return {
      ventas: {
        labels,
        datasets: [
          {
            label: "Cantidad de ventas",
            data: labels.map((d) => counts[d]),
          },
        ],
      },
      ganancias: {
        labels,
        datasets: [
          {
            label: "Ganancia total (S/)",
            data: labels.map((d) => Number(totals[d].toFixed(2))),
          },
        ],
      },
    };
  }, [orders]);

  return (
    <div className="admin-wrap">
      <aside className="admin-side">
        <h2>Administrador</h2>

        <button className="side-btn" onClick={() => setView("pendientes")}>
          Productos para alta
        </button>
        <button className="side-btn" onClick={() => setView("form")}>
          Añadir Producto
        </button>
        <hr style={{ margin: "12px 0", opacity: 0.3 }} />

        <button className="side-btn" onClick={() => setView("empleados")}>
          Registrar empleados
        </button>

        <button className="side-btn" onClick={() => setView("tareas")}>
          Asignar tareas
        </button>
        <button className="side-btn" onClick={() => setView("historial")}>
          Historial de tareas
        </button>
        <button className="side-btn" onClick={() => setView("productos")}>
          Productos registrados
        </button>
        <button className="side-btn" onClick={() => setView("ordenes")}>
          Historial de órdenes
        </button>
      </aside>

      <main className="admin-main">
        {view === "pendientes" && (
          <>
            <h1 className="admin-title">Productos Pendientes</h1>
            {pendientes.length === 0 ? (
              <p style={{ color: "#4b5563" }}>No hay productos pendientes.</p>
            ) : (
              <div className="admin-grid">
                {pendientes.map((p) => (
                  <div key={p.id_pendiente} className="admin-card">
                    <h3>{p.nombre}</h3>
                    <div className="admin-meta">
                      <p>
                        <strong>Principio activo:</strong>{" "}
                        {p.principio_activo || "-"}
                      </p>
                      <p>
                        <strong>Descripción:</strong> {p.descripcion || "-"}
                      </p>
                      <p>
                        <strong>SKU:</strong> {p.sku || "-"}
                      </p>
                      <p>
                        <strong>Categoría:</strong> {p.categoria}
                      </p>
                      <p className="admin-price">
                        <strong>Precio:</strong> S/{" "}
                        {Number(p.precio).toFixed(2)}
                      </p>
                    </div>
                    {p.imagen_url && (
                      <img
                        src={`${uploadsBase}${p.imagen_url}`}
                        alt={p.nombre}
                        className="admin-img"
                      />
                    )}
                    {p.certificado_url && (
                      <a
                        href={`${uploadsBase}${p.certificado_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#2563eb",
                          textDecoration: "underline",
                          display: "inline-block",
                          marginTop: 8,
                        }}
                      >
                        Ver certificado
                      </a>
                    )}
                    <div className="admin-actions">
                      <button
                        className="btn-approve"
                        onClick={() => aprobarProducto(p.id_pendiente)}
                      >
                        Aprobar
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => rechazarProducto(p.id_pendiente)}
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {view === "form" && (
          <>
            <h1 className="admin-title">Registrar Producto</h1>
            <form className="admin-form" onSubmit={handleSubmitProducto}>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Seleccionar categoría
                  </option>
                  <option value="accesorios">Accesorios</option>
                  <option value="analgesicos">Analgesicos</option>
                  <option value="calzado">Maquinas</option>
                  <option value="ropa">Medicamentos</option>
                </select>
              </div>
              <div className="form-row">
                <input
                  type="number"
                  placeholder="Precio"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                />
                <input
                  type="number"
                  placeholder="Peso"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                  />
                  Activo
                </label>
              </div>
              <div className="form-row">
                <label className="file-label">
                  {imagen ? "Cambiar imagen" : "Seleccionar imagen"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImagen(e.target.files[0])}
                  />
                </label>
              </div>
              {imagen && (
                <div className="preview-container">
                  <img
                    src={URL.createObjectURL(imagen)}
                    alt="Previsualización"
                    className="preview-img"
                  />
                </div>
              )}
              <button type="submit" className="btn-submit">
                Registrar Producto
              </button>
            </form>
          </>
        )}

        {view === "empleados" && (
          <>
            <h1 className="admin-title">Registrar empleados</h1>
            <form className="admin-form" onSubmit={createEmployee}>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Nombre del empleado"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  required
                />
                <select
                  value={empRole}
                  onChange={(e) => setEmpRole(e.target.value)}
                >
                  <option value="Almacén">Almacén</option>
                  <option value="Reparto">Reparto</option>
                  <option value="Calidad">Calidad</option>
                  <option value="Admin">Admin</option>
                </select>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={empStatus}
                    onChange={(e) => setEmpStatus(e.target.checked)}
                  />
                  Activo
                </label>
              </div>
              <button type="submit" className="btn-submit">
                Agregar
              </button>
            </form>
            <h2 className="admin-subtitle">Empleados</h2>
            {empList.length === 0 ? (
              <p style={{ color: "#4b5563" }}>No hay empleados aún.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empList.map((e) => (
                      <tr key={e.id}>
                        <td>{e.id}</td>
                        <td>{e.name}</td>
                        <td>{e.role}</td>
                        <td>
                          <span
                            className={`badge ${
                              e.status === "ACTIVO"
                                ? "badge-green"
                                : "badge-gray"
                            }`}
                          >
                            {e.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-link"
                            onClick={() => toggleEmployeeStatus(e)}
                          >
                            {e.status === "ACTIVO" ? "Desactivar" : "Activar"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {view === "tareas" && (
          <>
            <h1 className="admin-title">Asignar tareas</h1>
            <form className="admin-form" onSubmit={createTask}>
              <div className="form-row">
                <select
                  value={selEmployeeId}
                  onChange={(e) => setSelEmployeeId(e.target.value)}
                  required
                >
                  {taskEmployees
                    .filter((e) => e.status !== "INACTIVO")
                    .map((e) => {
                      const busy = busyEmpIds.has(Number(e.id));
                      return (
                        <option key={e.id} value={e.id} disabled={busy}>
                          {e.name} ({e.role}){busy ? " — Ocupado" : ""}
                        </option>
                      );
                    })}
                </select>
                <select
                  value={selOrderId}
                  onChange={(e) => setSelOrderId(e.target.value)}
                  required
                >
                  {taskOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      #{o.id} — {o.name || "Sin nombre"} — {o.status}
                    </option>
                  ))}
                </select>
                <select
                  value={selType}
                  onChange={(e) => setSelType(e.target.value)}
                  required
                >
                  <option value="Empaquetado">Empaquetado</option>
                  <option value="Revisión">Revisión</option>
                  <option value="Entrega">Entrega</option>
                </select>
              </div>
              <button type="submit" className="btn-submit">
                Asignar
              </button>
            </form>
            <h2 className="admin-subtitle">Tareas recientes</h2>
            {taskList.length === 0 ? (
              <p style={{ color: "#4b5563" }}>Aún no hay tareas.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Orden</th>
                      <th>Empleado</th>
                      <th>Tarea</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taskList.slice(0, 10).map((t) => {
                      const isSystem =
                        !t.assignee_id ||
                        t.assignee_id === 0 ||
                        !t.assignee_name;
                      const displayName = isSystem
                        ? "Sistema"
                        : t.assignee_name;
                      const displayType =
                        String(t.type).toLowerCase() === "picking"
                          ? "Agendado"
                          : t.type;
                      const computedUiStatus =
                        String(t.type).toLowerCase() === "picking"
                          ? "CUMPLIDO"
                          : String(t.ui_status || "").toUpperCase() ===
                            "CUMPLIDO"
                          ? "CUMPLIDO"
                          : "TRABAJANDO";
                      const isDone = computedUiStatus === "CUMPLIDO";
                      return (
                        <tr key={t.id}>
                          <td>{t.id}</td>
                          <td>#{t.order_id}</td>
                          <td>
                            {displayName}
                            {!isSystem && (
                              <span className="muted"> ({t.assignee_id})</span>
                            )}
                          </td>
                          <td>{displayType}</td>
                          <td>
                            <span
                              className={`badge ${
                                isDone ? "badge-green" : "badge-yellow"
                              }`}
                            >
                              {computedUiStatus}
                            </span>
                          </td>
                          <td>
                            {!isDone ? (
                              <button
                                className="btn-approve"
                                onClick={() => completeTask(t.id)}
                              >
                                Finalizado
                              </button>
                            ) : (
                              <span className="muted">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {taskList.length > 10 && <div style={{ marginTop: 12 }}></div>}
              </div>
            )}
          </>
        )}

        {view === "historial" && (
          <>
            <h1 className="admin-title">Historial de tareas</h1>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Orden</th>
                    <th>Empleado</th>
                    <th>Tarea</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {taskList.map((t) => {
                    const isSystem =
                      !t.assignee_id || t.assignee_id === 0 || !t.assignee_name;
                    const displayName = isSystem ? "Sistema" : t.assignee_name;
                    const displayType =
                      String(t.type).toLowerCase() === "picking"
                        ? "Agendado"
                        : t.type;
                    const computedUiStatus =
                      String(t.type).toLowerCase() === "picking"
                        ? "CUMPLIDO"
                        : String(t.ui_status || "").toUpperCase() === "CUMPLIDO"
                        ? "CUMPLIDO"
                        : "TRABAJANDO";
                    const isDone = computedUiStatus === "CUMPLIDO";
                    return (
                      <tr key={t.id}>
                        <td>{t.id}</td>
                        <td>#{t.order_id}</td>
                        <td>
                          {displayName}
                          {!isSystem && (
                            <span className="muted"> ({t.assignee_id})</span>
                          )}
                        </td>
                        <td>{displayType}</td>
                        <td>
                          <span
                            className={`badge ${
                              isDone ? "badge-green" : "badge-yellow"
                            }`}
                          >
                            {computedUiStatus}
                          </span>
                        </td>
                        <td>
                          {!isDone ? (
                            <button
                              className="btn-approve"
                              onClick={() => completeTask(t.id)}
                            >
                              Finalizado
                            </button>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 12 }}></div>
          </>
        )}

        {view === "productos" && (
          <>
            <h1 className="admin-title">Productos registrados</h1>
            {prodLoading ? (
              <p>Cargando...</p>
            ) : prodList.length === 0 ? (
              <p style={{ color: "#4b5563" }}>No hay productos registrados.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Categoría</th>
                      <th>Precio</th>
                      <th>Stock</th>
                      <th>Activo</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {prodList.map((p) => (
                      <tr key={p.id}>
                        <td>#{p.id}</td>
                        <td>{p.name || p.nombre || "-"}</td>
                        <td>{p.category || p.categoria || "-"}</td>
                        <td>
                          {p.price != null
                            ? `S/ ${Number(p.price).toFixed(2)}`
                            : "-"}
                        </td>
                        <td>{p.stock != null ? p.stock : "-"}</td>
                        <td>
                          <span
                            className={`badge ${
                              p.active ? "badge-green" : "badge-gray"
                            }`}
                          >
                            {p.active ? "ACTIVO" : "INACTIVO"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-reject"
                            onClick={() => deleteProduct(p.id)}
                            title="Eliminar producto"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {view === "ordenes" && (
          <>
            <h1 className="admin-title">Historial de órdenes</h1>
            {ordersLoading && <p>Cargando...</p>}
            {ordersErr && <p style={{ color: "red" }}>{ordersErr}</p>}
            {!ordersLoading && !ordersErr && (
              <>
                <button
                  className="btn-link"
                  style={{ marginBottom: 16 }}
                  onClick={() => setShowGraphModal(true)}
                >
                  Mostrar gráficas
                </button>
                <button
                  className="btn-link"
                  style={{ marginBottom: 16 }}
                  onClick={exportOrdersToCSV}
                >
                  Exportar órdenes
                </button>

                {orders.length === 0 ? (
                  <p style={{ color: "#4b5563" }}>
                    No hay órdenes registradas.
                  </p>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Cliente</th>
                          <th>Estado</th>
                          <th>Fecha</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o) => (
                          <tr key={o.id}>
                            <td>#{o.id}</td>
                            <td>{o.name || o.customer_name || "—"}</td>
                            <td>
                              <span className="badge">{o.status}</span>
                            </td>
                            <td>{fmtLima(o.created_at)}</td>
                            <td>
                              <button
                                className="btn-link"
                                onClick={() => openOrderDetail(o.id)}
                              >
                                Ver detalle
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {showGraphModal && (
                  <div
                    className="modal-overlay"
                    onClick={() => setShowGraphModal(false)}
                  >
                    <div
                      className="modal-content"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        className="drawer-header"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <h2 className="admin-subtitle">Gráficas de órdenes</h2>
                        <button
                          className="btn-link"
                          onClick={() => setShowGraphModal(false)}
                        >
                          Cerrar
                        </button>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <h3
                          className="admin-subtitle"
                          style={{ marginBottom: 4 }}
                        >
                          Cantidad de ventas por día
                        </h3>
                        <div
                          style={{
                            position: "relative",
                            width: "100%",
                            height: 240,
                          }}
                        >
                          <Bar
                            data={graphData.ventas}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                            }}
                          />
                        </div>
                        <h3
                          className="admin-subtitle"
                          style={{ marginTop: 24, marginBottom: 4 }}
                        >
                          Ganancia total por día
                        </h3>
                        <div
                          style={{
                            position: "relative",
                            width: "100%",
                            height: 240,
                          }}
                        >
                          <Bar
                            data={graphData.ganancias}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {detailOpen && (
                  <div className="drawer-overlay" onClick={closeOrderDetail}>
                    <aside
                      className="drawer-panel"
                      onClick={(e) => e.stopPropagation()}
                      role="dialog"
                      aria-modal="true"
                    >
                      <div className="drawer-header">
                        <h2 className="admin-subtitle">
                          Orden #{detailData?.order?.id}
                        </h2>
                        <button className="btn-link" onClick={closeOrderDetail}>
                          Cerrar
                        </button>
                      </div>
                      <div className="drawer-section">
                        <div>
                          <b>Cliente:</b>{" "}
                          {detailData?.order?.customer_name || "—"}
                        </div>
                        <div>
                          <b>Estado:</b> {detailData?.order?.status}
                        </div>
                        <div>
                          <b>Subtotal:</b> S/{" "}
                          {Number(detailData?.order?.subtotal || 0).toFixed(2)}
                        </div>
                        <div>
                          <b>Envío:</b> S/{" "}
                          {Number(
                            detailData?.order?.shipping_cost || 0
                          ).toFixed(2)}
                        </div>
                        <div>
                          <b>Descuento:</b> S/{" "}
                          {Number(
                            detailData?.order?.discount_total || 0
                          ).toFixed(2)}
                        </div>
                        <div>
                          <b>Total:</b> S/{" "}
                          {Number(detailData?.order?.total_amount || 0).toFixed(
                            2
                          )}
                        </div>
                        {detailData?.order?.created_at && (
                          <div>
                            <b>Fecha:</b> {fmtLima(detailData.order.created_at)}
                          </div>
                        )}
                      </div>
                      <h3 className="admin-subtitle" style={{ marginTop: 12 }}>
                        Items
                      </h3>
                      {detailData?.items?.length ? (
                        <div
                          className="admin-table-wrap"
                          style={{ maxHeight: 220, overflow: "auto" }}
                        >
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Producto</th>
                                <th>Cant.</th>
                                <th>Precio unit.</th>
                                <th>Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detailData.items.map((it) => (
                                <tr key={it.id}>
                                  <td>
                                    {it.name ||
                                      it.product_name ||
                                      it.product_id}
                                  </td>
                                  <td>{it.qty}</td>
                                  <td>S/ {Number(it.unit_price).toFixed(2)}</td>
                                  <td>
                                    S/{" "}
                                    {Number(it.unit_price * it.qty).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="muted">Sin items</p>
                      )}
                    </aside>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
