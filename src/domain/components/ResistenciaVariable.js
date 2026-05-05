import { Component } from '../Component';

export const RESISTENCIA_VARIABLE_DEFAULT_PARAMS = Object.freeze({
  banda_uno:        'Marrón',
  banda_dos:        'Negro',
  banda_tres:       'Rojo',
  banda_tolerancia: 'Dorado',
  potencia_nominal: '0.25',
  isResistenciaVariable: 1,
  cursor_pos: 50,
});

export class ResistenciaVariable extends Component {
  constructor(args = {}) {
    super({ ...args, type: 'resistencia_variable' });
    this.params = { ...RESISTENCIA_VARIABLE_DEFAULT_PARAMS, ...this.params };
  }

  /** @returns {string} */
  get bandaUno()        { return this.params.banda_uno; }
  /** @returns {string} */
  get bandaDos()        { return this.params.banda_dos; }
  /** @returns {string} */
  get bandaTres()       { return this.params.banda_tres; }
  /** @returns {string} */
  get bandaTolerancia() { return this.params.banda_tolerancia; }
  /** @returns {number} */
  get potenciaNominal() { return parseFloat(this.params.potencia_nominal) || 0.25; }

  /**
   * Posicion del cursor en porcentaje (0–100).
   * @returns {number}
   */
  get cursorPos() {
    const v = Number(this.params.cursor_pos);
    if (Number.isNaN(v)) return 50;
    return Math.max(0, Math.min(100, v));
  }

  /**
   * Identificador para los modelos visuales (siempre `true` en esta clase).
   * @returns {true}
   */
  get esVariable() { return true; }
}
