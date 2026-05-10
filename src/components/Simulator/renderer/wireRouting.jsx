/**
 * Sistema de enrutado ortogonal de cables del simulador.
 *
 * Algoritmo (por nodo electrico):
 *   • 2 pines -> L-shape; si ambos codos colisionan -> Z-shape desviado
 *   • 3+ pines -> peine ortogonal: barra H a Y modal/mediana + stubs V
 *   • GND -> riel inferior por debajo de los bboxes del rango X
 *
 * Solo genera segmentos H/V; nunca diagonales.
 */

import { getPins, resolvePin, getNodoNum } from './geometry.js';
import { getComponentBBox, busHCollides, busVCollides } from './collision.js';

/* Construccion de caminos ortogonales */

/**
 * Construye una L-shape (o Z-shape si hay colision) entre dos puntos.
 * Devuelve un array de segmentos { x1, y1, x2, y2 }.
 *
 * @param {{ x, y }} p1
 * @param {{ x, y }} p2
 * @param {object[]} bboxes
 * @param {Set<string>} excludeIds
 * @returns {{ x1, y1, x2, y2 }[]}
 */
function buildLPath(p1, p2, bboxes, excludeIds) {
  const dx = Math.abs(p2.x - p1.x);
  const dy = Math.abs(p2.y - p1.y);

  if (dx < 1.5) return [{ x1: p1.x, y1: p1.y, x2: p1.x, y2: p2.y }];
  if (dy < 1.5) return [{ x1: p1.x, y1: p1.y, x2: p2.x, y2: p1.y }];

  // Opcion A: vertical primero -> codo en (p1.x, p2.y)
  const optA = [
    { x1: p1.x, y1: p1.y, x2: p1.x, y2: p2.y },
    { x1: p1.x, y1: p2.y, x2: p2.x, y2: p2.y },
  ];
  // Opcion B: horizontal primero -> codo en (p2.x, p1.y)
  const optB = [
    { x1: p1.x, y1: p1.y, x2: p2.x, y2: p1.y },
    { x1: p2.x, y1: p1.y, x2: p2.x, y2: p2.y },
  ];

  const collidesA =
    busVCollides(p1.x, p1.y, p2.y, bboxes, excludeIds) ||
    busHCollides(p2.y, p1.x, p2.x, bboxes, excludeIds);
  const collidesB =
    busHCollides(p1.y, p1.x, p2.x, bboxes, excludeIds) ||
    busVCollides(p2.x, p1.y, p2.y, bboxes, excludeIds);

  if (!collidesA) return optA;
  if (!collidesB) return optB;

  // Ambas opciones colisionan: Z-shape sacando el codo intermedio fuera
  const candidates = [(p1.y + p2.y) / 2];
  bboxes.forEach(b => {
    candidates.push(b.minY - 16, b.maxY + 16);
  });

  for (const yMid of candidates) {
    const ok =
      !busVCollides(p1.x, p1.y, yMid, bboxes, excludeIds) &&
      !busHCollides(yMid, p1.x, p2.x, bboxes, excludeIds) &&
      !busVCollides(p2.x, yMid, p2.y, bboxes, excludeIds);
    if (ok) {
      return [
        { x1: p1.x, y1: p1.y, x2: p1.x, y2: yMid },
        { x1: p1.x, y1: yMid, x2: p2.x, y2: yMid },
        { x1: p2.x, y1: yMid, x2: p2.x, y2: p2.y },
      ];
    }
  }

  return optA; // ultimo recurso
}

/* Componente WireLayer */

/**
 * Dibuja todos los cables ortogonales que conectan los pines de la netlist.
 *
 * @param {{ netlist: object[] }} props
 */
export function WireLayer({ netlist }) {
  // 1. Recolectar pines por nodo electrico y bboxes de todos los componentes
  const nodeMap   = new Map();
  const allBBoxes = [];

  netlist.forEach((comp) => {
    const pins = getPins(comp);
    Object.entries(comp.nodes ?? {}).forEach(([pinKey, pinData]) => {
      const nodoNum = getNodoNum(pinData);
      if (!nodoNum) return;
      const pinPos = resolvePin(pins, pinKey);
      if (!pinPos) return;
      if (!nodeMap.has(nodoNum)) nodeMap.set(nodoNum, []);
      nodeMap.get(nodoNum).push({ ...pinPos, compId: comp.id, pinKey });
    });
    allBBoxes.push(getComponentBBox(comp));
  });

  const lines = [];
  const dots  = [];

  // 2. Por cada nodo, construir los segmentos de cable
  nodeMap.forEach((pins, nodo) => {
    if (pins.length < 2) return;

    const isGnd   = nodo === '0';
    const color   = isGnd ? '#64748b' : '#cbd5e1';
    const dash    = isGnd ? '5 4'     : undefined;
    const width   = isGnd ? 1.5       : 2;
    const opacity = isGnd ? 0.7       : 0.95;

    const ownCompIds = new Set(pins.map(p => p.compId));
    const xs = pins.map(p => p.x);
    const ys = pins.map(p => p.y);

    // 2 pines no-GND: L-shape
    if (pins.length === 2 && !isGnd) {
      buildLPath(pins[0], pins[1], allBBoxes, ownCompIds).forEach((seg, i) => {
        lines.push(
          <line key={`n${nodo}-seg-${i}`}
            x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
            stroke={color} strokeWidth={width}
            strokeLinecap="round" strokeDasharray={dash} opacity={opacity}
          />
        );
      });
      return;
    }

    const xRange = Math.max(...xs) - Math.min(...xs);
    const yRange = Math.max(...ys) - Math.min(...ys);

    // Barra vertical (todos los pines comparten X)
    if (xRange < 4 && yRange > 4) {
      lines.push(
        <line key={`n${nodo}-vbar`}
          x1={pins[0].x} y1={Math.min(...ys)} x2={pins[0].x} y2={Math.max(...ys)}
          stroke={color} strokeWidth={width}
          strokeLinecap="round" strokeDasharray={dash} opacity={opacity}
        />
      );
      return;
    }

    // Barra horizontal (todos los pines comparten Y)
    if (yRange < 4 && xRange > 4) {
      lines.push(
        <line key={`n${nodo}-hbar`}
          x1={Math.min(...xs)} y1={pins[0].y} x2={Math.max(...xs)} y2={pins[0].y}
          stroke={color} strokeWidth={width}
          strokeLinecap="round" strokeDasharray={dash} opacity={opacity}
        />
      );
      return;
    }

    // Caso general (3+ pines): peine ortogonal
    const xmin = Math.min(...xs);
    const xmax = Math.max(...xs);

    let busY;

    if (isGnd) {
      // GND: riel por debajo de todos los cuerpos en el rango X
      let yMaxBody = Math.max(...ys);
      allBBoxes.forEach(b => {
        if (xmax < b.minX || xmin > b.maxX) return;
        if (b.maxY > yMaxBody) yMaxBody = b.maxY;
      });
      busY = yMaxBody + 28;
    } else {
      // Y modal entre los pines (>=2 coincidencias) o mediana
      const yCount = new Map();
      pins.forEach(p => {
        const k = Math.round(p.y);
        yCount.set(k, (yCount.get(k) || 0) + 1);
      });
      let modalY = pins[0].y, modalCount = 0;
      yCount.forEach((cnt, yk) => {
        if (cnt > modalCount) { modalCount = cnt; modalY = yk; }
      });
      busY = modalCount >= 2
        ? modalY
        : [...ys].sort((a, b) => a - b)[Math.floor(ys.length / 2)];
    }

    // Anti-colision: mover el riel si atraviesa algun cuerpo ajeno
    if (!isGnd && busHCollides(busY, xmin, xmax, allBBoxes, ownCompIds)) {
      const CLEARANCE = 24;
      let bestY = null;

      // A: si el rango vertical es grande, ir por encima del pin mas alto
      if (yRange >= 80) {
        const candidate = Math.min(...ys) - CLEARANCE;
        if (!busHCollides(candidate, xmin, xmax, allBBoxes, ownCompIds)) bestY = candidate;
      }

      // B: justo por encima del bbox mas cercano
      if (bestY === null) {
        let topMost = Infinity;
        allBBoxes.forEach(b => {
          if (ownCompIds.has(b.compId) || xmax < b.minX || xmin > b.maxX) return;
          if (b.minY < topMost) topMost = b.minY;
        });
        if (topMost !== Infinity) {
          const candidate = topMost - CLEARANCE;
          if (!busHCollides(candidate, xmin, xmax, allBBoxes, ownCompIds)) bestY = candidate;
        }
      }

      // C: por debajo de todo
      if (bestY === null) {
        let bottomMost = -Infinity;
        allBBoxes.forEach(b => {
          if (ownCompIds.has(b.compId) || xmax < b.minX || xmin > b.maxX) return;
          if (b.maxY > bottomMost) bottomMost = b.maxY;
        });
        if (bottomMost !== -Infinity) {
          const candidate = bottomMost + CLEARANCE;
          if (!busHCollides(candidate, xmin, xmax, allBBoxes, ownCompIds)) bestY = candidate;
        }
      }

      if (bestY !== null) busY = bestY;
    }

    // Riel horizontal
    lines.push(
      <line key={`n${nodo}-bus`}
        x1={xmin} y1={busY} x2={xmax} y2={busY}
        stroke={color} strokeWidth={width}
        strokeLinecap="round" strokeDasharray={dash} opacity={opacity}
      />
    );

    // Stubs verticales pin -> riel
    pins.forEach((p, i) => {
      if (Math.abs(p.y - busY) < 1.5) return;
      lines.push(
        <line key={`n${nodo}-stub-${i}`}
          x1={p.x} y1={p.y} x2={p.x} y2={busY}
          stroke={color} strokeWidth={width}
          strokeLinecap="round" strokeDasharray={dash} opacity={opacity}
        />
      );
    });

    // Puntos de union cuando 3+ pines convergen
    if (!isGnd && pins.length >= 3) {
      pins.forEach((p, i) => {
        if (Math.abs(p.y - busY) > 1.5) {
          dots.push({ x: p.x, y: busY, key: `n${nodo}-dot-${i}` });
        }
      });
    }
  });

  return (
    <g className="wires">
      {lines}
      {dots.map(d => (
        <circle key={d.key} cx={d.x} cy={d.y} r={3} fill="#cbd5e1" opacity={0.9} />
      ))}
    </g>
  );
}
