import { getClientes, getEquipos } from "./api.js";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1").replace(/\/$/, "");
const REQUEST_TIMEOUT = 4000;
let localTurnos = [
  { id: 201, clienteId: 1, equipoId: 101, fecha: "2026-11-04", hora: "09:00", motivo: "Revisión general", procedencia: "Presencial", estado: "Solicitado" },
  { id: 202, clienteId: 2, equipoId: 102, fecha: "2026-11-05", hora: "10:30", motivo: "Mantenimiento", procedencia: "Localidad vecina", estado: "Confirmado" },
  { id: 203, clienteId: 3, equipoId: 103, fecha: "2026-11-06", hora: "14:00", motivo: "Evaluación de falla", procedencia: "Presencial", estado: "Solicitado" }
];

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) }
    });
    const body = await response.text();
    let result = {};
    if (body) {
      try { result = JSON.parse(body); }
      catch { throw new Error("La API devolvió una respuesta inválida."); }
    }
    if (!response.ok || result.success === false) {
      const error = new Error(result.message || `Error ${response.status} al comunicarse con la API.`);
      error.status = response.status;
      throw error;
    }
    return result.data;
  } finally {
    clearTimeout(timeout);
  }
}

function isConnectionError(error) {
  return error.name === "AbortError" || error instanceof TypeError;
}

function validateLocalConflict(payload, excludeId = null) {
  if (payload.estado === "Cancelado") return;
  const conflict = localTurnos.find((item) =>
    String(item.id) !== String(excludeId) && item.fecha === payload.fecha &&
    item.hora === payload.hora && item.estado !== "Cancelado"
  );
  if (conflict) throw new Error("Ya existe un turno activo en esa fecha y horario.");
}

function paginate(records, query, page, limit, filters = {}) {
  const normalized = String(query || "").trim().toLocaleLowerCase("es");
  let filtered = records.filter((item) => {
    const matchesText = !normalized || Object.values(item).some((value) => String(value).toLocaleLowerCase("es").includes(normalized));
    const matchesDate = !filters.fecha || item.fecha === filters.fecha;
    const matchesState = !filters.estado || item.estado === filters.estado;
    const matchesClient = !filters.clienteId || String(item.clienteId) === String(filters.clienteId);
    return matchesText && matchesDate && matchesState && matchesClient;
  }).sort((a, b) => `${a.fecha}T${a.hora}`.localeCompare(`${b.fecha}T${b.hora}`));
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * limit;
  return { items: filtered.slice(start, start + limit), total, page: currentPage, limit, totalPages };
}

export async function getTurnos({ q = "", page = 1, limit = 10, fecha = "", estado = "", clienteId = "" } = {}) {
  const params = new URLSearchParams({ q, page: String(page), limit: String(limit) });
  if (fecha) params.set("fecha", fecha);
  if (estado) params.set("estado", estado);
  if (clienteId) params.set("clienteId", clienteId);
  try {
    return { ...await request(`/turnos?${params.toString()}`), source: "api" };
  } catch (error) {
    if (!isConnectionError(error)) throw error;
    return { ...paginate(localTurnos, q, page, limit, { fecha, estado, clienteId }), source: "demo" };
  }
}

export async function getResumenTurnos() {
  try {
    return { ...(await request("/turnos/resumen")), source: "api" };
  } catch (error) {
    if (!isConnectionError(error)) throw error;
    return {
      total: localTurnos.length,
      solicitados: localTurnos.filter((item) => item.estado === "Solicitado").length,
      confirmados: localTurnos.filter((item) => item.estado === "Confirmado").length,
      atendidos: localTurnos.filter((item) => item.estado === "Atendido").length,
      cancelados: localTurnos.filter((item) => item.estado === "Cancelado").length,
      source: "demo"
    };
  }
}

export async function getTurnoById(id) {
  try { return { record: await request(`/turnos/${id}`), source: "api" }; }
  catch (error) {
    if (!isConnectionError(error)) throw error;
    return { record: localTurnos.find((item) => String(item.id) === String(id)) || null, source: "demo" };
  }
}

export async function createTurno(payload) {
  try { return { record: await request("/turnos", { method: "POST", body: JSON.stringify(payload) }), source: "api" }; }
  catch (error) {
    if (!isConnectionError(error)) throw error;
    validateLocalConflict(payload);
    const nextId = Math.max(200, ...localTurnos.map((item) => item.id)) + 1;
    const record = { id: nextId, ...payload };
    localTurnos.push(record);
    return { record, source: "demo" };
  }
}

export async function updateTurno(id, payload) {
  try { return { record: await request(`/turnos/${id}`, { method: "PUT", body: JSON.stringify(payload) }), source: "api" }; }
  catch (error) {
    if (!isConnectionError(error)) throw error;
    const record = localTurnos.find((item) => String(item.id) === String(id));
    if (!record) throw new Error("No se encontró el turno que querés modificar.");
    validateLocalConflict(payload, id);
    Object.assign(record, payload);
    return { record, source: "demo" };
  }
}

export async function updateEstadoTurno(id, estado) {
  try { return { record: await request(`/turnos/${id}/estado`, { method: "PATCH", body: JSON.stringify({ estado }) }), source: "api" }; }
  catch (error) {
    if (!isConnectionError(error)) throw error;
    const record = localTurnos.find((item) => String(item.id) === String(id));
    if (!record) throw new Error("No se encontró el turno solicitado.");
    record.estado = estado;
    return { record, source: "demo" };
  }
}

export async function deleteTurno(id) {
  try { return { record: await request(`/turnos/${id}`, { method: "DELETE" }), source: "api" }; }
  catch (error) {
    if (!isConnectionError(error)) throw error;
    const index = localTurnos.findIndex((item) => String(item.id) === String(id));
    if (index < 0) throw new Error("No se encontró el turno que querés eliminar.");
    const [record] = localTurnos.splice(index, 1);
    return { record, source: "demo" };
  }
}

export async function getCatalogosTurnos() {
  const [clientes, equipos] = await Promise.all([
    getClientes({ page: 1, limit: 100 }),
    getEquipos({ page: 1, limit: 100 })
  ]);
  return { clientes: clientes.items, equipos: equipos.items };
}
