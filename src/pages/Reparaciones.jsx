import { useEffect, useMemo, useState } from "react";
import {
  createReparacion,
  deleteReparacion,
  getClientesParaReparaciones,
  getEquiposParaReparaciones,
  getReparaciones,
  updateReparacion
} from "../services/reparaciones.js";
import "../styles/reparaciones.css";

const estados = [
  "Recibido",
  "En diagnóstico",
  "Presupuestado",
  "Aprobado",
  "En reparación",
  "Terminado",
  "Entregado"
];

const emptyForm = {
  clienteId: "",
  equipoId: "",
  fechaIngreso: new Date().toISOString().slice(0, 10),
  motivo: "",
  observaciones: "",
  diagnostico: "",
  trabajoRealizado: "",
  estado: "Recibido",
  garantia: "A verificar",
  manoObra: "0",
  repuestos: []
};

function Reparaciones() {
  const [items, setItems] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [query, setQuery] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [reparacionesData, clientesData, equiposData] = await Promise.all([
        getReparaciones({ page: 1, limit: 100, q: query, estado: estadoFiltro }),
        getClientesParaReparaciones(),
        getEquiposParaReparaciones()
      ]);
      setItems(reparacionesData.items || []);
      setClientes(clientesData);
      setEquipos(equiposData);
    } catch (err) {
      setError(err.message || "No se pudieron cargar las reparaciones.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [query, estadoFiltro]);

  const equiposDelCliente = useMemo(
    () => equipos.filter((equipo) => String(equipo.clienteId) === String(form.clienteId)),
    [equipos, form.clienteId]
  );

  const clienteNombre = (id) => {
    const cliente = clientes.find((item) => String(item.id) === String(id));
    return cliente ? `${cliente.nombre} ${cliente.apellido}` : "Cliente no disponible";
  };

  const equipoNombre = (id) => {
    const equipo = equipos.find((item) => String(item.id) === String(id));
    return equipo ? `${equipo.tipo} ${equipo.marca} ${equipo.modelo}` : "Equipo no disponible";
  };

  function openCreate() {
    setError("");
    setForm({ ...emptyForm, clienteId: String(clientes[0]?.id || "") });
    setEditor({ mode: "create" });
  }

  function openEdit(item) {
    setError("");
    setForm({
      ...emptyForm,
      ...item,
      clienteId: String(item.clienteId),
      equipoId: String(item.equipoId),
      manoObra: String(item.manoObra ?? 0),
      repuestos: item.repuestos || []
    });
    setEditor({ mode: "edit", id: item.id });
  }

  function changeField(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "clienteId" ? { equipoId: "" } : {})
    }));
  }

  function addRepuesto() {
    setForm((current) => ({
      ...current,
      repuestos: [...current.repuestos, { descripcion: "", cantidad: "1", precio: "0" }]
    }));
  }

  function updateRepuesto(index, field, value) {
    setForm((current) => ({
      ...current,
      repuestos: current.repuestos.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    }));
  }

  function removeRepuesto(index) {
    setForm((current) => ({
      ...current,
      repuestos: current.repuestos.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  const totalRepuestos = form.repuestos.reduce(
    (total, item) => total + Number(item.cantidad || 0) * Number(item.precio || 0),
    0
  );
  const total = totalRepuestos + Number(form.manoObra || 0);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!form.clienteId || !form.equipoId || !form.motivo.trim()) {
      setError("Seleccioná un cliente, un equipo y completá el motivo de ingreso.");
      return;
    }

    if (!equiposDelCliente.some((item) => String(item.id) === String(form.equipoId))) {
      setError("El equipo seleccionado no pertenece al cliente indicado.");
      return;
    }

    const payload = {
      ...form,
      clienteId: Number(form.clienteId),
      equipoId: Number(form.equipoId),
      manoObra: Number(form.manoObra),
      repuestos: form.repuestos.map((item) => ({
        descripcion: item.descripcion.trim(),
        cantidad: Number(item.cantidad),
        precio: Number(item.precio)
      })),
      total
    };

    setSaving(true);
    try {
      if (editor.mode === "create") {
        await createReparacion(payload);
        setNotice("Orden de reparación registrada correctamente.");
      } else {
        await updateReparacion(editor.id, payload);
        setNotice("Orden de reparación actualizada correctamente.");
      }
      setEditor(null);
      await loadData();
    } catch (err) {
      setError(err.message || "No se pudo guardar la reparación.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`¿Eliminar la orden #${item.id}?`)) return;
    setError("");
    setNotice("");
    try {
      await deleteReparacion(item.id);
      setNotice("Orden eliminada correctamente.");
      await loadData();
    } catch (err) {
      setError(err.message || "No se pudo eliminar la orden.");
    }
  }

  const counts = {
    abiertas: items.filter((item) => !["Terminado", "Entregado"].includes(item.estado)).length,
    diagnostico: items.filter((item) => item.estado === "En diagnóstico").length,
    reparacion: items.filter((item) => item.estado === "En reparación").length,
    terminadas: items.filter((item) => ["Terminado", "Entregado"].includes(item.estado)).length
  };

  return (
    <section className="rep-section" id="reparaciones">
      <div className="rep-heading">
        <div>
          <p className="eyebrow">GESTIÓN DEL TALLER</p>
          <h2>Órdenes de reparación</h2>
          <p className="section-description">Registrá ingresos, diagnósticos y presupuestos de cada equipo.</p>
        </div>
        <button className="rep-primary" onClick={openCreate}>＋ Nueva reparación</button>
      </div>

      <div className="rep-stats">
        <article><span>Órdenes abiertas</span><strong>{counts.abiertas}</strong></article>
        <article><span>En diagnóstico</span><strong>{counts.diagnostico}</strong></article>
        <article><span>En reparación</span><strong>{counts.reparacion}</strong></article>
        <article><span>Finalizadas</span><strong>{counts.terminadas}</strong></article>
      </div>

      <div className="rep-toolbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por cliente, equipo o motivo..." />
        <select value={estadoFiltro} onChange={(event) => setEstadoFiltro(event.target.value)}>
          <option value="">Todos los estados</option>
          {estados.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
        </select>
      </div>

      {error && <div className="rep-alert rep-error">{error}</div>}
      {notice && <div className="rep-alert rep-success">{notice}</div>}

      {loading ? (
        <div className="rep-empty">Cargando órdenes...</div>
      ) : items.length === 0 ? (
        <div className="rep-empty">No hay órdenes de reparación para mostrar.</div>
      ) : (
        <div className="rep-table-wrap">
          <table className="rep-table">
            <thead>
              <tr>
                <th>Orden</th><th>Cliente</th><th>Equipo</th><th>Ingreso</th><th>Estado</th><th>Total</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>#{item.id}</td>
                  <td>{clienteNombre(item.clienteId)}</td>
                  <td>{equipoNombre(item.equipoId)}</td>
                  <td>{item.fechaIngreso}</td>
                  <td><span className="rep-status">{item.estado}</span></td>
                  <td>${Number(item.total || 0).toLocaleString("es-AR")}</td>
                  <td className="rep-actions">
                    <button onClick={() => openEdit(item)}>Editar</button>
                    <button className="rep-delete" onClick={() => handleDelete(item)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editor && (
        <div className="rep-modal-backdrop">
          <form className="rep-modal" onSubmit={handleSubmit}>
            <div className="rep-modal-heading">
              <div>
                <p className="eyebrow">{editor.mode === "create" ? "NUEVO INGRESO" : `ORDEN #${editor.id}`}</p>
                <h3>{editor.mode === "create" ? "Registrar reparación" : "Editar reparación"}</h3>
              </div>
              <button type="button" className="rep-close" onClick={() => setEditor(null)}>×</button>
            </div>

            <div className="rep-form-grid">
              <label>Cliente
                <select name="clienteId" value={form.clienteId} onChange={changeField} required>
                  <option value="">Seleccionar cliente</option>
                  {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nombre} {cliente.apellido}</option>)}
                </select>
              </label>
              <label>Equipo
                <select name="equipoId" value={form.equipoId} onChange={changeField} required>
                  <option value="">Seleccionar equipo</option>
                  {equiposDelCliente.map((equipo) => <option key={equipo.id} value={equipo.id}>{equipo.tipo} · {equipo.marca} {equipo.modelo}</option>)}
                </select>
              </label>
              <label>Fecha de ingreso
                <input type="date" name="fechaIngreso" value={form.fechaIngreso} onChange={changeField} required />
              </label>
              <label>Estado
                <select name="estado" value={form.estado} onChange={changeField}>
                  {estados.map((estado) => <option key={estado}>{estado}</option>)}
                </select>
              </label>
              <label className="rep-full">Motivo de ingreso
                <input name="motivo" value={form.motivo} onChange={changeField} placeholder="Ej. No enciende, pérdida de potencia..." required />
              </label>
              <label className="rep-full">Observaciones de recepción
                <textarea name="observaciones" value={form.observaciones} onChange={changeField} rows="2" />
              </label>
              <label className="rep-full">Diagnóstico técnico
                <textarea name="diagnostico" value={form.diagnostico} onChange={changeField} rows="3" placeholder="Falla detectada y evaluación técnica..." />
              </label>
              <label className="rep-full">Trabajo a realizar / realizado
                <textarea name="trabajoRealizado" value={form.trabajoRealizado} onChange={changeField} rows="2" />
              </label>
              <label>Mano de obra ($)
                <input type="number" min="0" step="0.01" name="manoObra" value={form.manoObra} onChange={changeField} />
              </label>
              <label>Garantía
                <select name="garantia" value={form.garantia} onChange={changeField}>
                  <option>A verificar</option><option>En garantía</option><option>Fuera de garantía</option>
                </select>
              </label>
            </div>

            <div className="rep-parts-heading">
              <h4>Repuestos del presupuesto</h4>
              <button type="button" onClick={addRepuesto}>＋ Agregar repuesto</button>
            </div>
            {form.repuestos.map((item, index) => (
              <div className="rep-part-row" key={index}>
                <input aria-label="Descripción del repuesto" placeholder="Descripción" value={item.descripcion} onChange={(event) => updateRepuesto(index, "descripcion", event.target.value)} />
                <input aria-label="Cantidad" type="number" min="1" value={item.cantidad} onChange={(event) => updateRepuesto(index, "cantidad", event.target.value)} />
                <input aria-label="Precio unitario" type="number" min="0" step="0.01" value={item.precio} onChange={(event) => updateRepuesto(index, "precio", event.target.value)} />
                <button type="button" className="rep-delete" onClick={() => removeRepuesto(index)}>Quitar</button>
              </div>
            ))}
            <div className="rep-total">Total estimado: <strong>${total.toLocaleString("es-AR")}</strong></div>
            <div className="rep-modal-actions">
              <button type="button" className="rep-secondary" onClick={() => setEditor(null)}>Cancelar</button>
              <button className="rep-primary" disabled={saving}>{saving ? "Guardando..." : "Guardar orden"}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

export default Reparaciones;
