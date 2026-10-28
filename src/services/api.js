import { demoClientes, demoEquipos } from "../data/demo-data.js";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1").replace(/\/$/, "");

async function request(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "No se pudo completar la solicitud.");
  }

  return result.data;
}

function filterAndPaginate(records, query, page, limit) {
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const filtered = records.filter((record) =>
    Object.values(record).some((value) => String(value).toLocaleLowerCase("es").includes(normalizedQuery))
  );
  const start = (page - 1) * limit;

  return {
    items: filtered.slice(start, start + limit),
    total: filtered.length,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(filtered.length / limit))
  };
}

export async function getClientes({ q = "", page = 1, limit = 10 } = {}) {
  try {
    return { ...await request(`/clientes?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`), source: "api" };
  } catch {
    return { ...filterAndPaginate(demoClientes, q, page, limit), source: "demo" };
  }
}

export async function getEquipos({ q = "", page = 1, limit = 10 } = {}) {
  try {
    return { ...await request(`/equipos?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`), source: "api" };
  } catch {
    return { ...filterAndPaginate(demoEquipos, q, page, limit), source: "demo" };
  }
}

export async function getClienteById(id) {
  try {
    return { record: await request(`/clientes/${id}`), source: "api" };
  } catch {
    return { record: demoClientes.find((cliente) => String(cliente.id) === String(id)) || null, source: "demo" };
  }
}

export async function getEquipoById(id) {
  try {
    return { record: await request(`/equipos/${id}`), source: "api" };
  } catch {
    return { record: demoEquipos.find((equipo) => String(equipo.id) === String(id)) || null, source: "demo" };
  }
}
