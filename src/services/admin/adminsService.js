/**
 * adminsService — Gestion de cuentas de administrador.
 *
 * Endpoints esperados (cuando se implementen):
 *   GET    /api/admin/admins
 *   POST   /api/admin/admins                  { correo, contrasena }
 *   PUT    /api/admin/admins/:id              { correo }
 *   DELETE /api/admin/admins/:id
 *   POST   /api/admin/admins/:id/contrasena   { contrasena_actual, nueva_contrasena }
 */

import { _mockAuthInternals } from './authService';

const STORAGE_KEY = 'admin_mock_admins';

/* ── Estado persistente en localStorage ──────────────────────── */
function readAdmins() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  // Estado inicial: un solo admin para poder iniciar sesión
  return [{ id: 1, correo: 'admin@simu.mx' }];
}

function writeAdmins(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }
  catch { /* ignore */ }
}

function nextId(list) {
  const max = list.reduce((m, a) => Math.max(m, a.id ?? 0), 0);
  return max + 1;
}

/* ── API ─────────────────────────────────────────────────────── */

async function obtenerAdmins() {
  await new Promise((r) => setTimeout(r, 150));
  return readAdmins();
}

async function agregarAdmin({ correo, contrasena }) {
  await new Promise((r) => setTimeout(r, 200));
  if (!correo || !contrasena) {
    throw Object.assign(new Error('Faltan correo o contraseña.'), { status: 400 });
  }

  const list = readAdmins();
  if (list.some((a) => a.correo.toLowerCase() === correo.toLowerCase())) {
    throw Object.assign(new Error('Ya existe un admin con ese correo.'), { status: 409 });
  }
  if (list.length >= 2) {
    throw Object.assign(new Error('Solo se permiten 2 administradores.'), { status: 422 });
  }

  const nuevo = { id: nextId(list), correo };
  list.push(nuevo);
  writeAdmins(list);

  // Registrar la contraseña en el mock de auth
  const creds = _mockAuthInternals.getCreds();
  creds[correo] = contrasena;
  _mockAuthInternals.setCreds(creds);

  return nuevo;
}

async function editarCorreoAdmin({ id, correo }) {
  await new Promise((r) => setTimeout(r, 150));
  const list = readAdmins();
  const idx  = list.findIndex((a) => a.id === id);
  if (idx === -1) {
    throw Object.assign(new Error('Administrador no encontrado.'), { status: 404 });
  }
  if (list.some((a) => a.id !== id && a.correo.toLowerCase() === correo.toLowerCase())) {
    throw Object.assign(new Error('Otro admin ya usa ese correo.'), { status: 409 });
  }

  // Mover la contraseña a la nueva clave de correo
  const correoAnterior = list[idx].correo;
  const creds = _mockAuthInternals.getCreds();
  if (creds[correoAnterior]) {
    creds[correo] = creds[correoAnterior];
    delete creds[correoAnterior];
    _mockAuthInternals.setCreds(creds);
  }

  list[idx] = { ...list[idx], correo };
  writeAdmins(list);
  return { mensaje: 'Correo actualizado correctamente.' };
}

async function eliminarAdmin({ id }) {
  await new Promise((r) => setTimeout(r, 150));
  const list = readAdmins();
  const target = list.find((a) => a.id === id);
  if (!target) {
    throw Object.assign(new Error('Administrador no encontrado.'), { status: 404 });
  }

  // Limpiar tambien su contraseña
  const creds = _mockAuthInternals.getCreds();
  delete creds[target.correo];
  _mockAuthInternals.setCreds(creds);

  writeAdmins(list.filter((a) => a.id !== id));
  return { mensaje: 'Administrador eliminado correctamente.' };
}

async function cambiarContrasena({ id, contrasena_actual, nueva_contrasena }) {
  await new Promise((r) => setTimeout(r, 200));
  const list = readAdmins();
  const admin = list.find((a) => a.id === id);
  if (!admin) {
    throw Object.assign(new Error('Administrador no encontrado.'), { status: 404 });
  }

  const creds = _mockAuthInternals.getCreds();
  if (creds[admin.correo] !== contrasena_actual) {
    throw Object.assign(new Error('La contraseña actual no es correcta.'), { status: 401 });
  }

  creds[admin.correo] = nueva_contrasena;
  _mockAuthInternals.setCreds(creds);
  return { mensaje: 'Contraseña actualizada correctamente.' };
}

export const adminsService = {
  obtenerAdmins,
  agregarAdmin,
  editarCorreoAdmin,
  eliminarAdmin,
  cambiarContrasena,
};
