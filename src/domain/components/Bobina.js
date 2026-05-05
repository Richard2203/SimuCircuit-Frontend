import { Component } from '../Component';

export const BOBINA_DEFAULT_PARAMS = Object.freeze({
  corriente_max:  '0.500',
  resistencia_dc: '5.000',
});

export class Bobina extends Component {
  constructor(args = {}) {
    super({ ...args, type: 'bobina' });
    this.params = { ...BOBINA_DEFAULT_PARAMS, ...this.params };
  }

  /** @returns {number} - amperes */
  get corrienteMax()    { return parseFloat(this.params.corriente_max) || 0; }

  /** @returns {number} - ohms */
  get resistenciaDC()   { return parseFloat(this.params.resistencia_dc) || 0; }
}
