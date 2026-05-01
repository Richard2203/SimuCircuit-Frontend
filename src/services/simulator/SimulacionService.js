/**
 * SimulacionService — Dominio: simulación
 * Cubre los endpoints:
 *   POST /api/simular/dc
 *   POST /api/simular/ac
 */

import { apiClient } from './apiClient';

/**
 * Valida que una netlist sea un arreglo con al menos un componente.
 * @param {Array} netlist
 * @throws {Error} si la netlist no es válida
 */
function validarNetlist(netlist) {
  if (!Array.isArray(netlist) || netlist.length === 0) {
    throw new Error('La netlist debe ser un arreglo con al menos un componente.');
  }
}

/**
 * Ejecuta un análisis DC sobre la netlist dada.
 * @param {object} params
 * @param {Array}  params.netlist
 * @param {string} [params.nombre_circuito]
 * @returns {Promise<{ voltages, currents, voltageSourceCurrents }>}
 */
async function simularDC({ netlist, nombre_circuito } = {}) {
  validarNetlist(netlist);

  const body = { netlist };
  if (nombre_circuito) body.nombre_circuito = nombre_circuito;

  const res = await apiClient.post('/api/simular/dc', body);
  return res.data;
}

/**
 * Ejecuta un análisis AC en barrido de frecuencia.
 * @param {object} params
 * @param {Array}  params.netlist
 * @param {object} params.configuracion_ac
 * @param {number} params.configuracion_ac.f_inicial
 * @param {number} params.configuracion_ac.f_final
 * @param {number} params.configuracion_ac.puntos
 * @param {string} params.configuracion_ac.barrido - "log" | "lineal"
 * @param {string} [params.nombre_circuito]
 * @returns {Promise<Array>} - Arreglo de puntos { frecuencia, voltages }
 */
async function simularAC({ netlist, configuracion_ac, nombre_circuito } = {}) {
  validarNetlist(netlist);

  if (
    !configuracion_ac ||
    configuracion_ac.f_inicial == null ||
    configuracion_ac.f_final  == null ||
    configuracion_ac.puntos   == null ||
    !configuracion_ac.barrido
  ) {
    throw new Error(
      'Se requiere configuracion_ac con f_inicial, f_final, puntos y barrido.'
    );
  }

  const body = { netlist, configuracion_ac };
  if (nombre_circuito) body.nombre_circuito = nombre_circuito;

  const res = await apiClient.post('/api/simular/ac', body);
  return res.data;
}

export const SimulacionService = { simularDC, simularAC };