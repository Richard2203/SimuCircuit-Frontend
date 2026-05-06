/**
 * TeoremasService — Dominio: teoremas de circuitos
 * Cubre los endpoints:
 *   POST /api/teoremas/thevenin-norton
 *   POST /api/teoremas/superposicion
 *   POST /api/teoremas/transformar-fuente
 */

import { apiClient } from './apiClient';

/**
 * Calcula el equivalente Thevenin / Norton.
 * Body: { nombre_circuito, componenteCargaId, netlist }
 */
async function calcularTheveninNorton({ componenteCargaId, netlist, nombre_circuito } = {}) {
  if (!componenteCargaId) throw new Error('Se requiere componenteCargaId.');
  const res = await apiClient.post('/api/teoremas/thevenin-norton', {
    nombre_circuito,
    componenteCargaId,
    netlist,
  });
  return res.data;
}

/**
 * Aplica superposicion sobre un componente objetivo.
 * Body: { nombre_circuito, componenteObjetivoId, parametroAnalisis, netlist }
 * parametroAnalisis: "voltaje" | "corriente"
 */
async function calcularSuperposicion({ componenteObjetivoId, parametroAnalisis, netlist, nombre_circuito } = {}) {
  if (!componenteObjetivoId) throw new Error('Se requiere componenteObjetivoId.');
  if (!['voltaje', 'corriente'].includes(parametroAnalisis))
    throw new Error('parametroAnalisis debe ser "voltaje" o "corriente".');

  const res = await apiClient.post('/api/teoremas/superposicion', {
    nombre_circuito,
    componenteObjetivoId,
    parametroAnalisis,
    netlist,
  });
  return res.data;
}

/**
 * Transforma una fuente: voltaje <-> corriente.
 * Body: { nombre_circuito, fuenteId, netlist }
 */
async function transformarFuente({ fuenteId, netlist, nombre_circuito } = {}) {
  if (!fuenteId) throw new Error('Se requiere fuenteId.');
  const res = await apiClient.post('/api/teoremas/transformar-fuente', {
    nombre_circuito,
    fuenteId,
    netlist,
  });
  return res.data;
}

export const TeoremasService = {
  calcularTheveninNorton,
  calcularSuperposicion,
  transformarFuente,
};