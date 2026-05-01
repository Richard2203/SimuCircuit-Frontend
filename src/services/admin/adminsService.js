/**
 * adminsService — Dominio: gestión de administradores
 *
 * NOTA: Todas las funciones retornan datos mock temporalmente.
 * Cuando el backend esté disponible, reemplazar el cuerpo de cada
 * función sin tocar nada más del proyecto.
 */

import { apiClient } from '../simulator/apiClient';

/** Mock de administradores */
let MOCK_ADMINS = [
  { id: 1, correo: 'admin@simu.mx' },
];

/**
 * Obtiene la lista de todos los administradores.
 * @returns {Promise<Array<{ id: number, correo: string }>>}
 */
async function obtenerAdmins() {
  // TODO: conectar con backend
  // return apiClient.get('/api/admin/admins');
  return [...MOCK_ADMINS];
}

/**
 * Agrega un nuevo administrador al sistema.
 * @param {{ correo: string, contrasena: string }} payload
 * @returns {Promise<{ id: number, correo: string } | null>}
 */
async function agregarAdmin({ correo, contrasena }) {
  // TODO: conectar con backend
  // return apiClient.post('/api/admin/admins', { correo, contrasena });
  const nuevo = { id: Date.now(), correo };
  MOCK_ADMINS.push(nuevo);
  return nuevo;
}

/**
 * Edita el correo de un administrador existente.
 * @param {{ id: number, correo: string }} payload
 * @returns {Promise<{ mensaje: string } | null>}
 */
async function editarCorreoAdmin({ id, correo }) {
  // TODO: conectar con backend
  // return apiClient.post(`/api/admin/admins/${id}/correo`, { correo });
  MOCK_ADMINS = MOCK_ADMINS.map((a) => (a.id === id ? { ...a, correo } : a));
  return { mensaje: 'Correo actualizado correctamente.' };
}

/**
 * Elimina un administrador por ID.
 * Un admin no puede eliminarse a sí mismo (validar en frontend antes de llamar).
 * @param {{ id: number }} payload
 * @returns {Promise<{ mensaje: string } | null>}
 */
async function eliminarAdmin({ id }) {
  // TODO: conectar con backend
  // return apiClient.post(`/api/admin/admins/${id}/eliminar`, {});
  MOCK_ADMINS = MOCK_ADMINS.filter((a) => a.id !== id);
  return { mensaje: 'Administrador eliminado correctamente.' };
}

/**
 * Cambia la contraseña del administrador autenticado.
 * @param {{ id: number, contrasena_actual: string, nueva_contrasena: string }} payload
 * @returns {Promise<{ mensaje: string } | null>}
 */
async function cambiarContrasena({ id, contrasena_actual, nueva_contrasena }) {
  // TODO: conectar con backend
  // return apiClient.post(`/api/admin/admins/${id}/contrasena`, { contrasena_actual, nueva_contrasena });
  console.log('[mock] Cambiando contraseña para admin:', id);
  return { mensaje: 'Contraseña actualizada correctamente.' };
}

export const adminsService = {
  obtenerAdmins,
  agregarAdmin,
  editarCorreoAdmin,
  eliminarAdmin,
  cambiarContrasena,
};
