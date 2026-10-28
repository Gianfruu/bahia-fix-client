import { useEffect, useMemo, useState } from "react";
import { demoClientes } from "../data/demo-data.js";
import { getClienteById, getClientes, getEquipoById, getEquipos } from "../services/api.js";

const PAGE_SIZE = 10;

function ClientesEquipos() {
  const [activeTab, setActiveTab] = useState("clientes");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], total: 0, totalPages: 1, source: "demo" });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = activeTab === "clientes" ? getClientes : getEquipos;

    load({ q: query, page, limit: PAGE_SIZE })
      .then((data) => {
        if (active) setResult(data);
      })
      .catch(() => {
        if (active) setError("No se pudo cargar la información.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [activeTab, query, page]);

  const clientesPorId = useMemo(() => new Map(demoClientes.map((cliente) => [cliente.id, cliente])), []);

  function changeTab(tab) {
    setLoading(true);
    setError("");
    setActiveTab(tab);
    setQuery("");
    setPage(1);
    setSelected(null);
  }

  async function openDetails(item) {
    setDetailLoading(true);
    setSelected({ ...item, _loading: true });
    const response = activeTab === "clientes"
      ? await getClienteById(item.id)
      : await getEquipoById(item.id);
    let record = response.record;

    if (activeTab === "equipos" && record) {
      record = { ...record, clienteNombre: clientesPorId.get(record.clienteId) ? `${clientesPorId.get(record.clienteId).nombre} ${clientesPorId.get(record.clienteId).apellido}` : "Cliente registrado" };
    }

    setSelected(record ? { ...record, _source: response.source } : null);
    setDetailLoading(false);
  }

  const isClientes = activeTab === "clientes";

  return (
    <section className="records-section" id="clientes-equipos" aria-labelledby="records-title">
      <div className="records-heading">
        <div>
          <p className="eyebrow">DIRECTORIO DEL TALLER</p>
          <h2 id="records-title">Clientes y equipos</h2>
          <p className="section-description">Consultá los datos registrados y encontrá rápidamente cada ficha.</p>
        </div>
        <span className={`data-source ${result.source === "api" ? "data-source-api" : ""}`}>
          <span className="source-dot" />{result.source === "api" ? "API conectada" : "Datos de demostración"}
        </span>
      </div>

      <div className="records-panel">
        <div className="records-toolbar">
          <div className="records-tabs" role="tablist" aria-label="Tipo de registro">
            <button type="button" role="tab" aria-selected={isClientes} className={`records-tab ${isClientes ? "active" : ""}`} onClick={() => changeTab("clientes")}>Clientes</button>
            <button type="button" role="tab" aria-selected={!isClientes} className={`records-tab ${!isClientes ? "active" : ""}`} onClick={() => changeTab("equipos")}>Equipos</button>
          </div>
          <label className="records-search">
            <span aria-hidden="true">⌕</span>
            <input type="search" value={query} onChange={(event) => { setLoading(true); setError(""); setQuery(event.target.value); setPage(1); }} placeholder={isClientes ? "Buscar cliente..." : "Buscar equipo..."} aria-label={isClientes ? "Buscar clientes" : "Buscar equipos"} />
          </label>
        </div>

        <div className="records-summary"><strong>{result.total}</strong> {isClientes ? "clientes registrados" : "equipos registrados"}</div>
        {error && <p className="records-message error-message" role="alert">{error}</p>}
        {loading ? <p className="records-message">Cargando registros...</p> : result.items.length === 0 ? <p className="records-message">No se encontraron registros con esa búsqueda.</p> : (
          <div className="records-table-wrap">
            <table className="records-table">
              <thead><tr>{isClientes ? <><th>Cliente</th><th>Contacto</th><th>Localidad</th></> : <><th>Equipo</th><th>Número de serie</th><th>Estado</th></>}<th>Ficha</th></tr></thead>
              <tbody>
                {result.items.map((item) => (
                  <tr key={item.id}>
                    {isClientes ? <><td><span className="record-primary">{item.nombre} {item.apellido}</span><span className="record-secondary">Cliente #{item.id}</span></td><td><span className="record-primary">{item.telefono}</span><span className="record-secondary">{item.email}</span></td><td>{item.localidad}</td></> : <><td><span className="record-primary">{item.tipo} {item.marca}</span><span className="record-secondary">{item.modelo}</span></td><td>{item.numeroSerie}</td><td><span className="state-pill">{item.estado}</span></td></>}
                    <td><button className="detail-button" type="button" onClick={() => openDetails(item)}>Ver ficha <span aria-hidden="true">↗</span></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="records-pagination">
          <span>Página {page} de {result.totalPages}</span>
          <div className="pagination-actions">
            <button type="button" className="pagination-button" disabled={page <= 1 || loading} onClick={() => { setLoading(true); setPage((current) => current - 1); }}>Anterior</button>
            <button type="button" className="pagination-button" disabled={page >= result.totalPages || loading} onClick={() => { setLoading(true); setPage((current) => current + 1); }}>Siguiente</button>
          </div>
        </div>
      </div>

      {selected && (
        <div className="detail-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <section className="detail-dialog" role="dialog" aria-modal="true" aria-labelledby="detail-title">
            <div className="detail-dialog-heading"><div><p className="eyebrow">DETALLE DEL REGISTRO</p><h3 id="detail-title">{isClientes ? "Ficha del cliente" : "Ficha del equipo"}</h3></div><button type="button" className="close-detail" aria-label="Cerrar ficha" onClick={() => setSelected(null)}>×</button></div>
            {detailLoading || selected._loading ? <p className="records-message">Cargando ficha...</p> : <dl className="detail-grid">
              {Object.entries(selected).filter(([key, value]) => !key.startsWith("_") && value !== null && value !== undefined).map(([key, value]) => <div className="detail-field" key={key}><dt>{key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase())}</dt><dd>{String(value)}</dd></div>)}
            </dl>}
            {selected._source && <p className="detail-source">Origen: {selected._source === "api" ? "API" : "datos de demostración"}</p>}
          </section>
        </div>
      )}
    </section>
  );
}

export default ClientesEquipos;
