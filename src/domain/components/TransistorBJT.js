import { Component } from '../Component';

export const BJT_DEFAULT_PARAMS = Object.freeze({
  tipo:                   'NPN',
  configuracion:          'Uso General',
  beta:                   '100',
  vbe_saturacion:         '0.600',
  vce_saturacion:         '0.300',
  corriente_colector_max: '0.800',
  potencia_maxima:        '0.500',
  frecuencia_transicion:  '300',
  modo_operacion:         'Amplificador/Interruptor',
});

export class TransistorBJT extends Component {
  constructor(args = {}) {
    super({ ...args, type: 'transistor_bjt' });
    this.params = { ...BJT_DEFAULT_PARAMS, ...this.params };
  }

  /** @returns {'NPN'|'PNP'} */
  get polaridad() {
    return (this.params.tipo ?? 'NPN').toUpperCase() === 'PNP' ? 'PNP' : 'NPN';
  }

  /** @returns {boolean} */
  get esNPN() { return this.polaridad === 'NPN'; }

  /** @returns {boolean} */
  get esPNP() { return this.polaridad === 'PNP'; }

  /** @returns {string} */
  get configuracion()       { return this.params.configuracion; }

  /** @returns {number} */
  get beta()                { return parseFloat(this.params.beta) || 0; }

  /** @returns {number} - volts */
  get vbeSaturacion()       { return parseFloat(this.params.vbe_saturacion) || 0; }

  /** @returns {number} - volts */
  get vceSaturacion()       { return parseFloat(this.params.vce_saturacion) || 0; }

  /** @returns {number} - amperes */
  get corrienteColectorMax(){ return parseFloat(this.params.corriente_colector_max) || 0; }

  /** @returns {number} - watts */
  get potenciaMaxima()      { return parseFloat(this.params.potencia_maxima) || 0; }

  /** @returns {number} - megahertz */
  get frecuenciaTransicion(){ return parseFloat(this.params.frecuencia_transicion) || 0; }

  /** @returns {string} */
  get modoOperacion()       { return this.params.modo_operacion; }
}
