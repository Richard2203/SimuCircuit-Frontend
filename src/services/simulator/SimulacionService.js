/**
 * SimulacionService — Dominio: simulacion
 * Cubre los endpoints:
 *   POST /api/simular/dc
 *   POST /api/simular/ac
 *   POST /api/analisis/transitorio
 */

import { apiClient } from './apiClient';

const BARRIDOS_VALIDOS = ['lineal', 'log', 'decada', 'octava'];

function validarNetlist(netlist) {
  if (!Array.isArray(netlist) || netlist.length === 0)
    throw new Error('La netlist debe ser un arreglo con al menos un componente.');
}

/**
 * Transforma la respuesta cruda del backend AC al formato que consume WaveformChart.
 * Backend devuelve: { phasorVoltages: { "1": [{re,im},...] }, frequencySweep: [...] }
 * WaveformChart espera: [{ frecuencia, voltages: { "1": { magnitud, fase, re, im } } }]
 */
function transformarAC(raw) {
  const { phasorVoltages = {}, phasorCurrents = {}, frequencySweep = [] } = raw;
  return frequencySweep.map((freq, idx) => {
    const voltages = {};
    for (const [nodo, fasores] of Object.entries(phasorVoltages)) {
      const f = fasores[idx] ?? { re: 0, im: 0 };
      const re = f.re ?? 0, im = f.im ?? 0;
      voltages[nodo] = {
        magnitud: Math.sqrt(re * re + im * im),
        fase: (Math.atan2(im, re) * 180) / Math.PI,
        re, im,
      };
    }
    const currents = {};
    for (const [comp, fasores] of Object.entries(phasorCurrents)) {
      const f = fasores[idx] ?? { re: 0, im: 0 };
      const re = f.re ?? 0, im = f.im ?? 0;
      currents[comp] = {
        magnitud: Math.sqrt(re * re + im * im),
        fase: (Math.atan2(im, re) * 180) / Math.PI,
        re, im,
      };
    }
    return { frecuencia: freq, voltages, currents };
  });
}

/**
 * Simula DC.
 * Body: { nombre_circuito, netlist }
 */
async function simularDC({ netlist, nombre_circuito, id } = {}) {
  validarNetlist(netlist);
  
  const res = await apiClient.post('/api/simular/dc', { nombre_circuito, netlist, id });
  
  return {
    resultado: res.data ?? res,
    procedimiento: res.procedimiento ?? null,
  };
}

/**
 * Simula AC con barrido de frecuencia.
 * Body: { configuracion_ac: { f_inicial, f_final, puntos, barrido }, nombre_circuito, netlist, id }
 * barrido: "lineal" | "log" | "decada" | "octava"
 *
 * Devuelve { resultado, procedimiento }:
 *   resultado    -> array transformado [{ frecuencia, voltages, currents }] que consume WaveformChart
 *   procedimiento -> pasos del ProcedureManager (mismo shape que DC) o null si el circuito no tiene plantilla
 */
async function simularAC({ netlist, configuracion_ac, nombre_circuito, id } = {}) {
  validarNetlist(netlist);

  if (!configuracion_ac) throw new Error('Se requiere configuracion_ac.');
  
  const { f_inicial, f_final, puntos, barrido } = configuracion_ac;

  if (f_inicial == null || f_final == null || puntos == null || !barrido)
    throw new Error('configuracion_ac requiere f_inicial, f_final, puntos y barrido.');

  if (!BARRIDOS_VALIDOS.includes(barrido))
    throw new Error(`barrido debe ser uno de: ${BARRIDOS_VALIDOS.join(', ')}.`);

  // apiClient retorna el body directamente, asi que res = { exito, tipo_analisis, data, procedimiento }
  const res = await apiClient.post('/api/simular/ac', {
    configuracion_ac,
    nombre_circuito,
    netlist,
    id,
  });

  const data = res.data ?? res;
  let resultado;
  if (Array.isArray(data))           resultado = data;             // ya transformado
  else if (data?.frequencySweep)     resultado = transformarAC(data); // formato crudo
  else                               resultado = [];

  return {
    resultado,
    procedimiento: res.procedimiento ?? null,
  };
}

/**
 * Simula transitorio (dominio del tiempo).
 * Body: { configuracion_transitorio: { t_stop, delta_t }, nombre_circuito, netlist, id }
 *
 * El backend devuelve un array de snapshots:
 *   [{ tiempo, voltajes: { nodo: V }, corrientes: { compId: I } }, ...]
 * 
 * Devuelve { resultado, procedimiento }:
 *   resultado    -> array de snapshots tal cual viene del backend
 *   procedimiento -> pasos del ProcedureManager o null
 */
async function simularTransitorio({ netlist, configuracion_transitorio, nombre_circuito, id } = {}) {
  validarNetlist(netlist);

  if (!configuracion_transitorio) throw new Error('Se requiere configuracion_transitorio.');
  const { t_stop, delta_t } = configuracion_transitorio;

  if (t_stop == null || delta_t == null)
    throw new Error('configuracion_transitorio requiere t_stop y delta_t (en segundos).');

  if (Number(t_stop) <= 0 || Number(delta_t) <= 0)
    throw new Error('t_stop y delta_t deben ser positivos.');

  if (Number(delta_t) >= Number(t_stop))
    throw new Error('delta_t debe ser menor que t_stop.');

  // Tope defensivo en el cliente: el servidor tambien lo valida pero asi avisamos
  // antes de hacer el round-trip.
  const totalSamples = Math.ceil(Number(t_stop) / Number(delta_t));
  if (totalSamples > 200000) {
    throw new Error(`Demasiados pasos (${totalSamples}). Aumenta delta_t o reduce t_stop.`);
  }

  const res = await apiClient.post('/api/analisis/transitorio', {
    configuracion_transitorio,
    nombre_circuito,
    netlist,
    id,
  });

  return {
    resultado: res.data ?? res,
    procedimiento: res.procedimiento ?? null,
  };
}

export const SimulacionService = { simularDC, simularAC, simularTransitorio };