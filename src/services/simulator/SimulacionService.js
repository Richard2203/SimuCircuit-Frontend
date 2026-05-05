import { apiClient } from './apiClient';

/**
 * Valida que una netlist sea un arreglo con al menos un componente.
 * @param {Array} netlist
 * @throws {Error} si la netlist no es valida
 */
function validarNetlist(netlist) {
  if (!Array.isArray(netlist) || netlist.length === 0) {
    throw new Error('La netlist debe ser un arreglo con al menos un componente.');
  }
}

/**
 * Transforma la respuesta cruda del backend AC al formato que consume WaveformChart. *
 * @param {object} raw — respuesta cruda de /api/simular/ac
 * @returns {Array}
 */
function transformarAC(raw) {
  const { phasorVoltages = {}, phasorCurrents = {}, frequencySweep = [] } = raw;

  return frequencySweep.map((freq, idx) => {
    const voltages = {};
    for (const [nodo, fasores] of Object.entries(phasorVoltages)) {
      const fasor = fasores[idx] ?? { re: 0, im: 0 };
      const re  = fasor.re  ?? fasor[0] ?? 0;
      const im  = fasor.im  ?? fasor[1] ?? 0;
      const magnitud = Math.sqrt(re * re + im * im);
      const fase     = (Math.atan2(im, re) * 180) / Math.PI;
      voltages[nodo] = { magnitud, fase, re, im };
    }

    const currents = {};
    for (const [comp, fasores] of Object.entries(phasorCurrents)) {
      const fasor = fasores[idx] ?? { re: 0, im: 0 };
      const re  = fasor.re  ?? fasor[0] ?? 0;
      const im  = fasor.im  ?? fasor[1] ?? 0;
      const magnitud = Math.sqrt(re * re + im * im);
      const fase     = (Math.atan2(im, re) * 180) / Math.PI;
      currents[comp] = { magnitud, fase, re, im };
    }

    return { frecuencia: freq, voltages, currents };
  });
}

/**
 * Ejecuta un analisis DC sobre la netlist dada.
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
 * Ejecuta un analisis AC en barrido de frecuencia.
 * Devuelve el resultado ya transformado al formato que consume WaveformChart:
 *   Array de { frecuencia, voltages: { nodo: { magnitud, fase, re, im } } }
 *
 * @param {object} params
 * @param {Array}  params.netlist
 * @param {object} params.configuracion_ac
 * @param {number} params.configuracion_ac.f_inicial
 * @param {number} params.configuracion_ac.f_final
 * @param {number} params.configuracion_ac.puntos
 * @param {string} params.configuracion_ac.barrido - "log" | "lineal"
 * @param {string} [params.nombre_circuito]
 * @returns {Promise<Array>} — Array de { frecuencia, voltages, currents }
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

  // se detecta si res.data viene en formato crudo del backend (phasorVoltages + frequencySweep)
  // o ya en el formato transformado (array de { frecuencia, voltages }).
  const data = res.data;
  if (Array.isArray(data)) return data;                  // ya transformado
  if (data?.frequencySweep) return transformarAC(data);  // formato crudo del backend
  return [];
}

export const SimulacionService = { simularDC, simularAC };