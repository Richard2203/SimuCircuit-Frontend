/**
 * CircuitosService — Dominio: circuitos
 * Cubre los endpoints:
 *   GET /api/circuitos/filtros
 *   GET /api/circuitos
 *   GET /api/circuitos/:id
 */

import { apiClient } from './apiClient';

/**
 * Obtiene las opciones disponibles para los filtros de la biblioteca.
 * @returns {Promise<{ temas, componentes, dificultades, materias }>}
 */
async function getFiltros() {
  const res = await apiClient.get('/api/circuitos/filtros');
  return res.data;
}

/**
 * Busca circuitos con filtros opcionales.
 * @param {object} params
 * @param {string} [params.nombreBusqueda]
 * @param {string} [params.dificultad]
 * @param {string} [params.materia]
 * @param {string} [params.tema]
 * @param {string[]} [params.componentes]
 * @returns {Promise<Array>}
 */
async function getCircuitos(params = {}) {
  const query = new URLSearchParams();

  if (params.nombreBusqueda) query.set('nombreBusqueda', params.nombreBusqueda);
  if (params.dificultad)     query.set('dificultad',     params.dificultad);
  if (params.materia)        query.set('materia',         params.materia);
  if (params.tema)           query.set('tema',            params.tema);

  if (Array.isArray(params.componentes)) {
    params.componentes.forEach((c) => query.append('componentes[]', c));
  }

  const qs = query.toString();
  const res = await apiClient.get(`/api/circuitos${qs ? `?${qs}` : ''}`);
  console.log('Circuitos obtenidos:', JSON.stringify(res.data, null, 2));
  return res.data;
}

/**
 * Obtiene un circuito completo por ID, incluyendo su netlist.
 * @param {number|string} id
 * @returns {Promise<{ circuito: object, netlist: Array }>}
 */
async function getCircuitoById(id) {
  const res = await apiClient.get(`/api/circuitos/${id}`);
  console.log(`Circuito ${id} obtenido:`, JSON.stringify(res.data, null, 2));
  return res.data;
}

export const CircuitosService = { getFiltros, getCircuitos, getCircuitoById };