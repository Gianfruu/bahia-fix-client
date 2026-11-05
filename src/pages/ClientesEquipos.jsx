import { useCallback, useEffect, useMemo, useState } from "react";
import { demoClientes } from "../data/demo-data.js";
import {
  createCliente, createEquipo, deleteCliente, deleteEquipo,
  getClienteById, getClientes, getEquipoById, getEquipos,
  updateCliente, updateEquipo
} from "../services/api.js";

const PAGE_SIZE = 10;
const emptyCliente = { nombre: "", apellido: "", telefono: "", email: "", localidad: "" };
const emptyEquipo = { clienteId: "", tipo: "", marca: "", modelo: "", numeroSerie: "", estado: "Ingresado", garantia: "A verificar" };

function ClientesEquipos() {
  const [activeTab, setActiveTab] = useState("clientes");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], total: 0, totalPages: 1, source: "demo" });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(emptyCliente);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [clientes, setClientes] = useState(demoClientes);

  const isClientes = activeTab === "clientes";
  const resourceLabel = isClientes ? "cliente" : "equipo";

  const clienteNombre = useMemo(
    () => new Map(clientes.map((item) => [String(item.id), `${item.nombre} ${item.apellido}`])),
    [clientes]
  );

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = isClientes
        ? await getClientes({ q: query, page, limit: PAGE_SIZE })
        : await getEquipos({ q: query, page, limit: PAGE_SIZE });
      setResult(data);
    } catch (err) {
      setError(err.message || "No se pudo cargar la información.");
    } finally {
      setLoading(false);
    }
  }, [isClientes, query, page]);

  useEffect(() => {
    Promise.resolve().then(loadRecords);
  }, [loadRecords]);

  useEffect(() => {
    getClientes({ page: 1, limit: 100 })
      .then((data) => setClientes(data.items))
      .catch(() => setClientes([]));
  }, [result.total, activeTab]);

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function encodePdfText(value) {
    const special = {
      '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86,
      '‡': 0x87, 'ˆ': 0x88, '‰': 0x89, 'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c,
      'Ž': 0x8e, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95,
      '–': 0x96, '—': 0x97, '˜': 0x98, '™': 0x99, 'š': 0x9a, '›': 0x9b,
      'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f, 'á': 0xe1, 'é': 0xe9, 'í': 0xed,
      'ó': 0xf3, 'ú': 0xfa, 'ñ': 0xf1, 'ü': 0xfc, 'Á': 0xc1, 'É': 0xc9,
      'Í': 0xcd, 'Ó': 0xd3, 'Ú': 0xda, 'Ñ': 0xd1, 'Ü': 0xdc, '¿': 0xbf,
      '¡': 0xa1, '°': 0xb0
    };
    return Array.from(String(value ?? '')).map((character) => {
      const code = character.codePointAt(0);
      const byte = special[character] ?? (code >= 32 && code <= 126 ? code : 63);
      return byte.toString(16).padStart(2, '0');
    }).join('').toUpperCase();
  }

  function createPdfBlob(title, columns, rows, subtitle) {
    const pageWidth = 842;
    const pageHeight = 595;
    const margin = 32;
    const usableWidth = pageWidth - margin * 2;
    const columnWidth = usableWidth / columns.length;
    const rowHeight = 24;
    const pages = [];
    let rowIndex = 0;

    while (rowIndex < rows.length || pages.length === 0) {
      const commands = [];
      const text = (value, x, y, size, bold = false) => {
        commands.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td <${encodePdfText(value)}> Tj ET`);
      };
      text(title, margin, pageHeight - 42, 18, true);
      text(subtitle, margin, pageHeight - 62, 9);
      const tableTop = pageHeight - 88;
      const headerY = tableTop - 18;
      commands.push(`0.92 g ${margin} ${headerY - 5} ${usableWidth} ${rowHeight} re f 0 g`);
      columns.forEach((column, index) => text(column, margin + index * columnWidth + 5, headerY + 3, 7.5, true));
      commands.push(`0.75 G 0.5 w ${margin} ${headerY - 5} m ${pageWidth - margin} ${headerY - 5} l S`);

      let y = headerY - 20;
      let rowsOnPage = 0;
      while (rowIndex < rows.length && y > 48) {
        const row = rows[rowIndex];
        row.forEach((value, index) => {
          const maxChars = Math.max(8, Math.floor((columnWidth - 10) / 4.2));
          const display = String(value ?? '').length > maxChars
            ? `${String(value).slice(0, maxChars - 1)}…`
            : String(value ?? '');
          text(display, margin + index * columnWidth + 5, y, 7.2);
        });
        commands.push(`0.85 G 0.35 w ${margin} ${y - 6} m ${pageWidth - margin} ${y - 6} l S`);
        y -= rowHeight;
        rowIndex += 1;
        rowsOnPage += 1;
      }
      text(`Bahía Fix · Página ${pages.length + 1} · Registros: ${rows.length}`, margin, 25, 8);
      pages.push(commands.join('\n'));
      if (rowsOnPage === 0) break;
    }

    const objects = [];
    const addObject = (content) => { objects.push(content); return objects.length; };
    const catalogId = addObject('');
    const pagesId = addObject('');
    const fontRegularId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    const fontBoldId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    const pageIds = [];
    pages.forEach((content) => {
      const stream = `${content}\n`;
      const contentId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
      const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`);
      pageIds.push(pageId);
    });
    objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
    objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets.push(new TextEncoder().encode(pdf).length);
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xrefOffset = new TextEncoder().encode(pdf).length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return new Blob([pdf], { type: 'application/pdf' });
  }

  async function exportReport() {
    setError('');
    setNotice('');
    try {
      const loadPage = isClientes ? getClientes : getEquipos;
      const firstPage = await loadPage({ q: query, page: 1, limit: 100 });
      let records = [...firstPage.items];

      for (let currentPage = 2; currentPage <= firstPage.totalPages; currentPage += 1) {
        const response = await loadPage({ q: query, page: currentPage, limit: 100 });
        records = records.concat(response.items);
      }

      const columns = isClientes
        ? ['ID', 'Nombre', 'Apellido', 'Teléfono', 'Correo electrónico', 'Localidad']
        : ['ID', 'Cliente', 'Tipo', 'Marca', 'Modelo', 'Número de serie', 'Estado', 'Garantía'];
      const rows = records.map((record) => isClientes
        ? [record.id, record.nombre, record.apellido, record.telefono, record.email, record.localidad]
        : [record.id, clienteNombre.get(String(record.clienteId)) || record.clienteId, record.tipo, record.marca, record.modelo, record.numeroSerie, record.estado, record.garantia]);
      const title = isClientes ? 'Reporte de clientes - Bahía Fix' : 'Reporte de equipos - Bahía Fix';
      const subtitle = `Generado: ${new Date().toLocaleString('es-AR')} | Registros: ${records.length}${query ? ` | Búsqueda: ${query}` : ''}`;
      const blob = createPdfBlob(title, columns, rows, subtitle);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${isClientes ? 'reporte_clientes' : 'reporte_equipos'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice(`Se descargó el reporte con ${records.length} ${isClientes ? 'clientes' : 'equipos'}.`);
    } catch (err) {
      setError(err.message || 'No se pudo generar el reporte.');
    }
  }

  function changeTab(tab) {
    setActiveTab(tab);
    setQuery("");
    setPage(1);
    setSelected(null);
    setNotice("");
    setError("");
  }

  async function openDetails(item) {
    setError("");
    try {
      const response = isClientes ? await getClienteById(item.id) : await getEquipoById(item.id);
      if (!response.record) throw new Error("No se encontró el registro.");
      setSelected(response.record);
    } catch (err) {
      setError(err.message);
    }
  }

  function openCreate() {
    setError("");
    setForm(isClientes ? { ...emptyCliente } : { ...emptyEquipo, clienteId: String(clientes[0]?.id || "") });
    setEditor({ mode: "create", type: activeTab });
  }

  function openEdit(item) {
    setError("");
    setForm(isClientes
      ? { ...emptyCliente, ...item }
      : { ...emptyEquipo, ...item, clienteId: String(item.clienteId) });
    setEditor({ mode: "edit", type: activeTab, id: item.id });
  }

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");
    const currentEditor = editor;

    try {
      if (!currentEditor) {
        throw new Error("No se encontró el formulario que querés guardar.");
      }

      const currentIsClientes = currentEditor.type === "clientes";
      const payload = currentIsClientes
        ? {
            nombre: String(form.nombre ?? "").trim(),
            apellido: String(form.apellido ?? "").trim(),
            telefono: String(form.telefono ?? "").trim(),
            email: String(form.email ?? "").trim(),
            localidad: String(form.localidad ?? "").trim()
          }
        : {
            tipo: String(form.tipo ?? "").trim(),
            marca: String(form.marca ?? "").trim(),
            modelo: String(form.modelo ?? "").trim(),
            numeroSerie: String(form.numeroSerie ?? "").trim(),
            estado: form.estado,
            garantia: form.garantia,
            clienteId: Number(form.clienteId)
          };

      let response;
      if (currentIsClientes) {
        response = currentEditor.mode === "create"
          ? await createCliente(payload)
          : await updateCliente(currentEditor.id, payload);
      } else {
        response = currentEditor.mode === "create"
          ? await createEquipo(payload)
          : await updateEquipo(currentEditor.id, payload);
      }

      const savedRecord = response.record;
      setResult((current) => {
        const exists = current.items.some((item) => item.id === savedRecord.id);
        const items = exists
          ? current.items.map((item) => item.id === savedRecord.id ? savedRecord : item)
          : [savedRecord, ...current.items].slice(0, PAGE_SIZE);
        const total = currentEditor.mode === "create" ? current.total + 1 : current.total;
        return { ...current, items, total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
      });

      if (currentIsClientes) {
        setClientes((current) => currentEditor.mode === "create"
          ? [...current, savedRecord]
          : current.map((item) => item.id === savedRecord.id ? savedRecord : item));
      }

      setEditor(null);
      setNotice(`${currentIsClientes ? "Cliente" : "Equipo"} ${currentEditor.mode === "create" ? "registrado" : "actualizado"} correctamente.`);
    } catch (err) {
      setError(err.message || "No se pudo guardar el registro.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    const currentIsClientes = activeTab === "clientes";
    const label = currentIsClientes
      ? `${item.nombre} ${item.apellido}`
      : `${item.tipo} ${item.marca} ${item.modelo}`;

    if (!window.confirm(`¿Seguro que querés eliminar ${label}?`)) return;

    setError("");
    setDeletingId(item.id);
    try {
      if (currentIsClientes) await deleteCliente(item.id);
      else await deleteEquipo(item.id);

      setResult((current) => {
        const items = current.items.filter((record) => record.id !== item.id);
        const total = Math.max(0, current.total - 1);
        return { ...current, items, total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
      });

      if (currentIsClientes) {
        setClientes((current) => current.filter((cliente) => cliente.id !== item.id));
      }

      setSelected(null);
      setNotice(`${currentIsClientes ? "Cliente" : "Equipo"} eliminado correctamente.`);
    } catch (err) {
      setError(err.message || "No se pudo eliminar el registro.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="records-section" id="clientes-equipos" aria-labelledby="records-title">
      <div className="records-heading">
        <div><p className="eyebrow">DIRECTORIO DEL TALLER</p><h2 id="records-title">Clientes y equipos</h2><p className="section-description">Administrá los datos y las fichas de cada registro.</p></div>
        <span className={`data-source ${result.source === "api" ? "data-source-api" : ""}`}><span className="source-dot" />{result.source === "api" ? "API conectada" : "Datos de demostración"}</span>
      </div>

      <div className="records-panel">
        <div className="records-toolbar">
          <div className="records-tabs" role="tablist" aria-label="Tipo de registro">
            <button type="button" role="tab" aria-selected={isClientes} className={`records-tab ${isClientes ? "active" : ""}`} onClick={() => changeTab("clientes")}>Clientes</button>
            <button type="button" role="tab" aria-selected={!isClientes} className={`records-tab ${!isClientes ? "active" : ""}`} onClick={() => changeTab("equipos")}>Equipos</button>
          </div>
          <label className="records-search"><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={isClientes ? "Buscar cliente..." : "Buscar equipo..."} aria-label={`Buscar ${activeTab}`} /></label>
          <button type="button" className="secondary-button" onClick={exportReport}>Exportar PDF</button>
          <button type="button" className="primary-button" onClick={openCreate}>＋ Nuevo {resourceLabel}</button>
        </div>

        {notice && <p className="records-message success-message" role="status">{notice}</p>}
        {error && <p className="records-message error-message" role="alert">{error}</p>}
        <div className="records-summary"><strong>{result.total}</strong> {isClientes ? "clientes registrados" : "equipos registrados"}</div>
        {loading ? <p className="records-message">Cargando registros...</p> : result.items.length === 0 ? <p className="records-message">No se encontraron registros con esa búsqueda.</p> : (
          <div className="records-table-wrap"><table className="records-table">
            <thead><tr>{isClientes ? <><th>Cliente</th><th>Contacto</th><th>Localidad</th></> : <><th>Equipo</th><th>Número de serie</th><th>Estado</th></>}<th>Acciones</th></tr></thead>
            <tbody>{result.items.map((item) => <tr key={item.id}>
              {isClientes ? <><td><span className="record-primary">{item.nombre} {item.apellido}</span><span className="record-secondary">Cliente #{item.id}</span></td><td><span className="record-primary">{item.telefono}</span><span className="record-secondary">{item.email}</span></td><td>{item.localidad}</td></> : <><td><span className="record-primary">{item.tipo} {item.marca}</span><span className="record-secondary">{item.modelo}</span></td><td>{item.numeroSerie}</td><td><span className="state-pill">{item.estado}</span></td></>}
              <td><div className="row-actions"><button type="button" className="detail-button" onClick={() => openDetails(item)}>Ver ficha</button><button type="button" className="table-action" onClick={() => openEdit(item)} aria-label={`Editar ${resourceLabel}`}>Editar</button><button type="button" className="table-action danger-action" disabled={deletingId === item.id} onClick={() => handleDelete(item)} aria-label={`Eliminar ${resourceLabel}`}>{deletingId === item.id ? "Eliminando..." : "Eliminar"}</button></div></td>
            </tr>)}</tbody>
          </table></div>
        )}
        <div className="records-pagination"><span>Página {page} de {result.totalPages}</span><div className="pagination-actions"><button type="button" className="pagination-button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Anterior</button><button type="button" className="pagination-button" disabled={page >= result.totalPages || loading} onClick={() => setPage((current) => current + 1)}>Siguiente</button></div></div>
      </div>

      {editor && <div className="detail-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setEditor(null); }}><section className="detail-dialog editor-dialog" role="dialog" aria-modal="true" aria-labelledby="editor-title">
        <div className="detail-dialog-heading"><div><p className="eyebrow">GESTIÓN DE REGISTROS</p><h3 id="editor-title">{editor.mode === "create" ? "Registrar" : "Editar"} {editor.type === "clientes" ? "cliente" : "equipo"}</h3></div><button type="button" className="close-detail" aria-label="Cerrar formulario" disabled={saving} onClick={() => setEditor(null)}>×</button></div>
        <form className="record-form" onSubmit={handleSubmit}>
          {isClientes ? <>
            <label>Nombre<input name="nombre" value={form.nombre} onChange={updateField} required maxLength="80" /></label>
            <label>Apellido<input name="apellido" value={form.apellido} onChange={updateField} required maxLength="80" /></label>
            <label>Teléfono<input name="telefono" value={form.telefono} onChange={updateField} required maxLength="30" /></label>
            <label>Correo electrónico<input type="email" name="email" value={form.email} onChange={updateField} required maxLength="120" /></label>
            <label>Localidad<input name="localidad" value={form.localidad} onChange={updateField} required maxLength="100" /></label>
          </> : <>
            <label>Cliente<select name="clienteId" value={form.clienteId} onChange={updateField} required><option value="">Seleccionar cliente</option>{clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nombre} {cliente.apellido}</option>)}</select></label>
            <label>Tipo de equipo<input name="tipo" value={form.tipo} onChange={updateField} required /></label>
            <label>Marca<input name="marca" value={form.marca} onChange={updateField} required /></label>
            <label>Modelo<input name="modelo" value={form.modelo} onChange={updateField} required /></label>
            <label>Número de serie<input name="numeroSerie" value={form.numeroSerie} onChange={updateField} required /></label>
            <label>Estado<select name="estado" value={form.estado} onChange={updateField}><option>Ingresado</option><option>En revisión</option><option>En reparación</option><option>Listo para retirar</option></select></label>
            <label>Garantía<select name="garantia" value={form.garantia} onChange={updateField}><option>A verificar</option><option>En garantía</option><option>Fuera de garantía</option></select></label>
          </>}
          {error && <p className="error-message" role="alert">{error}</p>}
          <div className="form-actions"><button type="button" className="secondary-button" disabled={saving} onClick={() => setEditor(null)}>Cancelar</button><button type="submit" className="primary-button" disabled={saving}>{saving ? "Guardando..." : "Guardar registro"}</button></div>
        </form>
      </section></div>}

      {selected && <div className="detail-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><section className="detail-dialog" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <div className="detail-dialog-heading"><div><p className="eyebrow">DETALLE DEL REGISTRO</p><h3 id="detail-title">{isClientes ? "Ficha del cliente" : "Ficha del equipo"}</h3></div><button type="button" className="close-detail" aria-label="Cerrar ficha" onClick={() => setSelected(null)}>×</button></div>
        <dl className="detail-grid">{Object.entries(selected).filter(([key, value]) => value !== null && value !== undefined).map(([key, value]) => <div className="detail-field" key={key}><dt>{key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase())}</dt><dd>{key === "clienteId" ? clienteNombre.get(String(value)) || value : String(value)}</dd></div>)}</dl>
        <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setSelected(null)}>Cerrar</button><button type="button" className="primary-button" onClick={() => { const item = selected; setSelected(null); openEdit(item); }}>Editar registro</button><button type="button" className="secondary-button danger-action" onClick={() => handleDelete(selected)}>Eliminar</button></div>
      </section></div>}
    </section>
  );
}

export default ClientesEquipos;
