/**
 * ReguladorVoltaje.js — Regulador lineal fijo o ajustable (LM7805, LM317, …).
 *
 * Mapea sobre la tabla `regulador_voltaje`:
 *   tipo, voltaje_salida, corriente_maxima, voltaje_entrada_min,
 *   voltaje_entrada_max, dropout_voltage, disipacion_maxima, tolerancia.
 *
 * `value` es el código comercial (LM7805, LM317, LM7905, …).
 */

import { Component } from '../Component';

export const REGULADOR_DEFAULT_PARAMS = Object.freeze({
  tipo:                'Lineal Fijo',
  voltaje_salida:      '5.000',
  corriente_maxima:    '1.500',
  voltaje_entrada_min: '7.000',
  voltaje_entrada_max: '35.000',
  dropout_voltage:     '2.000',
  disipacion_maxima:   '15.000',
  tolerancia:          '4.00',
});

export class ReguladorVoltaje extends Component {
  constructor(args = {}) {
    super({ ...args, type: 'regulador_voltaje' });
    this.params = { ...REGULADOR_DEFAULT_PARAMS, ...this.params };
  }

  /** @returns {'Lineal Fijo'|'Lineal Ajustable'|string} */
  get subtipo() { return this.params.tipo; }

  /** @returns {boolean} */
  get esFijo()      { return /fijo/i.test(this.subtipo ?? ''); }

  /** @returns {boolean} */
  get esAjustable() { return /ajustable/i.test(this.subtipo ?? ''); }

  /** @returns {number} - volts */
  get voltajeSalida()     { return parseFloat(this.params.voltaje_salida) || 0; }

  /** @returns {number} - amperes */
  get corrienteMaxima()   { return parseFloat(this.params.corriente_maxima) || 0; }

  /** @returns {number} - volts */
  get voltajeEntradaMin() { return parseFloat(this.params.voltaje_entrada_min) || 0; }

  /** @returns {number} - volts */
  get voltajeEntradaMax() { return parseFloat(this.params.voltaje_entrada_max) || 0; }

  /** @returns {number} - volts */
  get dropoutVoltage()    { return parseFloat(this.params.dropout_voltage) || 0; }

  /** @returns {number} - watts */
  get disipacionMaxima()  { return parseFloat(this.params.disipacion_maxima) || 0; }

  /** @returns {number} - porcentaje */
  get tolerancia()        { return parseFloat(this.params.tolerancia) || 0; }
}
