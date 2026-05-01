/**
 * authService — Dominio: autenticacion de administradores
 */

import { apiClient } from '../simulator/apiClient';

/**
 * Inicia sesion de administrador.
 * @param {{ correo: string, contrasena: string }} credentials
 * @returns {Promise<{ token: string, admin: object } | null>}
 */
async function loginAdmin({ correo, contrasena }) {
  // TODO: conectar con backend
  // return apiClient.post('/api/admin/auth/login', { correo, contrasena });

  // Mock temporal — credenciales de prueba: admin@simu.mx / Admin1234!
  if (correo === 'admin@simu.mx' && contrasena === 'Admin1234!') {
    return {
      token: 'mock-token-abc123',
      admin: { id: 1, correo: 'admin@simu.mx' },
    };
  }
  throw new Error('Credenciales incorrectas');
}

/**
 * Solicita un enlace de recuperacion de contraseña.
 * @param {{ correo: string }} payload
 * @returns {Promise<{ mensaje: string } | null>}
 */
async function solicitarRecuperacion({ correo }) {
  // TODO: conectar con backend
  // return apiClient.post('/api/admin/auth/recuperacion', { correo });
  console.log('[mock] Solicitud de recuperación para:', correo);
  return { mensaje: 'Si el correo existe, recibirás un enlace en breve.' };
}

/**
 * Restablece la contraseña usando un token de recuperacion.
 * @param {{ token: string, nueva_contrasena: string }} payload
 * @returns {Promise<{ mensaje: string } | null>}
 */
async function restablecerContrasena({ token, nueva_contrasena }) {
  // TODO: conectar con backend
  // return apiClient.post('/api/admin/auth/restablecer', { token, nueva_contrasena });
  console.log('[mock] Restableciendo contraseña con token:', token);
  return { mensaje: 'Contraseña actualizada correctamente.' };
}

export const authService = { loginAdmin, solicitarRecuperacion, restablecerContrasena };
