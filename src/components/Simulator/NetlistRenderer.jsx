import { Resistor }          from './models/resistor.jsx';
import { Capacitor }         from './models/capacitor.jsx';
import { PowerSource }       from './models/PowerSource.jsx';
import { DiodoRectificador } from './models/DiodoRectificador.jsx';
import { Transistor }        from './models/Transistor.jsx';
import { parseNotation }     from './models/ComponentValueLabel.jsx';
import { Potentiometer }     from './models/Potentiometer.jsx';
import { CurrentSource }     from './models/CurrentSource.jsx';

const CANVAS_SCALE = 1.8;
const OFFSET_X     = 60;
const OFFSET_Y     = 60;

const SCALE_DEFAULT = 0.38;
const SCALE_POT     = 1.10;

function scaleFor(type) {
  if (type === 'resistencia_variable') return SCALE_POT;
  return SCALE_DEFAULT;
}

function toSVG(pos) {
  return {
    x: (parseFloat(pos?.x ?? 0)) * CANVAS_SCALE + OFFSET_X,
    y: (parseFloat(pos?.y ?? 0)) * CANVAS_SCALE + OFFSET_Y,
  };
}

/** Extrae el numero de nodo tanto del formato viejo (string) como nuevo ({nodo,x,y}) */
function getNodoNum(pinData) {
  if (pinData && typeof pinData === 'object') return String(pinData.nodo);
  return String(pinData);
}

// ─────────────────────────────────────────────────────────────────────────────
// Calculo de pines en SVG, replicando los offsets exactos de cada modelo.
// Cada componente devuelve un mapa { pinKey -> {x,y} } en coordenadas SVG.
// rotation se aplica como rotacion rigida alrededor del centro (cx, cy).
// ─────────────────────────────────────────────────────────────────────────────

function rotPt(cx, cy, dx, dy, rotDeg) {
  const r = (rotDeg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
}

/**
 * Pines de cada componente en SVG, alineados con el modelo visual real.
 * Devuelve TODOS los alias posibles para que el matcher de pines funcione
 * sin importar la convencion de nombres ("n1"/"a"/"pin1", "pos"/"a", etc.).
 */
function getPins(comp) {
  const cx = parseFloat(comp.position?.x ?? 0) * CANVAS_SCALE + OFFSET_X;
  const cy = parseFloat(comp.position?.y ?? 0) * CANVAS_SCALE + OFFSET_Y;
  const rot = comp.rotation ?? 0;
  const s   = scaleFor(comp.type); // mismo scale que renderComponent

  const t = comp.type;

  if (t === 'resistencia' || t === 'bobina') {
    // Resistor horizontal por defecto: pines a ±100*s = ±38px
    const arm = 100 * s;
    const a = rotPt(cx, cy, -arm, 0, rot);
    const b = rotPt(cx, cy,  arm, 0, rot);
    return {
      n1: a, n2: b,
      a: a, b: b,
      'pin 1': a, 'pin 2': b, pin1: a, pin2: b,
    };
  }

  if (t === 'resistencia_variable') {
    // pinA (izq):    (-14 * scale, +(R + pinLen) * scale) = (-5.32, +25.08)
    // pinW (centro): (    0,        +25.08)
    // pinB (der):    (+5.32,        +25.08)
    // Con scale=0.38, R=28, pinLen=38.
    const sp = 14 * s; // pin spacing
    const dy = (28 + 38) * s; // body radius + pin length, hacia abajo (en local +y)
    const pa = rotPt(cx, cy, -sp, dy, rot);
    const pw = rotPt(cx, cy,   0, dy, rot);
    const pb = rotPt(cx, cy,  sp, dy, rot);
    return {
      a: pa, w: pw, b: pb,
      // Aliases para tolerar distintos nombres en el campo pin_terminal
      n1: pa, n3: pb, wiper: pw,
      'pin 1': pa, 'pin 2': pw, 'pin 3': pb,
      pin1: pa, pin2: pw, pin3: pb,
      izquierda: pa, centro: pw, derecha: pb,
      izq: pa, der: pb,
    };
  }

  if (t === 'capacitor') {
    const orientation = (rot === 90 || rot === 270) ? 'vertical' : 'horizontal';
    let pinA, pinB;
    if (orientation === 'horizontal') {
      pinA = { x: cx - 108 * s, y: cy - 24 * s };
      pinB = { x: cx + 108 * s, y: cy + 23 * s };
    } else {
      pinA = { x: cx - 24 * s, y: cy + 108 * s };
      pinB = { x: cx + 23 * s, y: cy + 108 * s };
    }
    return { n1: pinA, n2: pinB, a: pinA, b: pinB };
  }

  if (t === 'fuente_voltaje') {
    // PowerSource se renderiza con (x-80, y-60) y scale=0.38.
    // Pines del modelo (en local, antes del offset): pinA=(575*s, 68*s), pinB=(585*s, 220*s).
    // Tras el offset (-80, -60): pinA=(cx+138.5, cy-34.16), pinB=(cx+142.3, cy+23.6).
    const pos = rotPt(cx, cy,  138.5, -34.16, rot);
    const neg = rotPt(cx, cy,  142.3,  23.60, rot);
    return {
      pos, neg,
      a: pos, b: neg,
      positivo: pos, negativo: neg, vcc: pos, gnd: neg,
    };
  }

  if (t === 'fuente_corriente') {
    // CurrentSource: pos arriba, neg abajo a ±38px.
    const pos = rotPt(cx, cy, 0, -38, rot);
    const neg = rotPt(cx, cy, 0,  38, rot);
    return {
      pos, neg,
      a: pos, b: neg,
      positivo: pos, negativo: neg,
    };
  }

  // diodo, transistores: fallback al centro
  return { n1: { x: cx, y: cy }, n2: { x: cx, y: cy } };
}

/**
 * Resuelve el pin SVG correcto para una clave dada, tolerante a variaciones
 * ("Pin 1" → "pin1" → "n1"), espacios y mayusculas.
 */
function resolvePin(pins, pinKey) {
  if (!pinKey) return null;
  const k = String(pinKey).toLowerCase().trim();
  if (pins[k]) return pins[k];
  const compact = k.replace(/\s+/g, '');
  if (pins[compact]) return pins[compact];
  const aliases = {
    pin1: 'n1', pin2: 'n2', pin3: 'n3',
    a: 'n1', b: 'n2',
    positivo: 'pos', negativo: 'neg',
    vcc: 'pos', gnd: 'neg',
    izquierda: 'a', centro: 'w', derecha: 'b',
    izq: 'a', der: 'b', wiper: 'w',
  };
  if (aliases[compact] && pins[aliases[compact]]) return pins[aliases[compact]];
  const first = Object.values(pins)[0];
  return first || null;
}

function calcViewBox(netlist) {
  if (!netlist || netlist.length === 0) return '0 0 600 400';
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  netlist.forEach((comp) => {
    const pins = getPins(comp);
    Object.values(pins).forEach((p) => {
      if (!p) return;
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
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

// Calculo de bounding boxes de componentes para evitar que los rieles
// horizontales atraviesen cuerpos. Se calcula una sola vez por render.
// Cada bbox es {minX, maxX, minY, maxY, compId}.
function getComponentBBox(comp) {
  const cx = parseFloat(comp.position?.x ?? 0) * CANVAS_SCALE + OFFSET_X;
  const cy = parseFloat(comp.position?.y ?? 0) * CANVAS_SCALE + OFFSET_Y;
  const rot = comp.rotation ?? 0;
  const t   = comp.type;

  // Funcion auxiliar: calcula bbox aplicando rotacion a un rect local
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

  if (t === 'resistencia' || t === 'bobina') {
    // Cuerpo del resistor: rect ±25 en x, ±9 en y (unscaled), scale 0.38
    return rotatedBBox(25 * SCALE_DEFAULT, 9 * SCALE_DEFAULT);
  }
  if (t === 'resistencia_variable') {
    // Cuerpo circular del pot, radius=28, scale 0.75
    const R = 28 * SCALE_POT;
    return rotatedBBox(R, R);
  }
  if (t === 'capacitor') {
    return rotatedBBox(40 * SCALE_DEFAULT, 30 * SCALE_DEFAULT);
  }
  if (t === 'fuente_voltaje') {
    // Body offset (-80, -60) con rect 106 a 484 en x, 43 a 220 en y
    // Centro del body en (cx + (106+484)/2 - 80, cy + (43+220)/2 - 60) = (cx + 215, cy + 71.5) en unscaled
    // Pero en scaled (0.38): centro en (cx + 215*0.38 - 80*0.38, cy + 71.5*0.38 - 60*0.38) ≈ (cx + 51.3, cy + 4.4)
    // Half size: ((484-106)/2, (220-43)/2) * 0.38 = (71.8, 33.6)
    // Para simplificar: usa bbox amplio que cubra todo
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
  if (t === 'fuente_corriente') {
    // Circulo radio 25 (unscaled) * scale 0.38 ≈ 9.5
    return rotatedBBox(25 * SCALE_DEFAULT, 25 * SCALE_DEFAULT);
  }
  // Diodos, transistores: bbox conservador
  return rotatedBBox(20 * SCALE_DEFAULT, 20 * SCALE_DEFAULT);
}

function busHorizontalCollides(busY, x1, x2, bboxes, _excludedCompIds) {
  const xLo = Math.min(x1, x2);
  const xHi = Math.max(x1, x2);
 
  const margin = 1;
  for (const b of bboxes) {
    if (busY < b.minY + margin || busY > b.maxY - margin) continue;
    if (xHi < b.minX || xLo > b.maxX) continue;
    return true;
  }
  return false;
}

/**
 * Distancia minima del bus a cualquier bbox en la franja x1..x2.
 * Devuelve Infinity si no hay bboxes solapando en X.
 * Si el bus YA esta dentro de un bbox, devuelve un valor negativo.
 */
function busClearance(busY, x1, x2, bboxes) {
  const xLo = Math.min(x1, x2);
  const xHi = Math.max(x1, x2);
  let minDist = Infinity;
  for (const b of bboxes) {
    if (xHi < b.minX || xLo > b.maxX) continue; // no overlap en X
    if (busY >= b.minY && busY <= b.maxY) {
      // dentro del bbox
      return -1;
    }
    const dist = busY < b.minY ? b.minY - busY : busY - b.maxY;
    if (dist < minDist) minDist = dist;
  }
  return minDist;
}

// ─────────────────────────────────────────────────────────────────────────────
// WireLayer — Cables ortogonales que conectan en los terminales reales.
//
// Algoritmo:
//   1. Para cada nodo (numero_nodo) recolectamos las posiciones SVG de todos
//      los pines que pertenecen a ese nodo.
//   2. Si todos los pines comparten X (o casi) → barra vertical.
//      Si comparten Y → barra horizontal.
//   3. Caso general → "peine" ortogonal: una barra horizontal a la Y modal
//      del nodo, con bajadas/subidas verticales desde cada pin.
//   4. Para GND (nodo 0) la barra va a la Y maxima (pantalla abajo).
//   5. Si la barra atraviesa un componente que NO pertenece al nodo,
//      la movemos hacia arriba o abajo hasta encontrar una banda libre.
//   6. Solo segmentos H/V — nunca diagonales.
// ─────────────────────────────────────────────────────────────────────────────
function WireLayer({ netlist }) {

  // 1) Recolectar pines por nodo y bboxes de componentes
  const nodeMap = new Map();
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

  // 2) Para cada nodo, dibujar conexiones ortogonales
  nodeMap.forEach((pins, nodo) => {
    if (pins.length < 2) return;

    const isGnd = nodo === '0';
    const color = isGnd ? '#64748b' : '#cbd5e1';
    const dash  = isGnd ? '5 4' : undefined;
    const width = isGnd ? 1.5 : 2;
    const opacity = isGnd ? 0.7 : 0.95;

    const xs = pins.map(p => p.x);
    const ys = pins.map(p => p.y);
    const xRange = Math.max(...xs) - Math.min(...xs);
    const yRange = Math.max(...ys) - Math.min(...ys);

    // Caso 1: barra vertical (todos comparten X)
    if (xRange < 4 && yRange > 4) {
      const x0 = pins[0].x;
      const ymin = Math.min(...ys);
      const ymax = Math.max(...ys);
      lines.push(
        <line key={`n${nodo}-vbar`}
          x1={x0} y1={ymin} x2={x0} y2={ymax}
          stroke={color} strokeWidth={width}
          strokeLinecap="round" strokeDasharray={dash} opacity={opacity}
        />
      );
      return;
    }

    // Caso 2: barra horizontal (todos comparten Y)
    if (yRange < 4 && xRange > 4) {
      const y0 = pins[0].y;
      const xmin = Math.min(...xs);
      const xmax = Math.max(...xs);
      lines.push(
        <line key={`n${nodo}-hbar`}
          x1={xmin} y1={y0} x2={xmax} y2={y0}
          stroke={color} strokeWidth={width}
          strokeLinecap="round" strokeDasharray={dash} opacity={opacity}
        />
      );
      return;
    }

    // Caso 3 (general): peine ortogonal
    let busY;
    if (isGnd) {
      busY = Math.max(...ys);
    } else {
      // Estrategia:
      //  (a) Si hay una Y compartida por ≥2 pines (modal), usala como riel —
      //      asi varios pines quedan directamente sobre el riel sin stubs.
      //  (b) Si no hay coincidencia, usa la Y mediana — minimiza la longitud
      //      total de los stubs verticales.
      const yCount = new Map();
      pins.forEach(p => {
        const yKey = Math.round(p.y);
        yCount.set(yKey, (yCount.get(yKey) || 0) + 1);
      });
      let modalY = pins[0].y, modalCount = 0;
      yCount.forEach((cnt, yk) => {
        if (cnt > modalCount) { modalCount = cnt; modalY = yk; }
      });
      if (modalCount >= 2) {
        busY = modalY;
      } else {
        const sortedYs = [...ys].sort((a, b) => a - b);
        busY = sortedYs[Math.floor(sortedYs.length / 2)];
      }
    }

    const xmin = Math.min(...xs);
    const xmax = Math.max(...xs);

    // ── Anti-colision: si la barra atraviesa el cuerpo de algun componente,
    //    intentamos rutas alternativas. Si los pines del nodo abarcan un
    //    rango Y grande (≥80 px), el cable es de "transmision" y deberia
    //    ir por arriba del todo. Si no, usamos el bbox-top mas cercano.
    //    NO se aplica a GND, que siempre va por debajo.
    const ownCompIds = new Set(pins.map(p => p.compId));
    if (!isGnd && busHorizontalCollides(busY, xmin, xmax, allBBoxes, ownCompIds)) {
      const CLEARANCE = 24;
      let bestY = null;

      // Estrategia A: si el nodo es "grande" (yRange >= 80), elegir el
      // Y del pin mas alto menos un margen → el bus pasa al lado del
      // pin mas alto, los demas pines bajan/suben con stubs verticales.
      if (yRange >= 80) {
        const yMinPin = Math.min(...ys);
        const candidate = yMinPin;
        if (!busHorizontalCollides(candidate, xmin, xmax, allBBoxes, ownCompIds)) {
          bestY = candidate;
        } else {
          // Probar un poquito arriba del pin mas alto
          const candidate2 = yMinPin - CLEARANCE;
          if (!busHorizontalCollides(candidate2, xmin, xmax, allBBoxes, ownCompIds)) {
            bestY = candidate2;
          }
        }
      }

      // Estrategia B (fallback): bbox-top mas cercano - clearance.
      if (bestY === null) {
        let topMostY = Infinity;
        for (const b of allBBoxes) {
          if (xmax < b.minX || xmin > b.maxX) continue;
          if (b.minY < topMostY) topMostY = b.minY;
        }
        if (topMostY !== Infinity) {
          const candidate = topMostY - CLEARANCE;
          if (!busHorizontalCollides(candidate, xmin, xmax, allBBoxes, ownCompIds)) {
            bestY = candidate;
          }
        }
      }

      // Estrategia C (ultimo recurso): por debajo de todo.
      if (bestY === null) {
        let bottomMostY = -Infinity;
        for (const b of allBBoxes) {
          if (xmax < b.minX || xmin > b.maxX) continue;
          if (b.maxY > bottomMostY) bottomMostY = b.maxY;
        }
        if (bottomMostY !== -Infinity) {
          const candidate = bottomMostY + CLEARANCE;
          if (!busHorizontalCollides(candidate, xmin, xmax, allBBoxes, ownCompIds)) {
            bestY = candidate;
          }
        }
      }
      if (bestY !== null) busY = bestY;
    }

    // Riel horizontal a busY
    lines.push(
      <line key={`n${nodo}-bus`}
        x1={xmin} y1={busY} x2={xmax} y2={busY}
        stroke={color} strokeWidth={width}
        strokeLinecap="round" strokeDasharray={dash} opacity={opacity}
      />
    );

    // Stubs verticales desde cada pin al riel
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

    // Punto de union cuando 3+ pines coinciden electricamente
    if (!isGnd && pins.length >= 3) {
      pins.forEach((p, i) => {
        // Si el pin no esta sobre el riel, su stub se une al riel en (p.x, busY).
        if (Math.abs(p.y - busY) > 1.5) {
          dots.push({ x: p.x, y: busY, key: `n${nodo}-dot-${i}` });
        }
      });
    }
  });

  return (
    <g className="wires">
      {lines}
      {dots.map((d) => (
        <circle key={d.key} cx={d.x} cy={d.y} r={3}
          fill="#cbd5e1" opacity={0.9} />
      ))}
    </g>
  );
}

function GndSymbol({ x, y }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <line x1={0}  y1={0}  x2={0}  y2={12} stroke="#4a5568" strokeWidth={2} />
      <line x1={-10} y1={12} x2={10} y2={12} stroke="#4a5568" strokeWidth={2} />
      <line x1={-6}  y1={17} x2={6}  y2={17} stroke="#4a5568" strokeWidth={1.5} />
      <line x1={-2}  y1={22} x2={2}  y2={22} stroke="#4a5568" strokeWidth={1} />
    </g>
  );
}

function FallbackComp({ comp, x, y }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={-28} y={-14} width={56} height={28} rx={4}
        fill="#1e2028" stroke="#4a5568" strokeWidth={1.5} />
      <text textAnchor="middle" y={-2} fontSize={9} fill="#94a3b8" fontFamily="monospace" fontWeight="600">
        {comp.id}
      </text>
      <text textAnchor="middle" y={9} fontSize={8} fill="#6b7280" fontFamily="monospace">
        {comp.value ?? ''}
      </text>
    </g>
  );
}

function BobinaSVG({ comp, x, y }) {
  const arcs = [0,1,2,3].map(i => `M ${x - 24 + i*16} ${y} a 8 8 0 0 1 16 0`);
  return (
    <g>
      <path d={arcs.join(' ')} fill="none" stroke="#fbbf24" strokeWidth={2} />
      <line x1={x-24} y1={y} x2={x-36} y2={y} stroke="#6b7280" strokeWidth={1.5} />
      <line x1={x+40} y1={y} x2={x+52} y2={y} stroke="#6b7280" strokeWidth={1.5} />
      <text textAnchor="middle" x={x+8} y={y+18} fontSize={9} fill="#94a3b8" fontFamily="monospace">
        {comp.id}: {comp.value}H
      </text>
    </g>
  );
}

function renderComponent(comp) {
  const { x, y } = toSVG(comp.position);
  const rotation  = comp.rotation ?? 0;
  const valueNum  = parseNotation(comp.value) || 0;
  const orientation = (rotation === 90 || rotation === 270) ? 'vertical' : 'horizontal';
  const wrapRotation = rotation ? `rotate(${rotation}, ${x}, ${y})` : undefined;

  switch (comp.type) {
    case 'resistencia':
      return (
        <g key={comp.id} transform={wrapRotation}>
          <Resistor x={x} y={y} scale={0.38} componentId={comp.id} initialValue={valueNum} />
        </g>
      );
    case 'resistencia_variable':
      return (
        <g key={comp.id} transform={wrapRotation}>
          <Potentiometer x={x} y={y} scale={SCALE_POT} componentId={comp.id} initialValue={valueNum} />
        </g>
      );
    case 'capacitor':
      return (
        <g key={comp.id}>
          <Capacitor x={x} y={y} scale={0.38} orientation={orientation}
            componentId={comp.id} initialValue={valueNum} />
        </g>
      );
    case 'fuente_voltaje':
      return (
        <g key={comp.id} transform={wrapRotation}>
          <PowerSource x={x - 80} y={y - 60} scale={0.38}
            componentId={comp.id} initialValue={valueNum} />
        </g>
      );
    case 'fuente_corriente':
      // CurrentSource gestiona su propia rotacion internamente
      return (
        <CurrentSource key={comp.id} x={x} y={y} scale={0.38} rotation={rotation}
          componentId={comp.id} initialValue={valueNum} />
      );
    case 'bobina':
      return (
        <g key={comp.id} transform={wrapRotation}>
          <BobinaSVG comp={comp} x={x} y={y} />
        </g>
      );
    case 'diodo':
      return (
        <g key={comp.id} transform={wrapRotation}>
          <DiodoRectificador x={x} y={y} scale={0.38} orientation={orientation}
            componentId={comp.id} initialValue={valueNum} />
        </g>
      );
    case 'transistor_bjt':
    case 'transistor_fet':
      return (
        <g key={comp.id} transform={wrapRotation}>
          <Transistor x={x} y={y} scale={0.38} componentId={comp.id} />
        </g>
      );
    default:
      return <FallbackComp key={comp.id} comp={comp} x={x} y={y} />;
  }
}

export function NetlistRenderer({ netlist, preview = false }) {
  if (!netlist || netlist.length === 0) {
    return (
      <svg width="100%" height={preview ? 120 : 300}
        style={{ background: '#16181d', borderRadius: 8 }}>
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
          fill="#333" fontSize={12} fontFamily="monospace">
          Sin netlist disponible
        </text>
      </svg>
    );
  }

  const viewBox = calcViewBox(netlist);

  // Recolectar el pin GND mas bajo para anclar el simbolo de tierra
  const gndPins = [];
  netlist.forEach((comp) => {
    const pins = getPins(comp);
    Object.entries(comp.nodes ?? {}).forEach(([pinKey, pinData]) => {
      if (getNodoNum(pinData) === '0') {
        const p = resolvePin(pins, pinKey);
        if (p) gndPins.push({ x: p.x, y: p.y });
      }
    });
  });
  const gndAnchor = gndPins.length > 0
    ? gndPins.reduce((acc, p) => (p.y > acc.y ? p : acc), gndPins[0])
    : null;

  return (
    <svg width="100%" height={preview ? 120 : '100%'} viewBox={viewBox}
      style={{ background: '#16181d', borderRadius: 8, minHeight: preview ? 120 : 280 }}>
      <defs>
        <pattern id="grid" width={CANVAS_SCALE * 50} height={CANVAS_SCALE * 50}
          patternUnits="userSpaceOnUse">
          <path d={`M ${CANVAS_SCALE*50} 0 L 0 0 0 ${CANVAS_SCALE*50}`}
            fill="none" stroke="#1e2028" strokeWidth={0.5} />
        </pattern>
      </defs>
      <rect x="-10000" y="-10000" width="20000" height="20000" fill="url(#grid)" />

      <WireLayer netlist={netlist} />

      {!preview && gndAnchor && (
        <GndSymbol x={gndAnchor.x} y={gndAnchor.y + 8} />
      )}

      {netlist.map((comp) => renderComponent(comp))}

      {!preview && netlist.map((comp) => {
        const pins = getPins(comp);
        return Object.entries(comp.nodes ?? {}).map(([pinKey, pinData]) => {
          const nodo = getNodoNum(pinData);
          if (!nodo || nodo === '0') return null;
          const p = resolvePin(pins, pinKey);
          if (!p) return null;
          return (
            <text key={`${comp.id}-${pinKey}-label`}
              x={p.x + 6} y={p.y - 4} textAnchor="start"
              fontSize={9} fill="#475569" fontFamily="monospace"
              opacity={0.65}>
              {nodo}
            </text>
          );
        });
      })}
    </svg>
  );
}
