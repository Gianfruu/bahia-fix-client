const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1").replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(result.message || `Error ${response.status} al comunicarse con la API.`);
  }

  return result.data;
}

export async function getReparaciones(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/reparaciones${query ? `?${query}` : ""}`);
}

export async function createReparacion(payload) {
  return request("/reparaciones", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateReparacion(id, payload) {
  return request(`/reparaciones/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function deleteReparacion(id) {
  return request(`/reparaciones/${id}`, { method: "DELETE" });
}

export async function getClientesParaReparaciones() {
  const data = await request("/clientes?page=1&limit=100");
  return data.items || [];
}

export async function getEquiposParaReparaciones() {
  const data = await request("/equipos?page=1&limit=200");
  return data.items || [];
}
