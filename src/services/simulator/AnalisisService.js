/**
 * AnalisisService — Dominio: análisis de circuitos
 * Cubre los endpoints:
 *   POST /api/analisis/divisor-voltaje
 *   POST /api/analisis/divisor-corriente
 *   POST /api/analisis/resistencia-equivalente
 *   POST /api/analisis/transitorio
 */

import { apiClient } from './apiClient';

/**
 * Divisor de voltaje.
 * Body: { componenteObjetivoId, nombre_circuito, netlist }
 * Respuesta: { voltajeCaida, unidad, procedimiento }
 */
async function calcularDivisorVoltaje({ netlist, componenteObjetivoId, nombre_circuito } = {}) {
  const res = await apiClient.post('/api/analisis/divisor-voltaje', {
    componenteObjetivoId,
    nombre_circuito,
    netlist,
  });
  return res.data;
}

/**
 * Divisor de corriente.
 * Body: { nombre_circuito, componenteObjetivoId, netlist }
 * Respuesta: { corrienteCaida, unidad, procedimiento }
 */
async function calcularDivisorCorriente({ netlist, componenteObjetivoId, nombre_circuito } = {}) {
  const res = await apiClient.post('/api/analisis/divisor-corriente', {
    nombre_circuito,
    componenteObjetivoId,
    netlist,
  });
  return res.data;
}

/**
 * Resistencia equivalente entre dos nodos.
 * Body: { nombre_circuito, nodoA, nodoB, netlist }
 * Respuesta directa (sin envolver en data): { valor, unidad, nodos, mensaje }
 */
async function calcularResistenciaEquivalente({ netlist, nodoA, nodoB, nombre_circuito } = {}) {
  const res = await apiClient.post('/api/analisis/resistencia-equivalente', {
    nombre_circuito,
    nodoA,
    nodoB,
    netlist,
  });
  // El backend devuelve { exito, analisis, nodos, valor, unidad, mensaje } directamente
  return res;
}

/**
 * Análisis transitorio.
 * Body: { configuracion_transitorio: { t_stop, delta_t }, nombre_circuito, netlist }
 * Respuesta: Array de { tiempo, voltajes, corrientes }
 */
async function calcularTransitorio({ netlist, configuracion_transitorio, nombre_circuito } = {}) {
  const res = await apiClient.post('/api/analisis/transitorio', {
    configuracion_transitorio,
    nombre_circuito,
    netlist,
  });
  return res.data;
}

export const AnalisisService = {
  calcularDivisorVoltaje,
  calcularDivisorCorriente,
  calcularResistenciaEquivalente,
  calcularTransitorio,
};