/**
 * ComponentesService — Dominio: componentes
 * Cubre el endpoint:
 *   GET /api/componentes
 */

import { apiClient } from './apiClient';

/**
 * Obtiene el catálogo completo de componentes disponibles.
 * @returns {Promise<{ total: number, data: Array }>}
 */
async function getComponentes() {
  const res = await apiClient.get('/api/componentes');
  return { total: res.total, data: res.data };
}

export const ComponentesService = { getComponentes };