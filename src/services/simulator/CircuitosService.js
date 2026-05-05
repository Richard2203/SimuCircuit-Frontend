import { apiClient } from './apiClient';
import { Circuit }   from '../../domain';

/**
 * Obtiene las opciones disponibles para los filtros de la biblioteca.
 * @returns {Promise<{ temas: string[], componentes: string[], dificultades: string[], materias: string[] }>}
 */
async function getFiltros() {
  const res = await apiClient.get('/api/circuitos/filtros');
  return res.data;
}

/**
 * Busca circuitos con filtros opcionales.
 * Devuelve Circuit[] (no JSON).
 *
 * @param {object} [params]
 * @param {string} [params.nombreBusqueda]
 * @param {string} [params.dificultad]
 * @param {string} [params.materia]
 * @param {string} [params.tema]
 * @param {string[]} [params.componentes]
 * @returns {Promise<Circuit[]>}
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

  const qs  = query.toString();
  const res = await apiClient.get(`/api/circuitos${qs ? `?${qs}` : ''}`);
  const arr = Array.isArray(res.data) ? res.data : [];
  return arr.map(Circuit.fromApiList);
}

/**
 * Obtiene un circuito completo por ID, incluyendo su netlist.
 * Devuelve un Circuit (no JSON envuelto).
 *
 * @param {number|string} id
 * @returns {Promise<Circuit>}
 */
async function getCircuitoById(id) {
  const res = await apiClient.get(`/api/circuitos/${id}`);
  return Circuit.fromApiDetail(res.data);
}

export const CircuitosService = { getFiltros, getCircuitos, getCircuitoById };
