import { Component } from '../Component';

export const FUENTE_CORRIENTE_DEFAULT_PARAMS = Object.freeze({
  activo:      1,
  voltaje_max: '30.00',
  dcOrAc:      'dc',
  phase:       '0.00',
  frequency:   '0.00',
});

/**
 * Normaliza el indicador AC/DC desde cualquier variante conocida
 *
 * @param {string} raw
 * @returns {'dc'|'ac'}
 */
function normalizarTipoSenal(raw) {
  if (!raw) return 'dc';
  const s = String(raw).toLowerCase();
  if (s.startsWith('ac')) return 'ac';
  if (s.startsWith('dc')) return 'dc';
  if (s.includes('senoid') || s.includes('alterna')) return 'ac';
  return 'dc';
}

export class FuenteCorriente extends Component {
  constructor(args = {}) {
    super({ ...args, type: 'fuente_corriente' });

    const incoming = this.params ?? {};

    const dcOrAc = 'dcOrAc' in incoming
      ? incoming.dcOrAc
      : ('tipo_senial' in incoming
          ? normalizarTipoSenal(incoming.tipo_senial)
          : undefined);

    const frequency = 'frequency' in incoming
      ? incoming.frequency
      : ('frecuencia' in incoming ? incoming.frecuencia : undefined);

    const phase = 'phase' in incoming
      ? incoming.phase
      : ('fase' in incoming ? incoming.fase : undefined);

    this.params = {
      ...FUENTE_CORRIENTE_DEFAULT_PARAMS,
      ...incoming,
      ...(dcOrAc    !== undefined ? { dcOrAc }    : {}),
      ...(frequency !== undefined ? { frequency } : {}),
      ...(phase     !== undefined ? { phase }     : {}),
    };
  }

  /** @returns {number} - amperes */
  get corriente()    { return parseFloat(this.value) || 0; }

  /** @returns {boolean} */
  get activa()       { return Boolean(this.params.activo); }

  /** @returns {number} - volts */
  get voltajeMax()   { return parseFloat(this.params.voltaje_max) || 0; }

  /** @returns {'dc'|'ac'} */
  get tipoSenal()    { return normalizarTipoSenal(this.params.dcOrAc); }

  /** @returns {boolean} */
  get esDC()         { return this.tipoSenal === 'dc'; }

  /** @returns {boolean} */
  get esAC()         { return this.tipoSenal === 'ac'; }

  /** @returns {number} - grados */
  get fase()         { return parseFloat(this.params.phase) || 0; }

  /** @returns {number} - hertz */
  get frecuencia()   { return parseFloat(this.params.frequency) || 0; }
}
