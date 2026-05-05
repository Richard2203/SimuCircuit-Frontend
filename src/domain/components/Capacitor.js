import { Component } from '../Component';

export const CAPACITOR_DEFAULT_PARAMS = Object.freeze({
  tipo_dioelectrico: 'Cerámico',
  voltaje:           '50.00',
  polaridad:         0,
});

export class Capacitor extends Component {
  constructor(args = {}) {
    super({ ...args, type: 'capacitor' });
    this.params = { ...CAPACITOR_DEFAULT_PARAMS, ...this.params };
  }

  /** @returns {string} */
  get tipoDielectrico() { return this.params.tipo_dioelectrico; }

  /** @returns {number} - voltaje nominal en volts */
  get voltajeNominal()  { return parseFloat(this.params.voltaje) || 0; }

  /** @returns {boolean} */
  get esPolarizado()    { return Boolean(this.params.polaridad); }

  /** @returns {boolean} */
  get esCeramico() {
    const t = (this.tipoDielectrico ?? '').toLowerCase();
    return t.includes('ceram') || t.includes('cerám');
  }

  /** @returns {boolean} */
  get esElectrolitico() {
    return (this.tipoDielectrico ?? '').toLowerCase().includes('electrol');
  }

  /** @returns {boolean} */
  get esTantalio() {
    return (this.tipoDielectrico ?? '').toLowerCase().includes('tantal');
  }
}
