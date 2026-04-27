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

// Calculo de pines en SVG, replicando los offsets exactos de cada modelo.
// Cada componente devuelve un mapa { pinKey -> {x,y} } en coordenadas SVG.
// rotation se aplica como rotacion rigida alrededor del centro (cx, cy).

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
  const s   = 0.38; // mismo scale que renderComponent

  const t = comp.type;

  if (t === 'resistencia' || t === 'resistencia_variable' || t === 'bobina') {
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
    pin1: 'n1', pin2: 'n2',
    a: 'n1', b: 'n2',
    positivo: 'pos', negativo: 'neg',
    vcc: 'pos', gnd: 'neg',
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
//   5. Solo segmentos H/V — nunca diagonales.
function WireLayer({ netlist }) {

  // 1) Recolectar pines por nodo
  const nodeMap = new Map();
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
      //  (a) Si hay una Y compartida por ≥2 pines (modal), usala como riel
      //  (b) Si no hay coincidencia, usa la Y mediana — minimiza la longitud total de los stubs verticales.
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
          <Potentiometer x={x} y={y} scale={0.38} componentId={comp.id} initialValue={valueNum} />
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
