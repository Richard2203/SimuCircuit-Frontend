import { apiClient } from './apiClient';

/**
 * Obtiene el catalogo completo de componentes disponibles.
 * @returns {Promise<{ total: number, data: Array }>}
 */
async function getComponentes() {
  const res = await apiClient.get('/api/componentes');
  return { total: res.total, data: res.data };
}

export const ComponentesService = { getComponentes };