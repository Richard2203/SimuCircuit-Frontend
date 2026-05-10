/**
 * Calculo de bounding boxes de componentes y deteccion de colisiones
 * ortogonales. Usado por el sistema de enrutado de cables (wireRouting)
 * para evitar que los trazos atraviesen cuerpos de componentes.
 */ 

import { CANVAS_SCALE, OFFSET_X, OFFSET_Y, SCALE_DEFAULT, SCALE_POT, SCALE_TO220, SCALE_TO92, scaleFor } from './constants.js';
import { rotPt } from './geometry.js';

/* Bounding boxes */

/**
 * Devuelve el bounding box axis-aligned del cuerpo visual de un componente.
 * Se usa unicamente para anti-colision; no representa el area exacta del SVG.
 *
 * @param {object} comp
 * @returns {{ minX, maxX, minY, maxY, compId: string }}
 */
export function getComponentBBox(comp) {
  const cx  = parseFloat(comp.position?.x ?? 0) * CANVAS_SCALE + OFFSET_X;
  const cy  = parseFloat(comp.position?.y ?? 0) * CANVAS_SCALE + OFFSET_Y;
  const rot = comp.rotation ?? 0;
  const t   = comp.type;

  /** Rota las 4 esquinas de un rectangulo centrado y devuelve su AABB. */
  const rotatedBBox = (halfW, halfH) => {
    const corners = [
      rotPt(cx, cy, -halfW, -halfH, rot),
      rotPt(cx, cy,  halfW, -halfH, rot),
      rotPt(cx, cy,  halfW,  halfH, rot),
      rotPt(cx, cy, -halfW,  halfH, rot),
    ];
    return {
      minX: Math.min(...corners.map(c => c.x)),
      maxX: Math.max(...corners.map(c => c.x)),
      minY: Math.min(...corners.map(c => c.y)),
      maxY: Math.max(...corners.map(c => c.y)),
      compId: comp.id,
    };
  };

  if (t === 'resistencia') return rotatedBBox(25 * SCALE_DEFAULT, 9 * SCALE_DEFAULT);

  if (t === 'bobina') {
    const R = 56 * SCALE_DEFAULT;
    return rotatedBBox(R, R);
  }

  if (t === 'resistencia_variable') {
    const R = 28 * SCALE_POT;
    return rotatedBBox(R, R);
  }

  if (t === 'capacitor') {
    const tipoD      = (comp.params?.tipo_dioelectrico || '').toLowerCase();
    const esCeramico = tipoD.includes('ceram') || tipoD.includes('cerám');
    return esCeramico
      ? rotatedBBox(35 * SCALE_DEFAULT, 39 * SCALE_DEFAULT)
      : rotatedBBox(40 * SCALE_DEFAULT, 30 * SCALE_DEFAULT);
  }

  if (t === 'fuente_voltaje') {
    const esAC = (comp.params?.dcOrAc || '').toLowerCase() === 'ac';
    if (esAC) {
      const R = 60 * SCALE_DEFAULT;
      return rotatedBBox(R, R);
    }
    // PowerSource DC: cuerpo desplazado respecto a (cx, cy)
    const cxBody = cx + 51.3;
    const cyBody = cy + 4.4;
    const corners = [
      rotPt(cxBody, cyBody, -71.8, -33.6, rot),
      rotPt(cxBody, cyBody,  71.8, -33.6, rot),
      rotPt(cxBody, cyBody,  71.8,  33.6, rot),
      rotPt(cxBody, cyBody, -71.8,  33.6, rot),
    ];
    return {
      minX: Math.min(...corners.map(c => c.x)),
      maxX: Math.max(...corners.map(c => c.x)),
      minY: Math.min(...corners.map(c => c.y)),
      maxY: Math.max(...corners.map(c => c.y)),
      compId: comp.id,
    };
  }

  if (t === 'fuente_corriente') return rotatedBBox(25 * SCALE_DEFAULT, 25 * SCALE_DEFAULT);

  if (t === 'diodo' || t === 'diodo_zener') return rotatedBBox(60 * SCALE_DEFAULT, 25 * SCALE_DEFAULT);
  if (t === 'diodo_led')                    return rotatedBBox(30 * SCALE_DEFAULT, 50 * SCALE_DEFAULT);

  if (t === 'transistor_bjt' || t === 'transistor_fet') {
    const halfW = 22 * SCALE_TO92;
    const halfH = 65 * SCALE_TO92;
    const offY  = halfH - 22 * SCALE_TO92;
    const corners = [
      rotPt(cx, cy, -halfW, offY - halfH, rot),
      rotPt(cx, cy,  halfW, offY - halfH, rot),
      rotPt(cx, cy,  halfW, offY + halfH, rot),
      rotPt(cx, cy, -halfW, offY + halfH, rot),
    ];
    return {
      minX: Math.min(...corners.map(c => c.x)),
      maxX: Math.max(...corners.map(c => c.x)),
      minY: Math.min(...corners.map(c => c.y)),
      maxY: Math.max(...corners.map(c => c.y)),
      compId: comp.id,
    };
  }

  if (t === 'regulador_voltaje') {
    const halfW = 30 * SCALE_TO220;
    const halfH = 70 * SCALE_TO220;
    const offY  = halfH - 25 * SCALE_TO220;
    const corners = [
      rotPt(cx, cy, -halfW, offY - halfH, rot),
      rotPt(cx, cy,  halfW, offY - halfH, rot),
      rotPt(cx, cy,  halfW, offY + halfH, rot),
      rotPt(cx, cy, -halfW, offY + halfH, rot),
    ];
    return {
      minX: Math.min(...corners.map(c => c.x)),
      maxX: Math.max(...corners.map(c => c.x)),
      minY: Math.min(...corners.map(c => c.y)),
      maxY: Math.max(...corners.map(c => c.y)),
      compId: comp.id,
    };
  }

  // Fallback conservador
  return rotatedBBox(20 * SCALE_DEFAULT, 20 * SCALE_DEFAULT);
}

/* Deteccion de colisiones ortogonales */

/**
 * ¿Una linea horizontal en y=busY, de x1 a x2, atraviesa algun bbox
 * que NO este en excludeIds?
 *
 * @param {number} busY
 * @param {number} x1
 * @param {number} x2
 * @param {object[]} bboxes
 * @param {Set<string>} excludeIds
 * @returns {boolean}
 */
export function busHCollides(busY, x1, x2, bboxes, excludeIds = new Set()) {
  const xLo = Math.min(x1, x2);
  const xHi = Math.max(x1, x2);
  const M   = 1; // margen de tolerancia
  for (const b of bboxes) {
    if (excludeIds.has(b.compId))        continue;
    if (busY < b.minY + M || busY > b.maxY - M) continue;
    if (xHi  < b.minX     || xLo  > b.maxX)     continue;
    return true;
  }
  return false;
}

/**
 * ¿Una linea vertical en x=busX, de y1 a y2, atraviesa algun bbox
 * que NO este en excludeIds?
 *
 * @param {number} busX
 * @param {number} y1
 * @param {number} y2
 * @param {object[]} bboxes
 * @param {Set<string>} excludeIds
 * @returns {boolean}
 */
export function busVCollides(busX, y1, y2, bboxes, excludeIds = new Set()) {
  const yLo = Math.min(y1, y2);
  const yHi = Math.max(y1, y2);
  const M   = 1;
  for (const b of bboxes) {
    if (excludeIds.has(b.compId))        continue;
    if (busX < b.minX + M || busX > b.maxX - M) continue;
    if (yHi  < b.minY     || yLo  > b.maxY)     continue;
    return true;
  }
  return false;
}
