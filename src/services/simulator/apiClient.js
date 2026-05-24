const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const ADMIN_TOKEN_KEY = 'admin_auth_token';

/** Devuelve el token actual o null si no hay sesion */
export function getAuthToken() {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  try {
    if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch { }
}

export function clearAuthToken() {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch { }
}

function requiereAuth(path) {
  const rutasProtegidas = [
    '/api/admin/logout',
    '/api/admin/register',
    '/api/admin/crearCircuito',
    '/api/admin/modificarCircuito',
    '/api/admin',
  ];
  return rutasProtegidas.some((ruta) => path.startsWith(ruta));
}

export class ApiError extends Error {
  constructor(mensaje, status, data = null) {
    super(mensaje);
    this.name   = 'ApiError';
    this.status = status;
    this.data   = data;
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  if (requiereAuth(path)) {
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (e) {
    throw new ApiError(`No se pudo conectar al servidor: ${e.message}`, 0);
  }

  if (response.status === 204) return null;

  let body;
  try {
    body = await response.json();
  } catch {
    if (response.ok) return null;
    throw new ApiError(`Respuesta no válida del servidor (${response.status})`, response.status);
  }

  if (!response.ok) {
    const mensaje = body?.error ?? body?.mensaje ?? body?.message ?? `Error ${response.status}`;
    if (response.status === 401 && requiereAuth(path)) clearAuthToken();
    throw new ApiError(mensaje, response.status, body);
  }

  return body;
}

/* API publica del cliente */

export const apiClient = {
  get(path)        { return request(path, { method: 'GET' }); },
  post(path, body) { return request(path, { method: 'POST',   body: JSON.stringify(body ?? {}) }); },
  put(path, body)  { return request(path, { method: 'PUT',    body: JSON.stringify(body ?? {}) }); },
  delete(path)     { return request(path, { method: 'DELETE' }); },
};