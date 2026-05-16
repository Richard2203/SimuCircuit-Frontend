import { CANVAS_SCALE, OFFSET_X, OFFSET_Y } from '../../Simulator/renderer/constants.js';

export const GRID_X = 50;
export const GRID_Y = 40;

const OCCUPANCY_TOLERANCE = 0.55;

/** Origen tipico para el primer componente. */
export const ORIGEN = Object.freeze({ x: 0, y: 130 });

/** Direcciones validas */
export const DIRECCIONES = Object.freeze({
  DERECHA:   'derecha',
  IZQUIERDA: 'izquierda',
  ABAJO:     'abajo',
  ARRIBA:    'arriba',
});

/** Rotaciones validas */
export const ROTACIONES = Object.freeze([0, 90, 180, 270]);

/* Conversion de coordenadas */
export function svgToDesign(svgX, svgY) {
  return {
    x: (svgX - OFFSET_X) / CANVAS_SCALE,
    y: (svgY - OFFSET_Y) / CANVAS_SCALE,
  };
}

export function designToSvg(designX, designY) {
  return {
    x: designX * CANVAS_SCALE + OFFSET_X,
    y: designY * CANVAS_SCALE + OFFSET_Y,
  };
}

export function nodosDe(comp) {
  if (!comp) return [];
  if (typeof comp.getNodos === 'function') return comp.getNodos();
  const map = comp.nodes ?? comp.nodos ?? {};
  return Object.values(map)
    .map((v) => (v && typeof v === 'object' ? v.nodo : v))
    .filter((v) => v != null && v !== '');
}

export function posicionDe(comp) {
  if (!comp || !comp.position) return null;
  const x = parseFloat(comp.position.x);
  const y = parseFloat(comp.position.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

/**
 * Devuelve { ancho, alto } APROXIMADO de un componente en CELDAS del grid,
 * considerando su tipo y rotacion. Usado para calcular cuantas celdas
 * "saltar" al colocar el siguiente componente en una direccion.
 */
function tamanioEnCeldas(comp) {
  const t = comp?.type;
  const rot = ((Number(comp?.rotation) || 0) % 180);
  const horizontal = rot === 0;

  let largoDU = 80;
  let anchoDU = 40;

  switch (t) {
    case 'resistencia':
    case 'bobina':
    case 'diodo':
      largoDU = 80; anchoDU = 35; break;
    case 'resistencia_variable':
      largoDU = 80; anchoDU = 60; break;
    case 'capacitor':
      largoDU = 80; anchoDU = 50; break;
    case 'fuente_voltaje':
      largoDU = 130; anchoDU = 100; break;
    case 'fuente_corriente':
      largoDU = 80;  anchoDU = 60; break;
    case 'transistor_bjt':
    case 'transistor_fet':
      largoDU = 80;  anchoDU = 60; break;
    case 'regulador_voltaje':
      largoDU = 80;  anchoDU = 70; break;
    default:
      largoDU = 60; anchoDU = 40;
  }

  const w = horizontal ? largoDU : anchoDU;
  const h = horizontal ? anchoDU : largoDU;
  return {
    ancho: Math.max(1, Math.ceil(w / GRID_X)),
    alto:  Math.max(1, Math.ceil(h / GRID_Y)),
  };
}

/* Logica del flujo en grid */

function celdaOcupada(col, row, existentes) {
  return existentes.some((c) => {
    const p = posicionDe(c);
    if (!p) return false;
    const cCol = p.x / GRID_X;
    const cRow = p.y / GRID_Y;
    return (
      Math.abs(cCol - col) < OCCUPANCY_TOLERANCE &&
      Math.abs(cRow - row) < OCCUPANCY_TOLERANCE
    );
  });
}

function deltaPara(direccion) {
  switch (direccion) {
    case DIRECCIONES.DERECHA:   return { dx: +1, dy:  0 };
    case DIRECCIONES.IZQUIERDA: return { dx: -1, dy:  0 };
    case DIRECCIONES.ABAJO:     return { dx:  0, dy: +1 };
    case DIRECCIONES.ARRIBA:    return { dx:  0, dy: -1 };
    default:                    return { dx: +1, dy:  0 };
  }
}

/**
 * Coloca un componente nuevo en la celda contigua al refComp considerando
 * los tamanos reales (en celdas) tanto del referencia como del nuevo.
 *
 * @param {any} refComp
 * @param {string} direccion
 * @param {Array} existentes
 * @param {any} [nuevoComp]
 * @returns {{ x: number, y: number }}
 */
export function colocarRelativoA(refComp, direccion, existentes, nuevoComp = null) {
  const refPos = posicionDe(refComp);
  if (!refPos) return { ...ORIGEN };

  const { dx, dy } = deltaPara(direccion);
  const refSize    = tamanioEnCeldas(refComp);
  const nuevoSize  = nuevoComp ? tamanioEnCeldas(nuevoComp) : { ancho: 1, alto: 1 };

  const saltoCol = dx !== 0
    ? Math.ceil(refSize.ancho / 2) + Math.ceil(nuevoSize.ancho / 2)
    : 0;
  const saltoRow = dy !== 0
    ? Math.ceil(refSize.alto / 2) + Math.ceil(nuevoSize.alto / 2)
    : 0;

  let col = refPos.x / GRID_X + dx * saltoCol;
  let row = refPos.y / GRID_Y + dy * saltoRow;

  for (let i = 0; i < 30; i++) {
    if (!celdaOcupada(col, row, existentes)) {
      return { x: col * GRID_X, y: row * GRID_Y };
    }
    col += dx;
    row += dy;
  }
  return { x: col * GRID_X, y: row * GRID_Y };
}

export function posicionDeOrigen() {
  return { ...ORIGEN };
}

export function rotacionSugerida(direccion) {
  return direccion === DIRECCIONES.ARRIBA || direccion === DIRECCIONES.ABAJO ? 90 : 0;
}

export function etiquetaDireccion(direccion) {
  switch (direccion) {
    case DIRECCIONES.DERECHA:   return '→ Derecha';
    case DIRECCIONES.IZQUIERDA: return '← Izquierda';
    case DIRECCIONES.ABAJO:     return '↓ Abajo';
    case DIRECCIONES.ARRIBA:    return '↑ Arriba';
    default: return direccion;
  }
}

/* Nudge */

export function nudgePos(comp, direccion) {
  const p = posicionDe(comp) ?? { ...ORIGEN };
  const { dx, dy } = deltaPara(direccion);
  return { x: p.x + dx * GRID_X, y: p.y + dy * GRID_Y };
}

/* Mutaciones inmutables */

export function componenteConPosicion(comp, newPos) {
  if (!comp || typeof comp.toJSON !== 'function') return comp;
  const Klass = comp.constructor;
  return new Klass({ ...comp.toJSON(), position: { x: newPos.x, y: newPos.y } });
}

export function componenteConRotacion(comp, newRot) {
  if (!comp || typeof comp.toJSON !== 'function') return comp;
  const Klass = comp.constructor;
  const rot = ((Number(newRot) || 0) % 360 + 360) % 360;
  return new Klass({ ...comp.toJSON(), rotation: rot });
}

/**
 * Avanza la rotacion 90 grados en sentido horario: 0 → 90 → 180 → 270 → 0.
 */
export function rotarComponente(comp) {
  const actual = Number(comp?.rotation) || 0;
  const next = (actual + 90) % 360;
  return componenteConRotacion(comp, next);
}

export function etiquetaRotacion(rot) {
  const r = ((Number(rot) || 0) % 360 + 360) % 360;
  switch (r) {
    case 0:   return '0° (→)';
    case 90:  return '90° (↓)';
    case 180: return '180° (←)';
    case 270: return '270° (↑)';
    default:  return `${r}°`;
  }
}