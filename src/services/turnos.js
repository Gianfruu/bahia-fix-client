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
      ...options, signal: controller.signal,
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
  } finally { clearTimeout(timeout); }
}

function isConnectionError(error) {
  return error.name === "AbortError" || error instanceof TypeError;
}

function paginate(records, query, page, limit) {
  const normalized = String(query || "").trim().toLocaleLowerCase("es");
  const filtered = records.filter((item) => Object.values(item).some((value) => String(value).toLocaleLowerCase("es").includes(normalized))).sort((a, b) => b.id - a.id);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * limit;
  return { items: filtered.slice(start, start + limit), total, page: currentPage, limit, totalPages };
}

export async function getTurnos({ q = "", page = 1, limit = 10 } = {}) {
  try { return { ...await request(`/turnos?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`), source: "api" }; }
  catch (error) {
    if (!isConnectionError(error)) throw error;
    return { ...paginate(localTurnos, q, page, limit), source: "demo" };
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
    Object.assign(record, payload);
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
