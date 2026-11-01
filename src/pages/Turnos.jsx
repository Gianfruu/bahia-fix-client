import { useEffect, useMemo, useState } from "react";
import { createTurno, deleteTurno, getCatalogosTurnos, getTurnos, updateTurno } from "../services/turnos.js";
import "../styles/turnos.css";

const PAGE_SIZE = 10;
const emptyForm = { clienteId: "", equipoId: "", fecha: "", hora: "", motivo: "", procedencia: "Presencial", estado: "Solicitado" };
const estados = ["Solicitado", "Confirmado", "Cancelado", "Atendido"];

function Turnos() {
  const [result, setResult] = useState({ items: [], total: 0, totalPages: 1, source: "demo" });
  const [clientes, setClientes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const clientesMap = useMemo(() => new Map(clientes.map((item) => [String(item.id), `${item.nombre} ${item.apellido}`])), [clientes]);
  const equiposMap = useMemo(() => new Map(equipos.map((item) => [String(item.id), item])), [equipos]);
  const equiposDisponibles = useMemo(() => equipos.filter((item) => String(item.clienteId) === String(form.clienteId)), [equipos, form.clienteId]);

  async function load() {
    setLoading(true);
    setError("");
    try { setResult(await getTurnos({ q: query, page, limit: PAGE_SIZE })); }
    catch (err) { setError(err.message || "No se pudieron cargar los turnos."); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [query, page]);
  useEffect(() => {
    getCatalogosTurnos().then((data) => { setClientes(data.clientes); setEquipos(data.equipos); })
      .catch((err) => setError(err.message || "No se pudieron cargar clientes y equipos."));
  }, []);

  function openCreate() {
    setError(""); setNotice("");
    setForm({ ...emptyForm, clienteId: String(clientes[0]?.id || "") });
    setEditor({ mode: "create" });
  }

  function openEdit(turno) {
    setError(""); setNotice("");
    setForm({ ...turno, clienteId: String(turno.clienteId), equipoId: String(turno.equipoId) });
    setEditor({ mode: "edit", id: turno.id });
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => name === "clienteId" ? { ...current, clienteId: value, equipoId: "" } : { ...current, [name]: value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving || !editor) return;
    setSaving(true); setError("");
    const payload = {
      clienteId: Number(form.clienteId), equipoId: Number(form.equipoId),
      fecha: String(form.fecha || "").trim(), hora: String(form.hora || "").trim(),
      motivo: String(form.motivo || "").trim(), procedencia: String(form.procedencia || "").trim(), estado: form.estado
    };
    try {
      const response = editor.mode === "create" ? await createTurno(payload) : await updateTurno(editor.id, payload);
      const saved = response.record;
      setResult((current) => {
        const exists = current.items.some((item) => item.id === saved.id);
        const items = exists ? current.items.map((item) => item.id === saved.id ? saved : item) : [saved, ...current.items].slice(0, PAGE_SIZE);
        const total = editor.mode === "create" ? current.total + 1 : current.total;
        return { ...current, items, total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
      });
      setEditor(null);
      setNotice(`Turno ${editor.mode === "create" ? "registrado" : "actualizado"} correctamente.`);
    } catch (err) { setError(err.message || "No se pudo guardar el turno."); }
    finally { setSaving(false); }
  }

  async function handleDelete(turno) {
    if (!window.confirm("¿Seguro que querés eliminar este turno?")) return;
    setDeletingId(turno.id); setError("");
    try {
      await deleteTurno(turno.id);
      setResult((current) => { const items = current.items.filter((item) => item.id !== turno.id); const total = Math.max(0, current.total - 1); return { ...current, items, total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }; });
      setNotice("Turno eliminado correctamente.");
    } catch (err) { setError(err.message || "No se pudo eliminar el turno."); }
    finally { setDeletingId(null); }
  }

  function formatDate(value) {
    if (!value) return "—";
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  return (
    <section className="turnos-section" id="turnos" aria-labelledby="turnos-title">
      <div className="turnos-heading">
        <div><p className="eyebrow">AGENDA DEL TALLER</p><h2 id="turnos-title">Gestión de turnos</h2><p className="section-description">Organizá las solicitudes de atención y la recepción de equipos.</p></div>
        <span className={`data-source ${result.source === "api" ? "data-source-api" : ""}`}><span className="source-dot" />{result.source === "api" ? "API conectada" : "Datos de demostración"}</span>
      </div>
      <div className="turnos-panel">
        <div className="turnos-toolbar">
          <label className="turnos-search"><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Buscar por cliente, equipo o estado..." aria-label="Buscar turnos" /></label>
          <button type="button" className="primary-button" onClick={openCreate}>＋ Nuevo turno</button>
        </div>
        {notice && <p className="records-message success-message" role="status">{notice}</p>}
        {error && !editor && <p className="records-message error-message" role="alert">{error}</p>}
        <div className="records-summary"><strong>{result.total}</strong> turnos registrados</div>
        {loading ? <p className="records-message">Cargando turnos...</p> : result.items.length === 0 ? <p className="records-message">No se encontraron turnos.</p> : (
          <div className="records-table-wrap"><table className="records-table"><thead><tr><th>Cliente</th><th>Equipo</th><th>Fecha y hora</th><th>Motivo</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>{result.items.map((turno) => { const equipo = equiposMap.get(String(turno.equipoId)); return <tr key={turno.id}>
              <td><span className="record-primary">{clientesMap.get(String(turno.clienteId)) || `Cliente #${turno.clienteId}`}</span><span className="record-secondary">Turno #{turno.id}</span></td>
              <td><span className="record-primary">{equipo ? `${equipo.tipo} ${equipo.marca}` : `Equipo #${turno.equipoId}`}</span><span className="record-secondary">{equipo?.modelo || ""}</span></td>
              <td><span className="record-primary">{formatDate(turno.fecha)}</span><span className="record-secondary">{turno.hora} hs</span></td>
              <td>{turno.motivo}</td><td><span className={`turno-state turno-state-${turno.estado.toLowerCase()}`}>{turno.estado}</span></td>
              <td><div className="row-actions"><button type="button" className="table-action" onClick={() => openEdit(turno)}>Editar</button><button type="button" className="table-action danger-action" disabled={deletingId === turno.id} onClick={() => handleDelete(turno)}>{deletingId === turno.id ? "Eliminando..." : "Eliminar"}</button></div></td>
            </tr>; })}</tbody></table></div>
        )}
        <div className="records-pagination"><span>Página {page} de {result.totalPages}</span><div className="pagination-actions"><button type="button" className="pagination-button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Anterior</button><button type="button" className="pagination-button" disabled={page >= result.totalPages || loading} onClick={() => setPage((current) => current + 1)}>Siguiente</button></div></div>
      </div>

      {editor && <div className="detail-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setEditor(null); }}><section className="detail-dialog editor-dialog" role="dialog" aria-modal="true" aria-labelledby="turno-editor-title">
        <div className="detail-dialog-heading"><div><p className="eyebrow">GESTIÓN DE TURNOS</p><h3 id="turno-editor-title">{editor.mode === "create" ? "Registrar turno" : "Editar turno"}</h3></div><button type="button" className="close-detail" disabled={saving} onClick={() => setEditor(null)} aria-label="Cerrar">×</button></div>
        <form className="record-form turnos-form" onSubmit={handleSubmit}>
          <label>Cliente<select name="clienteId" value={form.clienteId} onChange={updateField} required><option value="">Seleccionar cliente</option>{clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nombre} {cliente.apellido}</option>)}</select></label>
          <label>Equipo<select name="equipoId" value={form.equipoId} onChange={updateField} required disabled={!form.clienteId}><option value="">Seleccionar equipo</option>{equiposDisponibles.map((equipo) => <option key={equipo.id} value={equipo.id}>{equipo.tipo} · {equipo.marca} {equipo.modelo}</option>)}</select></label>
          <label>Fecha<input type="date" name="fecha" value={form.fecha} onChange={updateField} required /></label>
          <label>Horario<input type="time" name="hora" value={form.hora} onChange={updateField} required /></label>
          <label>Motivo<input name="motivo" value={form.motivo} onChange={updateField} required maxLength="160" placeholder="Motivo de la visita" /></label>
          <label>Procedencia<select name="procedencia" value={form.procedencia} onChange={updateField} required><option>Presencial</option><option>Localidad vecina</option><option>Envío</option></select></label>
          <label>Estado<select name="estado" value={form.estado} onChange={updateField} required>{estados.map((estado) => <option key={estado}>{estado}</option>)}</select></label>
          {error && <p className="error-message turnos-form-error" role="alert">{error}</p>}
          <div className="form-actions"><button type="button" className="secondary-button" disabled={saving} onClick={() => setEditor(null)}>Cancelar</button><button type="submit" className="primary-button" disabled={saving}>{saving ? "Guardando..." : "Guardar turno"}</button></div>
        </form>
      </section></div>}
    </section>
  );
}

export default Turnos;
