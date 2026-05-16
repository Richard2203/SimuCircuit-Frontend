/**
 * SimulacionService — Dominio: simulacion
 * Cubre los endpoints:
 *   POST /api/simular/dc
 *   POST /api/simular/ac
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
  console.log('Respuesta DC:', JSON.stringify(res, null, 2 ));
  return {
    resultado: res.data ?? res,
    procedimiento: res.procedimiento ?? null,
  };
}

/**
 * Simula AC con barrido de frecuencia.
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

  const res = await apiClient.post('/api/simular/ac', {
    configuracion_ac,
    nombre_circuito,
    netlist,
    id,
  });

  const data = res.data ?? res;
  let resultado;
  if (Array.isArray(data))           resultado = data;             
  else if (data?.frequencySweep)     resultado = transformarAC(data);
  else                               resultado = [];

  return {
    resultado,
    procedimiento: res.procedimiento ?? null,
  };
}

export const SimulacionService = { simularDC, simularAC };