
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createTurno,
  deleteTurno,
  getCatalogosTurnos,
  getResumenTurnos,
  getTurnos,
  updateEstadoTurno,
  updateTurno
} from "../services/turnos.js";
import "../styles/turnos.css";
import { downloadPdfReport } from "../utils/pdf-report.js";

const PAGE_SIZE = 10;

const emptyForm = {
  clienteId: "",
  equipoId: "",
  fecha: "",
  hora: "",
  motivo: "",
  procedencia: "Presencial",
  estado: "Solicitado"
};

const estados = ["Solicitado", "Confirmado", "Cancelado", "Atendido"];

function formatDate(value) {
  if (!value) return "—";

  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function Turnos() {
  const [result, setResult] = useState({
    items: [],
    total: 0,
    totalPages: 1,
    source: "demo"
  });

  const [summary, setSummary] = useState({
    total: 0,
    solicitados: 0,
    confirmados: 0,
    atendidos: 0,
    cancelados: 0
  });

  const [clientes, setClientes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [query, setQuery] = useState("");
  const [fecha, setFecha] = useState("");
  const [estado, setEstado] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const clientesMap = useMemo(
    () =>
      new Map(
        clientes.map((item) => [
          String(item.id),
          `${item.nombre} ${item.apellido}`
        ])
      ),
    [clientes]
  );

  const equiposMap = useMemo(
    () => new Map(equipos.map((item) => [String(item.id), item])),
    [equipos]
  );

  const equiposDisponibles = useMemo(
    () =>
      equipos.filter(
        (item) => String(item.clienteId) === String(form.clienteId)
      ),
    [equipos, form.clienteId]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [turnosData, summaryData] = await Promise.all([
        getTurnos({
          q: query,
          page,
          limit: PAGE_SIZE,
          fecha,
          estado,
          clienteId
        }),
        getResumenTurnos()
      ]);

      setResult(turnosData);
      setSummary(summaryData);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los turnos.");
    } finally {
      setLoading(false);
    }
  }, [query, page, fecha, estado, clienteId]);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  const refreshCatalogos = useCallback(async () => {
    const data = await getCatalogosTurnos();

    setClientes(data.clientes);
    setEquipos(data.equipos);

    return data;
  }, []);

  // Carga inicial de clientes y equipos sin actualizar el estado
  // directamente durante la ejecución del efecto.
  useEffect(() => {
    let cancelled = false;

    getCatalogosTurnos()
      .then((data) => {
        if (!cancelled) {
          setClientes(data.clientes);
          setEquipos(data.equipos);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err.message || "No se pudieron cargar clientes y equipos."
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function exportReport() {
    setError("");
    setNotice("");

    try {
      const firstPage = await getTurnos({
        q: query,
        page: 1,
        limit: 100,
        fecha,
        estado,
        clienteId
      });
      let records = [...firstPage.items];

      for (let currentPage = 2; currentPage <= firstPage.totalPages; currentPage += 1) {
        const response = await getTurnos({
          q: query,
          page: currentPage,
          limit: 100,
          fecha,
          estado,
          clienteId
        });
        records = records.concat(response.items);
      }

      const rows = records.map((turno) => {
        const cliente = clientesMap.get(String(turno.clienteId)) || "Cliente no disponible";
        const equipo = equiposMap.get(String(turno.equipoId));
        const equipoLabel = equipo
          ? `${equipo.tipo} ${equipo.marca} ${equipo.modelo}`
          : "Equipo no disponible";
        return [turno.id, cliente, equipoLabel, formatDate(turno.fecha), turno.hora, turno.motivo, turno.procedencia, turno.estado];
      });

      const filters = [
        query ? `Búsqueda: ${query}` : "",
        fecha ? `Fecha: ${formatDate(fecha)}` : "",
        estado ? `Estado: ${estado}` : "",
        clienteId ? `Cliente: ${clientesMap.get(String(clienteId)) || clienteId}` : ""
      ].filter(Boolean).join(" | ");

      downloadPdfReport(
        "Reporte de turnos - Bahía Fix",
        ["ID", "Cliente", "Equipo", "Fecha", "Hora", "Motivo", "Procedencia", "Estado"],
        rows,
        "reporte_turnos.pdf",
        `Generado: ${new Date().toLocaleString("es-AR")} | Registros: ${records.length}${filters ? ` | ${filters}` : ""}`,
        [0.55, 1.1, 1.55, 0.8, 0.55, 1.65, 1.2, 0.9]
      );

      setNotice(`Se descargó el reporte con ${records.length} turnos.`);
    } catch (err) {
      setError(err.message || "No se pudo generar el reporte de turnos.");
    }
  }

  function resetFilters() {
    setQuery("");
    setFecha("");
    setEstado("");
    setClienteId("");
    setPage(1);
  }

  async function openCreate() {
    setError("");
    setNotice("");

    try {
      const catalogos = await refreshCatalogos();

      setForm({
        ...emptyForm,
        clienteId: String(catalogos.clientes[0]?.id || "")
      });

      setEditor({ mode: "create" });
    } catch (err) {
      setError(
        err.message || "No se pudieron actualizar los clientes y equipos."
      );
    }
  }

  function openEdit(turno) {
    setError("");
    setNotice("");

    setForm({
      ...turno,
      clienteId: String(turno.clienteId),
      equipoId: String(turno.equipoId)
    });

    setEditor({ mode: "edit", id: turno.id });
  }

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) =>
      name === "clienteId"
        ? { ...current, clienteId: value, equipoId: "" }
        : { ...current, [name]: value }
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving || !editor) return;

    setSaving(true);
    setError("");

    const payload = {
      clienteId: Number(form.clienteId),
      equipoId: Number(form.equipoId),
      fecha: form.fecha,
      hora: form.hora,
      motivo: form.motivo.trim(),
      procedencia: form.procedencia,
      estado: form.estado
    };

    try {
      if (editor.mode === "create") {
        await createTurno(payload);
      } else {
        await updateTurno(editor.id, payload);
      }

      setEditor(null);

      setNotice(
        editor.mode === "create"
          ? "Turno registrado correctamente."
          : "Turno actualizado correctamente."
      );

      setPage(1);
      await load();
    } catch (err) {
      setError(err.message || "No se pudo guardar el turno.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(turno, nextStatus) {
    setBusyId(turno.id);
    setError("");

    try {
      await updateEstadoTurno(turno.id, nextStatus);

      setNotice(
        `Turno #${turno.id}: estado actualizado a ${nextStatus.toLowerCase()}.`
      );

      await load();
    } catch (err) {
      setError(err.message || "No se pudo actualizar el estado.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(turno) {
    if (
      !window.confirm(
        `¿Seguro que querés eliminar el turno #${turno.id}?`
      )
    ) {
      return;
    }

    setBusyId(turno.id);
    setError("");

    try {
      await deleteTurno(turno.id);

      setNotice("Turno eliminado correctamente.");

      await load();
    } catch (err) {
      setError(err.message || "No se pudo eliminar el turno.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section
      className="turnos-section"
      id="turnos"
      aria-labelledby="turnos-title"
    >
      <div className="turnos-heading">
        <div>
          <p className="eyebrow">AGENDA DEL TALLER</p>
          <h2 id="turnos-title">Gestión de turnos</h2>
          <p className="section-description">
            Organizá las solicitudes de atención y la recepción de equipos.
          </p>
        </div>

        <span
          className={`data-source ${
            result.source === "api" ? "data-source-api" : ""
          }`}
        >
          <span className="source-dot" />
          {result.source === "api"
            ? "API conectada"
            : "Datos de demostración"}
        </span>
      </div>

      <div className="turnos-stats">
        <article className="turnos-stat">
          <span>Total registrados</span>
          <strong>{summary.total}</strong>
        </article>

        <article className="turnos-stat">
          <span>Solicitados</span>
          <strong>{summary.solicitados}</strong>
        </article>

        <article className="turnos-stat">
          <span>Confirmados</span>
          <strong>{summary.confirmados}</strong>
        </article>

        <article className="turnos-stat">
          <span>Atendidos</span>
          <strong>{summary.atendidos}</strong>
        </article>
      </div>

      <div className="turnos-panel">
        <div className="turnos-toolbar">
          <label className="turnos-search">
            <span aria-hidden="true">⌕</span>

            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar cliente, equipo o motivo..."
              aria-label="Buscar turnos"
            />
          </label>

          <div className="turnos-toolbar-actions">
            <button type="button" className="secondary-button" onClick={exportReport} disabled={loading}>
              Exportar PDF
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={openCreate}
            >
              ＋ Nuevo turno
            </button>
          </div>
        </div>

        <div className="turnos-filters">
          <label>
            Fecha de agenda
            <input
              type="date"
              value={fecha}
              onChange={(event) => {
                setFecha(event.target.value);
                setPage(1);
              }}
            />
          </label>

          <label>
            Estado
            <select
              value={estado}
              onChange={(event) => {
                setEstado(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos los estados</option>
              {estados.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label>
            Cliente
            <select
              value={clienteId}
              onChange={(event) => {
                setClienteId(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos los clientes</option>
              {clientes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre} {item.apellido}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="secondary-button clear-filters"
            onClick={resetFilters}
          >
            Limpiar filtros
          </button>
        </div>

        {notice && (
          <p className="records-message success-message" role="status">
            {notice}
          </p>
        )}

        {error && (
          <p className="records-message error-message" role="alert">
            {error}
          </p>
        )}

        <div className="agenda-caption">
          <div>
            <h3>
              {fecha ? `Agenda del ${formatDate(fecha)}` : "Todos los turnos"}
            </h3>
            <p>
              {result.total} resultado(s) · Ordenados por fecha y horario
            </p>
          </div>

          {fecha && (
            <button
              type="button"
              className="table-action"
              onClick={() => setFecha("")}
            >
              Ver todas las fechas
            </button>
          )}
        </div>

        {loading ? (
          <p className="records-message">Cargando agenda...</p>
        ) : result.items.length === 0 ? (
          <div className="turnos-empty">
            <strong>No hay turnos para mostrar.</strong>
            <span>
              Probá cambiando los filtros o registrá un nuevo turno.
            </span>
            <button
              type="button"
              className="primary-button"
              onClick={openCreate}
            >
              Registrar turno
            </button>
          </div>
        ) : (
          <div className="records-table-wrap">
            <table className="records-table">
              <thead>
                <tr>
                  <th>Fecha y hora</th>
                  <th>Cliente</th>
                  <th>Equipo</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  <th>Gestionar</th>
                </tr>
              </thead>

              <tbody>
                {result.items.map((turno) => {
                  const equipo = equiposMap.get(String(turno.equipoId));

                  return (
                    <tr key={turno.id}>
                      <td>
                        <span className="record-primary">
                          {formatDate(turno.fecha)}
                        </span>
                        <span className="record-secondary">
                          {turno.hora} hs · #{turno.id}
                        </span>
                      </td>

                      <td>
                        <span className="record-primary">
                          {clientesMap.get(String(turno.clienteId)) ||
                            `Cliente #${turno.clienteId}`}
                        </span>
                      </td>

                      <td>
                        <span className="record-primary">
                          {equipo
                            ? `${equipo.tipo} ${equipo.marca}`
                            : `Equipo #${turno.equipoId}`}
                        </span>
                        <span className="record-secondary">
                          {equipo?.modelo || ""}
                        </span>
                      </td>

                      <td>{turno.motivo}</td>

                      <td>
                        <span
                          className={`turno-state turno-state-${turno.estado.toLowerCase()}`}
                        >
                          {turno.estado}
                        </span>
                      </td>

                      <td>
                        <div className="turno-row-actions">
                          <button
                            type="button"
                            className="table-action"
                            onClick={() => openEdit(turno)}
                          >
                            Editar
                          </button>

                          <select
                            aria-label={`Cambiar estado del turno ${turno.id}`}
                            value={turno.estado}
                            disabled={busyId === turno.id}
                            onChange={(event) =>
                              changeStatus(turno, event.target.value)
                            }
                          >
                            {estados.map((item) => (
                              <option key={item}>{item}</option>
                            ))}
                          </select>

                          <button
                            type="button"
                            className="table-action danger-action"
                            disabled={busyId === turno.id}
                            onClick={() => handleDelete(turno)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="records-pagination">
          <span>
            Página {page} de {result.totalPages}
          </span>

          <div className="pagination-actions">
            <button
              type="button"
              className="pagination-button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
            >
              Anterior
            </button>

            <button
              type="button"
              className="pagination-button"
              disabled={page >= result.totalPages || loading}
              onClick={() => setPage((current) => current + 1)}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {editor && (
        <div
          className="detail-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setEditor(null);
            }
          }}
        >
          <section
            className="detail-dialog editor-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="turno-editor-title"
          >
            <div className="detail-dialog-heading">
              <div>
                <p className="eyebrow">GESTIÓN DE TURNOS</p>
                <h3 id="turno-editor-title">
                  {editor.mode === "create"
                    ? "Registrar turno"
                    : "Editar / reprogramar turno"}
                </h3>
              </div>

              <button
                type="button"
                className="close-detail"
                disabled={saving}
                onClick={() => setEditor(null)}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <form
              className="record-form turnos-form"
              onSubmit={handleSubmit}
            >
              <label>
                Cliente
                <select
                  name="clienteId"
                  value={form.clienteId}
                  onChange={updateField}
                  required
                >
                  <option value="">Seleccionar cliente</option>
                  {clientes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre} {item.apellido}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Equipo
                <select
                  name="equipoId"
                  value={form.equipoId}
                  onChange={updateField}
                  required
                  disabled={!form.clienteId}
                >
                  <option value="">Seleccionar equipo</option>
                  {equiposDisponibles.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.tipo} · {item.marca} {item.modelo}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Fecha
                <input
                  type="date"
                  name="fecha"
                  value={form.fecha}
                  onChange={updateField}
                  required
                />
              </label>

              <label>
                Horario
                <input
                  type="time"
                  name="hora"
                  value={form.hora}
                  onChange={updateField}
                  required
                />
              </label>

              <label>
                Motivo
                <input
                  name="motivo"
                  value={form.motivo}
                  onChange={updateField}
                  required
                  maxLength="160"
                  placeholder="Motivo de la visita"
                />
              </label>

              <label>
                Procedencia
                <select
                  name="procedencia"
                  value={form.procedencia}
                  onChange={updateField}
                  required
                >
                  <option>Presencial</option>
                  <option>Localidad vecina</option>
                  <option>Envío</option>
                </select>
              </label>

              <label>
                Estado
                <select
                  name="estado"
                  value={form.estado}
                  onChange={updateField}
                  required
                >
                  {estados.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              {error && (
                <p
                  className="error-message turnos-form-error"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={saving}
                  onClick={() => setEditor(null)}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Guardar turno"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}

export default Turnos;
