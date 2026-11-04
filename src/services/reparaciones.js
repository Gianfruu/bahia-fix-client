import { getClientes, getEquipos } from "./api.js";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1").replace(/\/$/, "");
const demoReparaciones = [
  { id: 301, clienteId: 1, equipoId: 101, fechaIngreso: "2026-10-20", motivo: "El taladro presenta pérdida de potencia.", estado: "Terminado", observaciones: "Se realizó una revisión general y mantenimiento.", diagnostico: "Desgaste por uso.", trabajoRealizado: "Limpieza y ajuste general.", garantia: "A verificar", manoObra: 12000, repuestos: [], total: 12000 },
  { id: 302, clienteId: 2, equipoId: 102, fechaIngreso: "2026-10-25", motivo: "La motosierra no arranca correctamente.", estado: "En diagnóstico", observaciones: "Pendiente de evaluación técnica.", diagnostico: "", trabajoRealizado: "", garantia: "Fuera de garantía", manoObra: 0, repuestos: [], total: 0 },
  { id: 303, clienteId: 3, equipoId: 103, fechaIngreso: "2026-10-27", motivo: "La amoladora presenta vibraciones.", estado: "Presupuestado", observaciones: "Se preparó un presupuesto.", diagnostico: "Desgaste de componentes.", trabajoRealizado: "", garantia: "En garantía", manoObra: 18000, repuestos: [], total: 18000 },
  { id: 304, clienteId: 1, equipoId: 104, fechaIngreso: "2026-10-29", motivo: "El generador no mantiene el funcionamiento.", estado: "En reparación", observaciones: "Reparación en curso.", diagnostico: "Revisión del sistema de alimentación.", trabajoRealizado: "", garantia: "Fuera de garantía", manoObra: 25000, repuestos: [], total: 25000 },
  { id: 305, clienteId: 5, equipoId: 105, fechaIngreso: "2026-11-01", motivo: "Mantenimiento general de desmalezadora.", estado: "Recibido", observaciones: "Equipo ingresado para revisión.", diagnostico: "", trabajoRealizado: "", garantia: "A verificar", manoObra: 0, repuestos: [], total: 0 }
];

let localReparaciones = demoReparaciones.map((item) => ({ ...item }));

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === false) {
    throw new Error(result.message || `Error ${response.status} al comunicarse con la API.`);
  }
  return result.data;
}

function isConnectionError(error) {
  return error instanceof TypeError || error.name === "AbortError";
}

function filterAndPaginate(records, params = {}) {
  const query = String(params.q || "").trim().toLocaleLowerCase("es");
  const estado = String(params.estado || "").trim().toLocaleLowerCase("es");
  const filtered = records.filter((item) => {
    const matchesQuery = !query || Object.values(item).some((value) =>
      String(value ?? "").toLocaleLowerCase("es").includes(query)
    );
    const matchesEstado = !estado || String(item.estado).toLocaleLowerCase("es") === estado;
    return matchesQuery && matchesEstado;
  });
  const sortBy = params.sortBy || "fechaIngreso";
  const direction = params.order === "desc" ? -1 : 1;
  filtered.sort((a, b) => String(a[sortBy] ?? "").localeCompare(String(b[sortBy] ?? ""), "es", { numeric: true }) * direction);
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Number(params.limit) || 10);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * limit;
  return { items: filtered.slice(start, start + limit), total, page: currentPage, limit, totalPages };
}

export async function getReparaciones(params = {}) {
  const query = new URLSearchParams({
    page: String(params.page || 1),
    limit: String(params.limit || 10),
    q: params.q || "",
    estado: params.estado || "",
    sortBy: params.sortBy || "fechaIngreso",
    order: params.order || "desc"
  });
  try {
    return { ...(await request(`/reparaciones?${query.toString()}`)), source: "api" };
  } catch (error) {
    if (!isConnectionError(error)) throw error;
    return { ...filterAndPaginate(localReparaciones, params), source: "demo" };
  }
}

export async function createReparacion(payload) {
  try {
    return { record: await request("/reparaciones", { method: "POST", body: JSON.stringify(payload) }), source: "api" };
  } catch (error) {
    if (!isConnectionError(error)) throw error;
    const record = { id: Math.max(300, ...localReparaciones.map((item) => item.id)) + 1, ...payload };
    localReparaciones.push(record);
    return { record, source: "demo" };
  }
}

export async function updateReparacion(id, payload) {
  try {
    return { record: await request(`/reparaciones/${id}`, { method: "PUT", body: JSON.stringify(payload) }), source: "api" };
  } catch (error) {
    if (!isConnectionError(error)) throw error;
    const record = localReparaciones.find((item) => String(item.id) === String(id));
    if (!record) throw new Error("No se encontró la orden de reparación.");
    Object.assign(record, payload);
    return { record, source: "demo" };
  }
}

export async function deleteReparacion(id) {
  try {
    return { record: await request(`/reparaciones/${id}`, { method: "DELETE" }), source: "api" };
  } catch (error) {
    if (!isConnectionError(error)) throw error;
    const index = localReparaciones.findIndex((item) => String(item.id) === String(id));
    if (index < 0) throw new Error("No se encontró la orden de reparación.");
    return { record: localReparaciones.splice(index, 1)[0], source: "demo" };
  }
}

export async function getClientesParaReparaciones() {
  const result = await getClientes({ page: 1, limit: 100 });
  return result.items || [];
}

export async function getEquiposParaReparaciones() {
  const result = await getEquipos({ page: 1, limit: 100 });
  return result.items || [];
}
