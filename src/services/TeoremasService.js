/**
 * TeoremasService — Dominio: teoremas de circuitos
 * Cubre los endpoints:
 *   POST /api/teoremas/thevenin-norton
 *   POST /api/teoremas/superposicion
 */

import { apiClient } from './apiClient';

/**
 * Calcula el equivalente de Thévenin / Norton para un componente de carga.
 * @param {object} params
 * @param {string} params.componenteCargaId - ID del componente de carga en la netlist
 * @param {Array}  params.netlist
 * @param {string} [params.nombre_circuito]
 * @returns {Promise<{ thevenin, norton, maximaPotencia, procedimiento }>}
 */
async function calcularTheveninNorton({ componenteCargaId, netlist, nombre_circuito } = {}) {
  if (!componenteCargaId) {
    throw new Error('Se requiere el ID del componente de carga (componenteCargaId).');
  }

  const body = { componenteCargaId, netlist };
  if (nombre_circuito) body.nombre_circuito = nombre_circuito;

  const res = await apiClient.post('/api/teoremas/thevenin-norton', body);
  return res.data;
}

/**
 * Aplica el principio de superposición sobre un componente objetivo.
 * @param {object} params
 * @param {string} params.componenteObjetivoId - ID del componente sobre el que se analiza
 * @param {string} params.parametroAnalisis    - "voltaje" | "corriente"
 * @param {Array}  params.netlist
 * @param {string} [params.nombre_circuito]
 * @returns {Promise<{ componenteObjetivo, parametro, valorTotal, unidad, aportaciones }>}
 */
async function calcularSuperposicion({
  componenteObjetivoId,
  parametroAnalisis,
  netlist,
  nombre_circuito,
} = {}) {
  if (!componenteObjetivoId) {
    throw new Error('Se requiere el ID del componente objetivo (componenteObjetivoId).');
  }
  if (!['voltaje', 'corriente'].includes(parametroAnalisis)) {
    throw new Error('parametroAnalisis debe ser "voltaje" o "corriente".');
  }

  const body = { componenteObjetivoId, parametroAnalisis, netlist };
  if (nombre_circuito) body.nombre_circuito = nombre_circuito;

  const res = await apiClient.post('/api/teoremas/superposicion', body);
  return res.data;
}

export const TeoremasService = { calcularTheveninNorton, calcularSuperposicion };