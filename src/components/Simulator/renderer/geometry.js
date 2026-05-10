/**
 * Funciones puras de geometria del simulador:
 *   - Conversion de coordenadas de diseño -> SVG
 *   - Rotacion de puntos
 *   - Calculo de posiciones de pines por tipo de componente
 *   - Resolucion de alias de pin
 *   - Calculo del viewBox del SVG
 */

import { CANVAS_SCALE, OFFSET_X, OFFSET_Y, scaleFor } from './constants.js';

/* Conversion de coordenadas */

/**
 * Convierte una posicion de diseño {x, y} a coordenadas SVG.
 *
 * @param {{ x: number|string, y: number|string }} pos
 * @returns {{ x: number, y: number }}
 */
export function toSVG(pos) {
  return {
    x: parseFloat(pos?.x ?? 0) * CANVAS_SCALE + OFFSET_X,
    y: parseFloat(pos?.y ?? 0) * CANVAS_SCALE + OFFSET_Y,
  };
}

/**
 * Extrae el numero de nodo de un pinData que puede venir en formato
 * antiguo (string) o nuevo ({ nodo, x, y }).
 *
 * @param {string | { nodo: string }} pinData
 * @returns {string}
 */
export function getNodoNum(pinData) {
  if (pinData && typeof pinData === 'object') return String(pinData.nodo);
  return String(pinData);
}

/* Geometria */

/**
 * Rota el punto (cx + dx, cy + dy) alrededor de (cx, cy) un angulo rotDeg.
 *
 * @param {number} cx  Centro X
 * @param {number} cy  Centro Y
 * @param {number} dx  Desplazamiento local X (pre-rotacion)
 * @param {number} dy  Desplazamiento local Y (pre-rotacion)
 * @param {number} rotDeg  Angulo en grados
 * @returns {{ x: number, y: number }}
 */
export function rotPt(cx, cy, dx, dy, rotDeg) {
  const r = (rotDeg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
}

/* Pines por tipo */

/**
 * Calculo de posiciones SVG para todos los pines de un componente,
 * replicando con exactitud los offsets de cada modelo visual.
 *
 * Devuelve un mapa { aliasPin -> {x, y} } en coordenadas SVG.
 * La rotaciin se aplica como rotacion rigida alrededor del centro (cx, cy).
 *
 * @param {object} comp  Componente normalizado de la netlist
 * @returns {Record<string, {x: number, y: number}>}
 */
export function getPins(comp) {
  const cx  = parseFloat(comp.position?.x ?? 0) * CANVAS_SCALE + OFFSET_X;
  const cy  = parseFloat(comp.position?.y ?? 0) * CANVAS_SCALE + OFFSET_Y;
  const rot = comp.rotation ?? 0;
  const s   = scaleFor(comp.type);
  const t   = comp.type;

  // Resistencia
  if (t === 'resistencia') {
    const arm = 100 * s;
    const a = rotPt(cx, cy, -arm, 0, rot);
    const b = rotPt(cx, cy,  arm, 0, rot);
    return { n1: a, n2: b, a, b, 'pin 1': a, 'pin 2': b, pin1: a, pin2: b };
  }

  // Bobina
  if (t === 'bobina') {
    const pinSp   = 16 * s;
    const pinDist = (56 + 38) * s;
    const a = rotPt(cx, cy, -pinSp, pinDist, rot);
    const b = rotPt(cx, cy,  pinSp, pinDist, rot);
    return { n1: a, n2: b, a, b, 'pin 1': a, 'pin 2': b, pin1: a, pin2: b };
  }

  // Potenciometro
  if (t === 'resistencia_variable') {
    const sp = 14 * s;
    const dy = (28 + 38) * s;
    const pa = rotPt(cx, cy, -sp, dy, rot);
    const pw = rotPt(cx, cy,   0, dy, rot);
    const pb = rotPt(cx, cy,  sp, dy, rot);
    return {
      a: pa, w: pw, b: pb,
      n1: pa, n2: pw, n3: pb, wiper: pw,
      'pin 1': pa, 'pin 2': pw, 'pin 3': pb,
      pin1: pa, pin2: pw, pin3: pb,
      izquierda: pa, centro: pw, derecha: pb, izq: pa, der: pb,
    };
  }

  // Capacitor
  if (t === 'capacitor') {
    const tipoD      = (comp.params?.tipo_dioelectrico || '').toLowerCase();
    const esCeramico = tipoD.includes('ceram') || tipoD.includes('cerám');

    if (esCeramico) {
      const a = rotPt(cx, cy, 0, (-42.9 - 38) * s, rot);
      const b = rotPt(cx, cy, 0, ( 23.4 + 38) * s, rot);
      return { n1: a, n2: b, a, b, 'pin 1': a, 'pin 2': b, pin1: a, pin2: b };
    }

    // Electrolitico/tantalio: pines escalonados
    const isVertical = rot === 90 || rot === 270;
    const pinA = isVertical
      ? { x: cx - 24 * s, y: cy + 108 * s }
      : { x: cx - 108 * s, y: cy - 24 * s };
    const pinB = isVertical
      ? { x: cx + 23 * s, y: cy + 108 * s }
      : { x: cx + 108 * s, y: cy + 23 * s };
    return { n1: pinA, n2: pinB, a: pinA, b: pinB, 'pin 1': pinA, 'pin 2': pinB, pin1: pinA, pin2: pinB };
  }

  // Fuente de voltaje
  if (t === 'fuente_voltaje') {
    const esAC = (comp.params?.dcOrAc || '').toLowerCase() === 'ac';

    if (esAC) {
      const pinDist = (60 + 78) * s;
      const pos = rotPt(cx, cy,  pinDist, 0, rot);
      const neg = rotPt(cx, cy, -pinDist, 0, rot);
      return { pos, neg, a: pos, b: neg, positivo: pos, negativo: neg, vcc: pos, gnd: neg };
    }

    // DC PowerSource: pines a la derecha del cuerpo
    const pos = rotPt(cx, cy,  138.5, -34.16, rot);
    const neg = rotPt(cx, cy,  142.3,  23.60, rot);
    return { pos, neg, a: pos, b: neg, positivo: pos, negativo: neg, vcc: pos, gnd: neg };
  }

  // Fuente de corriente
  if (t === 'fuente_corriente') {
    const pos = rotPt(cx, cy, 0, -38, rot);
    const neg = rotPt(cx, cy, 0,  38, rot);
    return { pos, neg, a: pos, b: neg, positivo: pos, negativo: neg };
  }

  // Diodo (LED, rectificador, Zener...)
  if (t === 'diodo') {
    const esLED = (comp.params?.tipo || '').toLowerCase().startsWith('led');

    if (esLED) {
      // LED vertical: anodo izquierda, catodo derecha
      const a = rotPt(cx, cy, -15 * s, 95 * s, rot);
      const b = rotPt(cx, cy,  18 * s, 95 * s, rot);
      return { n1: a, n2: b, a, b, 'pin 1': a, 'pin 2': b, pin1: a, pin2: b, anodo: a, anode: a, catodo: b, cathode: b };
    }

    // Rectificador / Zener / Schottky: pines horizontales +-85*s
    const arm = 85 * s;
    const a = rotPt(cx, cy, -arm, 0, rot);
    const b = rotPt(cx, cy,  arm, 0, rot);
    return { n1: a, n2: b, a, b, 'pin 1': a, 'pin 2': b, pin1: a, pin2: b, anodo: a, anode: a, catodo: b, cathode: b };
  }

  // Transistor BJT / FET (paquete TO-92)
  //    Vista frontal: E — B — C  (izq -> der)
  if (t === 'transistor_bjt' || t === 'transistor_fet') {
    const dx = 15 * s, dy = 60 * s;
    const e = rotPt(cx, cy, -dx, dy, rot);
    const b = rotPt(cx, cy,   0, dy, rot);
    const c = rotPt(cx, cy,  dx, dy, rot);
    return {
      e, b, c,
      emisor: e, base: b, colector: c, emitter: e, collector: c,
      gate: b, drain: c, source: e,
      g: b, d: c, s: e,
      n1: e, n2: b, n3: c,
      'pin 1': e, 'pin 2': b, 'pin 3': c,
      pin1: e, pin2: b, pin3: c,
      nb: b, nc: c, ne: e, ng: b, nd: c, ns: e,
      nbase: b, ncolector: c, nemisor: e, ncollector: c, nemitter: e,
      ngate: b, ndrain: c, nsource: e,
    };
  }

  // Regulador de voltaje (paquete TO-220)
  //    Pinout estandar: Vin — GND — Vout  (izq -> der)
  if (t === 'regulador_voltaje') {
    const dx = 15 * s, dy = 60 * s;
    const inn = rotPt(cx, cy, -dx, dy, rot);
    const adj = rotPt(cx, cy,   0, dy, rot);
    const out = rotPt(cx, cy,  dx, dy, rot);
    return {
      in: inn, out, adj,
      nin: inn, nout: out, ngnd: adj, nadj: adj,
      entrada: inn, salida: out, tierra: adj, ref: adj,
      n1: inn, n2: adj, n3: out,
      'pin 1': inn, 'pin 2': adj, 'pin 3': out,
      pin1: inn, pin2: adj, pin3: out,
      vin: inn, vout: out,
    };
  }

  // Fallback
  return { n1: { x: cx, y: cy }, n2: { x: cx, y: cy } };
}

/* Resolucion de alias de pin */

/**
 * Resuelve el pin SVG correcto para una clave dada 
 *
 * @param {Record<string, {x:number, y:number}>} pins  Mapa de pines del componente
 * @param {string} pinKey  Clave del pin tal como aparece en la netlist
 * @returns {{ x: number, y: number } | null}
 */
export function resolvePin(pins, pinKey) {
  if (!pinKey) return null;
  const k       = String(pinKey).toLowerCase().trim();
  const compact = k.replace(/\s+/g, '');

  if (pins[k])       return pins[k];
  if (pins[compact]) return pins[compact];

  // "gnd" puede apuntar a adj (regulador) o neg (fuente)
  if (compact === 'gnd') {
    if (pins.adj) return pins.adj;
    if (pins.neg) return pins.neg;
  }

  const aliases = {
    pin1: 'n1', pin2: 'n2', pin3: 'n3',
    a: 'n1', b: 'n2',
    positivo: 'pos', negativo: 'neg', vcc: 'pos',
    izquierda: 'a', centro: 'w', derecha: 'b',
    izq: 'a', der: 'b', wiper: 'w',
    anodo: 'a', anode: 'a', catodo: 'b', cathode: 'b',
  };
  if (aliases[compact] && pins[aliases[compact]]) return pins[aliases[compact]];

  return Object.values(pins)[0] ?? null;
}

/* ViewBox */

/**
 * Calcula el viewBox SVG ajustado al contenido de la netlist con margenes.
 *
 * @param {object[]} netlist
 * @returns {string}
 */
export function calcViewBox(netlist) {
  if (!netlist?.length) return '0 0 600 400';

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  netlist.forEach((comp) => {
    const pins = getPins(comp);
    Object.values(pins).forEach(({ x, y }) => {
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    });
    const { x, y } = toSVG(comp.position);
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  });

  const margin = 100;
  const w = Math.max(maxX - minX + margin * 2, 400);
  const h = Math.max(maxY - minY + margin * 2, 300);
  return `${minX - margin} ${minY - margin} ${w} ${h}`;
}
