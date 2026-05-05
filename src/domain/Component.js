import {
  CANONICAL_PINS,
  resolvePinKey,
  PREFIJOS,
} from './pinDefinitions';

export class Component {
  /**
   * @param {object} args
   * @param {string} args.id            - Designador unico en el circuito 
   * @param {string} args.type          - Tipo: resistencia, diodo, ...
   * @param {string|number} args.value  - Valor (cadena con unidad SI o nombre comercial).
   * @param {{ x: number|string, y: number|string }} [args.position]
   * @param {number} [args.rotation=0]  - Rotacion visual en grados (0/90/180/270).
   * @param {Record<string, { nodo: string|number, x?: number, y?: number }>} [args.nodes]
   * @param {object} [args.params]      - Parametros especificos del tipo.
   */
  constructor({ id, type, value, position = { x: 0, y: 0 }, rotation = 0, nodes = {}, params = {} } = {}) {
    /** @type {string} */
    this.id = id;
    /** @type {string} */
    this.type = type;
    /** @type {string} */
    this.value = value != null ? String(value) : '';
    /** @type {{ x: number, y: number }} */
    this.position = {
      x: parseFloat(position?.x ?? 0) || 0,
      y: parseFloat(position?.y ?? 0) || 0,
    };
    /** @type {number} */
    this.rotation = Number(rotation) || 0;
    /**
     * Mapa de pines canonicos -> nodo 
     * @type {Record<string, { nodo: string, x: number|null, y: number|null }>}
     */
    this.nodes = {};
    Object.entries(nodes ?? {}).forEach(([pinKey, pinData]) => {
      const canonicalKey = resolvePinKey(type, pinKey);
      const data = pinData && typeof pinData === 'object'
        ? pinData
        : { nodo: pinData };
      this.nodes[canonicalKey] = {
        nodo: data.nodo != null ? String(data.nodo) : '',
        x:    data.x != null ? Number(data.x) : null,
        y:    data.y != null ? Number(data.y) : null,
      };
    });
    /** @type {object} */
    this.params = { ...(params ?? {}) };
  }

  // --- Acceso a pines / nodos --------------------------------------------

  /**
   * Devuelve el numero de nodo conectado a un pin
   * @param {string} pinKey
   * @returns {string|null}
   */
  getNodo(pinKey) {
    const key = resolvePinKey(this.type, pinKey);
    return this.nodes[key]?.nodo ?? null;
  }

  /**
   * Devuelve la lista de numeros de nodo conectados a este componente,
   * en el orden canonico de pines.
   * @returns {string[]}
   */
  getNodos() {
    const def = CANONICAL_PINS[this.type] ?? [];
    return def.map((p) => this.nodes[p.key]?.nodo).filter(Boolean);
  }

  /**
   * Conjunto de pines canonicos definidos para este tipo.
   * @returns {ReadonlyArray<{ key: string, label: string }>}
   */
  getPinDefinitions() {
    return CANONICAL_PINS[this.type] ?? [];
  }

  // --- Mutadores no-destructivos ------------------------------------------

  /**
   * Devuelve una copia con value reemplazado.
   * @param {string|number} newValue
   * @returns {Component}
   */
  withValue(newValue) {
    return new this.constructor({ ...this.toJSON(), value: newValue });
  }

  /**
   * Copia profunda del componente.
   * @returns {Component}
   */
  clone() {
    return new this.constructor(JSON.parse(JSON.stringify(this.toJSON())));
  }

  // --- Serialización -------------------------------------------------------

  /**
   * Forma generica que coincide con la del backend.
   * @returns {object}
   */
  toJSON() {
    return {
      id:       this.id,
      type:     this.type,
      value:    this.value,
      position: { x: this.position.x, y: this.position.y },
      rotation: this.rotation,
      nodes:    Object.fromEntries(
        Object.entries(this.nodes).map(([k, v]) => [k, { ...v }])
      ),
      params:   { ...this.params },
    };
  }

  /**
   * Formato que espera el backend
   * @returns {object}
   */
  toBackendJSON() {
    return this.toJSON();
  }

  /**
   * Formato que usa el constructor del panel admin.
   *
   * @returns {object}
   */
  toAdminJSON() {
    const adminPins = ADMIN_PIN_NAMES[this.type] ?? {};
    const nodosOut = {};
    Object.entries(this.nodes).forEach(([canonicalKey, pinData]) => {
      const adminKey = adminPins[canonicalKey] ?? canonicalKey;
      nodosOut[adminKey] = pinData.nodo;
    });
    return {
      id:       this.id,
      type:     this.type,
      value:    this.value,
      rotation: this.rotation,
      nodos:    nodosOut,
      params:   { ...this.params },
    };
  }

  // --- Validación / utilidades --------------------------------------------

  /**
   * Indica si todos los pines requeridos tienen nodo asignado.
   * @returns {boolean}
   */
  isFullyConnected() {
    const def = CANONICAL_PINS[this.type] ?? [];
    return def.every((p) => {
      const n = this.nodes[p.key]?.nodo;
      return n != null && String(n).trim() !== '';
    });
  }

  /**
   * Genera un designador automatico del tipo R1, V2, ... sin colisiones.
   * @param {string} tipo
   * @param {Iterable<{ id: string }>} existentes
   * @returns {string}
   */
  static generarId(tipo, existentes = []) {
    const pref = PREFIJOS[tipo] ?? 'X';
    const ids = new Set(Array.from(existentes, (c) => c.id));
    let n = 1;
    while (ids.has(`${pref}${n}`)) n++;
    return `${pref}${n}`;
  }

  // --- Factories ----------------------------------------------------------

  /**
   * Construye un Component (generico) desde el JSON del backend.
   * @param {object} raw
   * @returns {Component}
   */
  static fromBackend(raw) {
    return new Component({
      id:       raw.id,
      type:     raw.type,
      value:    raw.value,
      position: raw.position,
      rotation: raw.rotation,
      nodes:    raw.nodes,
      params:   raw.params,
    });
  }

  /**
   * Construye un Component desde el JSON del panel admin 
   * @param {object} raw
   * @returns {Component}
   */
  static fromAdmin(raw) {
    return new Component({
      id:       raw.id,
      type:     raw.type,
      value:    raw.value,
      position: raw.position ?? { x: 0, y: 0 },
      rotation: raw.rotation,
      nodes:    raw.nodos ?? raw.nodes ?? {},   // tolera ambos
      params:   raw.params,
    });
  }
}

/**
 * Mapa inverso para serializar a toAdminJSON.
 *
 * @type {Readonly<Record<string, Readonly<Record<string, string>>>>}
 */
const ADMIN_PIN_NAMES = Object.freeze({
  resistencia:          Object.freeze({ n1: 'a', n2: 'b' }),
  resistencia_variable: Object.freeze({ n1: 'a', n2: 'w', n3: 'b' }),
  capacitor:            Object.freeze({ n1: 'a', n2: 'b' }),
  bobina:               Object.freeze({ n1: 'a', n2: 'b' }),
  fuente_voltaje:       Object.freeze({ pos: 'a', neg: 'b' }),
  fuente_corriente:     Object.freeze({ pos: 'a', neg: 'b' }),
  diodo:                Object.freeze({ n1: 'anodo', n2: 'catodo' }),
  transistor_bjt:       Object.freeze({ nB: 'base', nC: 'colector', nE: 'emisor' }),
  transistor_fet:       Object.freeze({ nG: 'gate', nD: 'drain', nS: 'source' }),
  regulador_voltaje:    Object.freeze({ nIn: 'vin', nOut: 'vout', nGnd: 'ref' }),
});
