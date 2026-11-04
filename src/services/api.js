import { demoClientes, demoEquipos } from "../data/demo-data.js";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1").replace(/\/$/, "");
const REQUEST_TIMEOUT = 4000;

let localClientes = demoClientes.map((item) => ({ ...item }));
let localEquipos = demoEquipos.map((item) => ({ ...item }));

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) }
    });

    const text = await response.text();
    let result = {};
    if (text) {
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error("La API devolvió una respuesta inválida.");
      }
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

function filterAndPaginate(records, query, page, limit) {
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const filtered = records
    .filter((record) => Object.values(record).some((value) => String(value).toLocaleLowerCase("es").includes(normalizedQuery)))
    .sort((a, b) => a.id - b.id);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * limit;

  return { items: filtered.slice(start, start + limit), total, page: currentPage, limit, totalPages };
}

function getLocalRecords(resource) {
  return resource === "clientes" ? localClientes : localEquipos;
}

async function list(resource, query, page, limit, sortBy, order) {
  try {
    const params = new URLSearchParams({ q: query, page: String(page), limit: String(limit), sortBy, order });
    const data = await request(`/${resource}?${params.toString()}`);
    return { ...data, source: "api" };
  } catch (error) {
    if (!isConnectionError(error)) throw error;
    return { ...filterAndPaginate(getLocalRecords(resource), query, page, limit), source: "demo" };
  }
}

async function getOne(resource, id) {
  try {
    return { record: await request(`/${resource}/${id}`), source: "api" };
  } catch (error) {
    if (!isConnectionError(error)) throw error;
    const record = getLocalRecords(resource).find((item) => String(item.id) === String(id)) || null;
    return { record, source: "demo" };
  }
}

async function create(resource, payload) {
  try {
    return { record: await request(`/${resource}`, { method: "POST", body: JSON.stringify(payload) }), source: "api" };
  } catch (error) {
    if (!isConnectionError(error)) throw error;
    const records = getLocalRecords(resource);
    if (resource === "equipos" && !localClientes.some((item) => String(item.id) === String(payload.clienteId))) {
      throw new Error("Seleccioná un cliente existente.");
    }
    const nextId = Math.max(resource === "clientes" ? 0 : 100, ...records.map((item) => item.id)) + 1;
    const record = { id: nextId, ...payload };
    records.push(record);
    return { record, source: "demo" };
  }
}

async function update(resource, id, payload) {
  try {
    return { record: await request(`/${resource}/${id}`, { method: "PUT", body: JSON.stringify(payload) }), source: "api" };
  } catch (error) {
    if (!isConnectionError(error)) throw error;
    const records = getLocalRecords(resource);
    const record = records.find((item) => String(item.id) === String(id));
    if (!record) throw new Error("No se encontró el registro que querés modificar.");
    if (resource === "equipos" && !localClientes.some((item) => String(item.id) === String(payload.clienteId))) {
      throw new Error("Seleccioná un cliente existente.");
    }
    Object.assign(record, payload);
    return { record, source: "demo" };
  }
}

async function remove(resource, id) {
  try {
    return { record: await request(`/${resource}/${id}`, { method: "DELETE" }), source: "api" };
  } catch (error) {
    if (!isConnectionError(error)) throw error;
    const records = getLocalRecords(resource);
    const index = records.findIndex((item) => String(item.id) === String(id));
    if (index === -1) throw new Error("No se encontró el registro que querés eliminar.");
    if (resource === "clientes" && localEquipos.some((item) => String(item.clienteId) === String(id))) {
      throw new Error("No se puede eliminar el cliente porque todavía tiene equipos asociados. Eliminá primero sus equipos.");
    }
    const [record] = records.splice(index, 1);
    return { record, source: "demo" };
  }
}

export const getClientes = ({ q = "", page = 1, limit = 10, sortBy = "id", order = "asc" } = {}) => list("clientes", q, page, limit, sortBy, order);
export const getEquipos = ({ q = "", page = 1, limit = 10, sortBy = "id", order = "asc" } = {}) => list("equipos", q, page, limit, sortBy, order);
export const getClienteById = (id) => getOne("clientes", id);
export const getEquipoById = (id) => getOne("equipos", id);
export const createCliente = (payload) => create("clientes", payload);
export const updateCliente = (id, payload) => update("clientes", id, payload);
export const deleteCliente = (id) => remove("clientes", id);
export const createEquipo = (payload) => create("equipos", payload);
export const updateEquipo = (id, payload) => update("equipos", id, payload);
export const deleteEquipo = (id) => remove("equipos", id);
