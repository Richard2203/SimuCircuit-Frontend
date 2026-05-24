/**
 * adminsService — Gestion de cuentas de administrador.
 * Todos los endpoints requieren Authorization: Bearer <idToken>
 * El apiClient lo agrega automaticamente si la ruta esta en requiereAuth().
 */

import { apiClient } from '../simulator/apiClient';

/**
 * Lista todos los administradores registrados.
 * @returns {Promise<{ uid, email, nombre, creadoEn, ultimoLogin }[]>}
 */
async function obtenerAdmins() {
  const data = await apiClient.get('/api/admin/gestion-admin');
  return data.admins ?? [];
}

/**
 * Crea un nuevo administrador.
 * @param {{ correo: string, contrasena: string, nombre: string }} params
 */
async function agregarAdmin({ correo, contrasena, nombre }) {
  if (!correo || !contrasena || !nombre) {
    throw Object.assign(new Error('correo, contrasena y nombre son requeridos.'), { status: 400 });
  }

  const data = await apiClient.post('/api/admin/register', {
    email:    correo,
    password: contrasena,
    nombre,
  });

  return data.usuario;
}

/**
 * Edita el email y/o nombre de un administrador.
 * Cualquier admin puede editar a cualquier otro
 *
 * @param {{ uid: string, correo?: string, nombre?: string }} params
 */
async function editarAdmin({ uid, correo, nombre }) {
  if (!uid) {
    throw Object.assign(new Error('uid es requerido.'), { status: 400 });
  }
  if (!correo && !nombre) {
    throw Object.assign(new Error('Debes enviar al menos correo o nombre.'), { status: 400 });
  }

  const body = {};
  if (correo) body.email  = correo;
  if (nombre) body.nombre = nombre;

  const data = await apiClient.put(`/api/admin/gestion-admin/${uid}`, body);
  return data.usuario;
}

/**
 * Elimina un administrador.
 * Cualquier admin puede eliminar a cualquier otro, excepto a si mismo.
 *
 * @param {{ uid: string }} params
 */
async function eliminarAdmin({ uid }) {
  if (!uid) {
    throw Object.assign(new Error('uid es requerido.'), { status: 400 });
  }

  await apiClient.delete(`/api/admin/gestion-admin/${uid}`);
  return { mensaje: 'Administrador eliminado correctamente.' };
}

export const adminsService = {
  obtenerAdmins,
  agregarAdmin,
  editarAdmin,
  eliminarAdmin,
};