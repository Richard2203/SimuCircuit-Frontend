import { Component } from '../Component';

/** @type {object} Parametros por defecto al crear una resistencia nueva. */
export const RESISTENCIA_DEFAULT_PARAMS = Object.freeze({
  banda_uno:        'Naranja',
  banda_dos:        'Naranja',
  banda_tres:       'Marrón',
  banda_tolerancia: 'Dorado',
  potencia_nominal: '0.25',
  isResistenciaVariable: 0,
});

export class Resistencia extends Component {
  constructor(args = {}) {
    super({ ...args, type: 'resistencia' });
    // Asegura que params tenga todos los campos esperados.
    this.params = { ...RESISTENCIA_DEFAULT_PARAMS, ...this.params };
  }

  // ── Getters tipados ─────────────────────────────────────────

  /** @returns {string} */
  get bandaUno()        { return this.params.banda_uno; }
  /** @returns {string} */
  get bandaDos()        { return this.params.banda_dos; }
  /** @returns {string} */
  get bandaTres()       { return this.params.banda_tres; }
  /** @returns {string} */
  get bandaTolerancia() { return this.params.banda_tolerancia; }

  /** @returns {number} - en watts */
  get potenciaNominal() { return parseFloat(this.params.potencia_nominal) || 0.25; }

  /** @returns {boolean} */
  get esVariable()      { return Boolean(this.params.isResistenciaVariable); }

  /**
   * Las cuatro bandas en orden, listas para renderizar el resistor.
   * @returns {{ uno: string, dos: string, tres: string, tolerancia: string }}
   */
  get bandas() {
    return {
      uno:        this.bandaUno,
      dos:        this.bandaDos,
      tres:       this.bandaTres,
      tolerancia: this.bandaTolerancia,
    };
  }
}
