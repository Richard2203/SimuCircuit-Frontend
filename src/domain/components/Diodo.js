import { Component } from '../Component';

/**
 * Sub-tipos validos segun la BD.
 * @type {ReadonlyArray<string>}
 */
export const SUBTIPOS_DIODO = Object.freeze([
  'Señal', 'Schottky', 'Rectificador', 'Zener',
  'LED', 'LED_Ultrabrillante', 'LED_IR',
]);

export const DIODO_DEFAULT_PARAMS = Object.freeze({
  tipo:            'Rectificador',
  corriente_max:   '1.000',
  voltaje_inv_max: '100.000',
  caida_tension:   '0.700',
  rz:              '0.00',
  is_saturacion:   '1e-14',
});

/**
 * Caidas de tension tipicas por color de LED (volts), segun la BD actual.
 * @type {Readonly<Record<string, number>>}
 */
export const LED_VF_TIPICOS = Object.freeze({
  ROJO:        1.700,
  VERDE:       2.200,
  AMARILLO:    1.800,
  AZUL:        3.300,
  'BLANCO UB': 3.300,
  INFRARROJO:  1.200,
});

export class Diodo extends Component {
  constructor(args = {}) {
    super({ ...args, type: 'diodo' });
    this.params = { ...DIODO_DEFAULT_PARAMS, ...this.params };
  }

  /** @returns {string} - subtipo (Rectificador, Zener, LED, …) */
  get subtipo()         { return this.params.tipo; }

  /** @returns {number} - amperes */
  get corrienteMax()    { return parseFloat(this.params.corriente_max) || 0; }

  /** @returns {number} - volts */
  get voltajeInverso()  { return parseFloat(this.params.voltaje_inv_max) || 0; }

  /** @returns {number} - volts */
  get caidaTension()    { return parseFloat(this.params.caida_tension) || 0; }

  /** @returns {number} - resistencia Zener, ohms */
  get rz()              { return parseFloat(this.params.rz) || 0; }

  /** @returns {string} */
  get isSaturacion()    { return String(this.params.is_saturacion ?? '1e-14'); }

  /** @returns {boolean} */
  get esLED() {
    return (this.subtipo ?? '').toLowerCase().startsWith('led');
  }

  /** @returns {boolean} */
  get esZener() {
    return (this.subtipo ?? '').toLowerCase() === 'zener';
  }

  /** @returns {boolean} */
  get esRectificador() {
    return (this.subtipo ?? '').toLowerCase() === 'rectificador';
  }

  /**
   * LED Value ->  ROJO, VERDE, AMARILLO, ....
   * Diodos -> codigo comercial 1N4148, 1N4007,...
   * @returns {string|null}
   */
  get colorLED() {
    if (!this.esLED) return null;
    return this.value || null;
  }
}
