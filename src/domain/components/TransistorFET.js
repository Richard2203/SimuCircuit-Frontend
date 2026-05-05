import { Component } from '../Component';

export const FET_DEFAULT_PARAMS = Object.freeze({
  tipo:           'MOSFET_N',
  idss:           '0.200',
  vp:             '2.000',
  gm:             '0.320',
  rd:             '5.000',
  configuracion:  'Interruptor',
  modo_operacion: 'Conmutación Rápida',
});

export class TransistorFET extends Component {
  constructor(args = {}) {
    super({ ...args, type: 'transistor_fet' });
    this.params = { ...FET_DEFAULT_PARAMS, ...this.params };
  }

  /** @returns {'JFET_N'|'JFET_P'|'MOSFET_N'|'MOSFET_P'} */
  get subtipo() { return this.params.tipo; }

  /** @returns {boolean} */
  get esJFET()    { return /^jfet/i.test(this.subtipo ?? ''); }

  /** @returns {boolean} */
  get esMOSFET()  { return /^mosfet/i.test(this.subtipo ?? ''); }

  /** @returns {boolean} */
  get esCanalN()  { return /_n$/i.test(this.subtipo ?? ''); }

  /** @returns {boolean} */
  get esCanalP()  { return /_p$/i.test(this.subtipo ?? ''); }

  /** @returns {number} - corriente de saturacion a Vgs=0, amperes */
  get idss() { return parseFloat(this.params.idss) || 0; }

  /** @returns {number} - voltaje de pinch-off, volts */
  get vp()   { return parseFloat(this.params.vp) || 0; }

  /** @returns {number} - transconductancia, siemens */
  get gm()   { return parseFloat(this.params.gm) || 0; }

  /** @returns {number} - resistencia de drenaje, ohms */
  get rd()   { return parseFloat(this.params.rd) || 0; }

  /** @returns {string} */
  get configuracion()  { return this.params.configuracion; }

  /** @returns {string} */
  get modoOperacion()  { return this.params.modo_operacion; }
}
