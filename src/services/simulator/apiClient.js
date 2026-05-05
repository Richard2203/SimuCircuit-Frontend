const BASE_URL = 'http://localhost:3001';

/* -- Token de administrador --------------------------------- */

const ADMIN_TOKEN_KEY = 'admin_auth_token';

/**
 * Token placeholder usado cuando no hay sesion activa.
 */
export const FAKE_ADMIN_TOKEN = 'FAKE_ADMIN_TOKEN_REPLACE_ME';

/** Devuelve el token actual (real si hay sesion, fake si no). */
export function getAuthToken() {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || FAKE_ADMIN_TOKEN;
  } catch {
    return FAKE_ADMIN_TOKEN;
  }
}

/** Guarda el token */
export function setAuthToken(token) {
  try {
    if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch { /* localStorage bloqueado */ }
}

/** Limpia el token (logout). */
export function clearAuthToken() {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch { /* localStorage bloqueado */ }
}

/* -- Deteccion de rutas que requieren auth ------------------- */

/**
 * Decide si una ruta debe llevar el header Authorization.
 * Solo las rutas /api/admin/... lo requieren, excepto las de auth publica.
 */
function requiereAuth(path) {
  if (!path.startsWith('/api/admin/')) return false;
  // Rutas publicas dentro del namespace admin:
  if (path.startsWith('/api/admin/auth/login'))        return false;
  if (path.startsWith('/api/admin/auth/recuperacion')) return false;
  if (path.startsWith('/api/admin/auth/restablecer'))  return false;
  return true;
}

/* -- Errores -------------------------------------------------- */

export class ApiError extends Error {
  constructor(mensaje, status, data = null) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/* -- Request principal ---------------------------------------- */

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  if (requiereAuth(path)) {
    headers['Authorization'] = `Bearer ${getAuthToken()}`;
  }

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (e) {
    throw new ApiError(`No se pudo conectar al servidor: ${e.message}`, 0);
  }

  // 204 No Content (tipico de DELETE) — no hay cuerpo JSON
  if (response.status === 204) return null;

  let body;
  try {
    body = await response.json();
  } catch {
    if (response.ok) return null;
    throw new ApiError(`Respuesta no válida del servidor (${response.status})`, response.status);
  }

  if (!response.ok) {
    const mensaje = body?.mensaje ?? body?.message ?? `Error ${response.status}`;
    // Si es 401 en una ruta admin protegida → limpiar token (sesión inválida)
    if (response.status === 401 && requiereAuth(path)) clearAuthToken();
    throw new ApiError(mensaje, response.status, body);
  }

  return body;
}

/* --- API publica del cliente ................................... */

export const apiClient = {
  get(path) {
    return request(path, { method: 'GET' });
  },

  post(path, body) {
    return request(path, {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  },

  put(path, body) {
    return request(path, {
      method: 'PUT',
      body: JSON.stringify(body ?? {}),
    });
  },

  delete(path) {
    return request(path, { method: 'DELETE' });
  },
};
