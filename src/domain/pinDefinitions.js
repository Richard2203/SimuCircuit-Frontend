export const TIPOS_COMPONENTE = Object.freeze([
  'resistencia',
  'resistencia_variable',
  'fuente_voltaje',
  'fuente_corriente',
  'capacitor',
  'bobina',
  'diodo',
  'transistor_bjt',
  'transistor_fet',
  'regulador_voltaje',
]);

/**
 * Pines canonicos por tipo de componente.
 * Cada entrada es { key, label }. key es el nombre que debe usarse
 *
 * @type {Readonly<Record<string, ReadonlyArray<{ key: string, label: string }>>>}
 */
export const CANONICAL_PINS = Object.freeze({
  resistencia: [
    { key: 'n1', label: 'Nodo A (terminal izquierdo)' },
    { key: 'n2', label: 'Nodo B (terminal derecho)' },
  ],
  resistencia_variable: [
    { key: 'n1', label: 'Nodo A (extremo izquierdo)' },
    { key: 'n2', label: 'Nodo W (cursor / wiper)' },
    { key: 'n3', label: 'Nodo B (extremo derecho)' },
  ],
  capacitor: [
    { key: 'n1', label: 'Nodo A (terminal +)' },
    { key: 'n2', label: 'Nodo B (terminal −)' },
  ],
  bobina: [
    { key: 'n1', label: 'Nodo A' },
    { key: 'n2', label: 'Nodo B' },
  ],
  fuente_voltaje: [
    { key: 'pos', label: 'Nodo + (positivo)' },
    { key: 'neg', label: 'Nodo − (negativo)' },
  ],
  fuente_corriente: [
    { key: 'pos', label: 'Nodo + (entrada de corriente)' },
    { key: 'neg', label: 'Nodo − (salida de corriente)' },
  ],
  diodo: [
    { key: 'n1', label: 'Ánodo (A)' },
    { key: 'n2', label: 'Cátodo (K)' },
  ],
  transistor_bjt: [
    { key: 'nB', label: 'Base (B)' },
    { key: 'nC', label: 'Colector (C)' },
    { key: 'nE', label: 'Emisor (E)' },
  ],
  transistor_fet: [
    { key: 'nG', label: 'Gate (G)' },
    { key: 'nD', label: 'Drain (D)' },
    { key: 'nS', label: 'Source (S)' },
  ],
  regulador_voltaje: [
    { key: 'nIn',  label: 'Vin (entrada)' },
    { key: 'nOut', label: 'Vout (salida)' },
    { key: 'nGnd', label: 'GND / ADJ (referencia)' },
  ],
});

/**
 * Mapa de aliases -> llave canonica, por tipo de componente.
 *
 * @type {Readonly<Record<string, Readonly<Record<string, string>>>>}
 */
export const LEGACY_PIN_ALIASES = Object.freeze({
  resistencia: Object.freeze({
    a: 'n1', b: 'n2',
    pin1: 'n1', pin2: 'n2',
    'pin 1': 'n1', 'pin 2': 'n2',
  }),
  resistencia_variable: Object.freeze({
    a: 'n1', w: 'n2', b: 'n3',
    izquierda: 'n1', centro: 'n2', derecha: 'n3',
    izq: 'n1', der: 'n3', wiper: 'n2',
    pin1: 'n1', pin2: 'n2', pin3: 'n3',
  }),
  capacitor: Object.freeze({
    a: 'n1', b: 'n2',
    pin1: 'n1', pin2: 'n2',
  }),
  bobina: Object.freeze({
    a: 'n1', b: 'n2',
    pin1: 'n1', pin2: 'n2',
  }),
  fuente_voltaje: Object.freeze({
    a: 'pos', b: 'neg',
    positivo: 'pos', negativo: 'neg',
    '+': 'pos', '-': 'neg',
  }),
  fuente_corriente: Object.freeze({
    a: 'pos', b: 'neg',
    positivo: 'pos', negativo: 'neg',
  }),
  diodo: Object.freeze({
    anodo: 'n1', catodo: 'n2',
    a: 'n1', k: 'n2', c: 'n2',
  }),
  transistor_bjt: Object.freeze({
    base: 'nB', colector: 'nC', emisor: 'nE',
    b: 'nB', c: 'nC', e: 'nE',
  }),
  transistor_fet: Object.freeze({
    gate: 'nG', drain: 'nD', source: 'nS',
    g: 'nG', d: 'nD', s: 'nS',
  }),
  regulador_voltaje: Object.freeze({
    vin: 'nIn', vout: 'nOut', ref: 'nGnd', gnd: 'nGnd', adj: 'nGnd',
    in: 'nIn', out: 'nOut',
  }),
});

/**
 * Etiqueta corta de cada pin canonico
 * @type {Readonly<Record<string, string>>}
 */
export const PIN_LABELS = Object.freeze({
  n1: 'A', n2: 'B', n3: 'C',
  pos: '+', neg: '−',
  nB: 'B', nC: 'C', nE: 'E',
  nG: 'G', nD: 'D', nS: 'S',
  nIn: 'IN', nOut: 'OUT', nGnd: 'GND',
});

/**
 * Prefijo de designador automatico por tipo (R1, V1, C1, …).
 * @type {Readonly<Record<string, string>>}
 */
export const PREFIJOS = Object.freeze({
  resistencia:          'R',
  resistencia_variable: 'RV',
  fuente_voltaje:       'V',
  fuente_corriente:     'I',
  capacitor:            'C',
  bobina:               'L',
  diodo:                'D',
  transistor_bjt:       'Q',
  transistor_fet:       'J',
  regulador_voltaje:    'U',
});

/**
 * Rangos de validación del campo value por tipo (en unidades SI).
 * @type {Readonly<Record<string, { min: number|null, max: number|null, unit: string }>>}
 */
export const RANGOS = Object.freeze({
  resistencia:          { min: 1,     max: 10_000_000, unit: 'Ω' },
  resistencia_variable: { min: 1,     max: 10_000_000, unit: 'Ω' },
  capacitor:            { min: 1e-12, max: 0.1,        unit: 'F' },
  bobina:               { min: 1e-9,  max: 100,        unit: 'H' },
  fuente_voltaje:       { min: 0.1,   max: 500,        unit: 'V' },
  fuente_corriente:     { min: 1e-6,  max: 50,         unit: 'A' },
  diodo:                { min: null,  max: null,       unit: ''  },
  transistor_bjt:       { min: null,  max: null,       unit: ''  },
  transistor_fet:       { min: null,  max: null,       unit: ''  },
  regulador_voltaje:    { min: null,  max: null,       unit: ''  },
});

/**
 * Unidades de texto validas en el campo value (en notacion SI).
 * @type {Readonly<Record<string, ReadonlyArray<string>>>}
 */
export const UNIDADES_VALIDAS = Object.freeze({
  resistencia:          Object.freeze(['Ω', 'OHM', 'OHMS']),
  resistencia_variable: Object.freeze(['Ω', 'OHM', 'OHMS']),
  capacitor:            Object.freeze(['F']),
  bobina:               Object.freeze(['H']),
  fuente_voltaje:       Object.freeze(['V']),
  fuente_corriente:     Object.freeze(['A']),
});

/**
 * Etiqueta humana corta del tipo 
 * @type {Readonly<Record<string, string>>}
 */
export const LABELS_TIPO = Object.freeze({
  resistencia:          'Resistencia',
  resistencia_variable: 'Resistencia var.',
  fuente_voltaje:       'Fuente V',
  fuente_corriente:     'Fuente I',
  capacitor:            'Capacitor',
  bobina:               'Bobina',
  diodo:                'Diodo',
  transistor_bjt:       'BJT',
  transistor_fet:       'FET',
  regulador_voltaje:    'Regulador',
});

/**
 * Resuelve cualquier alias de pin a su llave canonica para un tipo dado.
 
 * @param {string} tipo     - Tipo de componente: resistencia, diodo, ...
 * @param {string} pinKey   - Llave de pin tal y como llego
 * @returns {string}        - Llave canonica resultante.
 */
export function resolvePinKey(tipo, pinKey) {
  if (!pinKey) return pinKey;
  const aliases = LEGACY_PIN_ALIASES[tipo] ?? {};
  return aliases[pinKey] ?? pinKey;
}

/**
 * Etiqueta humana de un tipo de componente.
 * @param {string} tipo
 * @returns {string}
 */
export function labelForTipo(tipo) {
  return LABELS_TIPO[tipo] ?? tipo;
}

/**
 * Etiqueta corta de un pin canonico.
 * @param {string} pinKey
 * @returns {string}
 */
export function labelForPin(pinKey) {
  return PIN_LABELS[pinKey] ?? pinKey;
}
