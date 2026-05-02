/**
 * apiClient — Cliente HTTP base
 * Centraliza fetch, manejo de errores, serialización y autenticación.
 *
 * AUTENTICACIÓN POR TOKEN:
 *   Las rutas que comienzan con `/api/admin/` (excepto las de auth pública)
 *   recibirían automáticamente el header `Authorization: Bearer <token>`.
 *
 *   ⚠ ESTADO ACTUAL: el backend admin no expone `/api/admin/*` aún. Los
 *   servicios de `services/admin/*.js` están MOCKEADOS contra localStorage,
 *   y solo las lecturas de circuitos pasan por `/api/circuitos` (público,
 *   sin token). En la práctica, `requiereAuth()` nunca se dispara.
 *
 *   Cuando el backend admin esté listo, los servicios admin reemplazarán
 *   sus mocks por llamadas reales a `apiClient.{get|post|put|delete}` y
 *   este token se enviará automáticamente.
 *
 *   El token se guarda en `localStorage[ADMIN_TOKEN_KEY]`. Lo establece
 *   `authService.loginAdmin()` al iniciar sesión.
 */

const BASE_URL = 'http://localhost:3001';

/* ── Token de administrador ───────────────────────────────── */

const ADMIN_TOKEN_KEY = 'admin_auth_token';

/**
 * Token placeholder usado cuando no hay sesión activa.
 * El backend puede reconocerlo y devolver datos en modo desarrollo,
 * o rechazarlo cuando la auth real esté implementada.
 */
export const FAKE_ADMIN_TOKEN = 'FAKE_ADMIN_TOKEN_REPLACE_ME';

/** Devuelve el token actual (real si hay sesión, fake si no). */
export function getAuthToken() {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || FAKE_ADMIN_TOKEN;
  } catch {
    return FAKE_ADMIN_TOKEN;
  }
}

/** Guarda el token (lo llama authService.loginAdmin tras login exitoso). */
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

/* ── Detección de rutas que requieren auth ────────────────── */

/**
 * Decide si una ruta debe llevar el header Authorization.
 * Solo las rutas /api/admin/... lo requieren, excepto las de auth pública.
 */
function requiereAuth(path) {
  if (!path.startsWith('/api/admin/')) return false;
  // Rutas públicas dentro del namespace admin:
  if (path.startsWith('/api/admin/auth/login'))        return false;
  if (path.startsWith('/api/admin/auth/recuperacion')) return false;
  if (path.startsWith('/api/admin/auth/restablecer'))  return false;
  return true;
}

/* ── Errores ──────────────────────────────────────────────── */

export class ApiError extends Error {
  constructor(mensaje, status, data = null) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/* ── Request principal ────────────────────────────────────── */

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

  // 204 No Content (típico de DELETE) — no hay cuerpo JSON
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

/* ── API pública del cliente ──────────────────────────────── */

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
