/**
 * authService — Autenticacion de administradores.
 *
 * Endpoints esperados (cuando se implementen):
 *   POST /api/admin/auth/login         { correo, contrasena } → { admin, token }
 *   POST /api/admin/auth/recuperacion  { correo }             → { mensaje }
 *   POST /api/admin/auth/restablecer   { token, nueva_contrasena } → { mensaje }
 *
 *  Credenciales de prueba:    admin@simu.mx / Admin1234!
 */

import { setAuthToken, clearAuthToken } from '../simulator/apiClient';

/* ── Mock de credenciales validas       */

const CREDS_KEY = 'admin_mock_credentials';

function getCreds() {
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* localStorage bloqueado */ }
  // Default
  return { 'admin@simu.mx': 'Admin1234!' };
}

function setCreds(creds) {
  try { localStorage.setItem(CREDS_KEY, JSON.stringify(creds)); }
  catch { /* localStorage bloqueado */ }
}

/* ── JWT falso para validar ──── */

function base64UrlEncode(obj) {
  const json = typeof obj === 'string' ? obj : JSON.stringify(obj);
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Genera un token con forma de JWT real (header.payload.signature) 
 */
function generarTokenFake(admin) {
  const header  = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: admin.id,
    correo: admin.correo,
    iss:  'simucircuit-admin-mock',
    iat:  Math.floor(Date.now() / 1000),
    exp:  Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24h
  };
  const sig = 'FAKE_SIGNATURE_REPLACE_WITH_REAL_BACKEND';
  return `${base64UrlEncode(header)}.${base64UrlEncode(payload)}.${sig}`;
}

/* ── API ──────────────────────────────────────────────────── */

/**
 * Inicia sesion de administrador.
 * @param {{ correo: string, contrasena: string }} credentials
 * @returns {Promise<{ admin: { id: number, correo: string }, token: string }>}
 */
async function loginAdmin({ correo, contrasena }) {
  // Simulamos latencia de red
  await new Promise((r) => setTimeout(r, 250));

  const creds = getCreds();
  if (!creds[correo] || creds[correo] !== contrasena) {
    const err = new Error('Credenciales incorrectas');
    err.status = 401;
    throw err;
  }

  // Buscar el admin en el mock de adminsService (para conservar el mismo id)
  let admin;
  try {
    const raw = localStorage.getItem('admin_mock_admins');
    const list = raw ? JSON.parse(raw) : [];
    admin = list.find((a) => a.correo === correo);
  } catch { /* ignore */ }

  if (!admin) {
    admin = { id: 1, correo };
  }

  const token = generarTokenFake(admin);
  setAuthToken(token);
  return { admin, token };
}

/**
 * Cierra la sesion local (limpia el token).
 */
function logoutAdmin() {
  clearAuthToken();
}

/**
 * Solicita un enlace de recuperacion de contraseña.
 */
async function solicitarRecuperacion({ correo }) {
  await new Promise((r) => setTimeout(r, 200));
  // eslint-disable-next-line no-console
  console.info(`[mock] Recuperación solicitada para "${correo}". En modo real se enviaría un email con un token temporal.`);
  return { mensaje: 'Si el correo está registrado, recibirás un enlace en breve.' };
}

/**
 * Restablece la contraseña usando un token de recuperacion
 */
async function restablecerContrasena({ token, nueva_contrasena }) {
  await new Promise((r) => setTimeout(r, 200));
  if (!token || !nueva_contrasena) {
    const err = new Error('Token o contraseña faltantes.');
    err.status = 400;
    throw err;
  }
  // En el mock, asumimos que el token corresponde a admin@simu.mx
  const creds = getCreds();
  creds['admin@simu.mx'] = nueva_contrasena;
  setCreds(creds);
  return { mensaje: 'Contraseña actualizada correctamente.' };
}

export const _mockAuthInternals = {
  getCreds,
  setCreds,
};

export const authService = {
  loginAdmin,
  logoutAdmin,
  solicitarRecuperacion,
  restablecerContrasena,
};
