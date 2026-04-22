/**
 * NetlistRenderer — Renderiza una netlist de la API en un <svg>.
 *
 * SISTEMA DE COORDENADAS:
 * - Las coordenadas de la BD se usan DIRECTAMENTE como píxeles SVG (1:1).
 * - comp.position = posición visual del componente (viene de instancia_componente).
 * - node.x / node.y = posición del terminal para cables.
 * - Sin escala ni offset: lo que está en la BD es lo que se ve.
 */

import { Resistor }          from './models/resistor.jsx';
import { Capacitor }         from './models/capacitor.jsx';
import { PowerSource }       from './models/PowerSource.jsx';
import { DiodoRectificador } from './models/DiodoRectificador.jsx';
import { Transistor }        from './models/Transistor.jsx';
import { parseNotation }     from './models/ComponentValueLabel.jsx';
import { Potentiometer }     from './models/Potentiometer.jsx';

// Sin escala ni offset — coordenadas BD = píxeles SVG
function toSVG(pos) {
  return {
    x: parseFloat(pos?.x ?? 0),
    y: parseFloat(pos?.y ?? 0),
  };
}

function getNodoNum(pinData) {
  if (pinData && typeof pinData === 'object') return String(pinData.nodo);
  return String(pinData);
}

function getPinSVG(pinData) {
  if (pinData && typeof pinData === 'object' && 'x' in pinData) {
    return toSVG({ x: pinData.x, y: pinData.y });
  }
  return null;
}

function getCompSVG(comp) {
  if (comp.position?.x !== undefined && comp.position?.y !== undefined) {
    return toSVG(comp.position);
  }
  const pins = Object.values(comp.nodes ?? {})
    .filter(p => p && typeof p === 'object' && 'x' in p);
  if (pins.length === 0) return toSVG({ x: 0, y: 0 });
  const avgX = pins.reduce((s, p) => s + p.x, 0) / pins.length;
  const avgY = pins.reduce((s, p) => s + p.y, 0) / pins.length;
  return toSVG({ x: avgX, y: avgY });
}

// ─── ViewBox ──────────────────────────────────────────────────────────────────

function calcViewBox(netlist) {
  if (!netlist || netlist.length === 0) return '0 0 600 400';

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  netlist.forEach((comp) => {
    const pinCoords = Object.values(comp.nodes ?? {}).map(getPinSVG).filter(Boolean);
    const compPos   = [toSVG(comp.position)];
    const coords    = pinCoords.length > 0 ? pinCoords : compPos;
    coords.forEach(({ x, y }) => {
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    });
  });

  const margin = 150;
  return `${minX - margin} ${minY - margin} ${Math.max(maxX - minX + margin * 2, 400)} ${Math.max(maxY - minY + margin * 2, 300)}`;
}

// ─── Wires ────────────────────────────────────────────────────────────────────

function WireLayer({ netlist }) {
  const nodeMap = new Map();

  netlist.forEach((comp) => {
    Object.entries(comp.nodes ?? {}).forEach(([pinKey, pinData]) => {
      const nodoNum = getNodoNum(pinData);
      if (!nodoNum) return;
      const pinSVG = getPinSVG(pinData) ?? toSVG(comp.position);
      if (!nodeMap.has(nodoNum)) nodeMap.set(nodoNum, []);
      nodeMap.get(nodoNum).push({ ...pinSVG, compId: comp.id, pin: pinKey });
    });
  });

  const lines = [];
  nodeMap.forEach((pins, nodo) => {
    if (pins.length < 2) return;
    for (let i = 0; i < pins.length - 1; i++) {
      const a = pins[i], b = pins[i + 1];
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      if (dist < 2) continue;
      lines.push(
        <line
          key={`wire-${nodo}-${i}`}
          x1={a.x} y1={a.y} x2={b.x} y2={b.y}
          stroke={nodo === '0' ? '#64748b' : '#e2e8f0'}
          strokeWidth={nodo === '0' ? 1.5 : 2}
          strokeLinecap="round"
          strokeDasharray={nodo === '0' ? '5 3' : undefined}
          opacity={nodo === '0' ? 0.6 : 0.95}
        />
      );
    }
  });

  return <g className="wires">{lines}</g>;
}

// ─── Junction dots ────────────────────────────────────────────────────────────

function JunctionDots({ netlist }) {
  const nodeMap = new Map();
  netlist.forEach((comp) => {
    Object.entries(comp.nodes ?? {}).forEach(([, pinData]) => {
      const nodoNum = getNodoNum(pinData);
      if (!nodoNum || nodoNum === '0') return;
      const pinSVG = getPinSVG(pinData);
      if (!pinSVG) return;
      const key = `${nodoNum}-${Math.round(pinSVG.x)},${Math.round(pinSVG.y)}`;
      nodeMap.set(key, pinSVG);
    });
  });

  return (
    <g className="junctions">
      {[...nodeMap.values()].map((pos, i) => (
        <circle key={`junc-${i}`} cx={pos.x} cy={pos.y} r={4}
          fill="#e2e8f0" opacity={0.8} />
      ))}
    </g>
  );
}

// ─── GND ──────────────────────────────────────────────────────────────────────

function GndSymbol({ x, y }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <line x1={0}   y1={0}  x2={0}   y2={14} stroke="#64748b" strokeWidth={2} />
      <line x1={-12} y1={14} x2={12}  y2={14} stroke="#64748b" strokeWidth={2} />
      <line x1={-7}  y1={20} x2={7}   y2={20} stroke="#64748b" strokeWidth={1.5} />
      <line x1={-3}  y1={26} x2={3}   y2={26} stroke="#64748b" strokeWidth={1} />
    </g>
  );
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

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

function CurrentSourceSVG({ comp, x, y }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle cx={0} cy={0} r={20} fill="#1e2028" stroke="#6c63ff" strokeWidth={2} />
      <text textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="#a78bfa" fontFamily="monospace">I</text>
      <text textAnchor="middle" y={33} fontSize={9} fill="#94a3b8" fontFamily="monospace">
        {comp.id}: {comp.value}A
      </text>
    </g>
  );
}

function BobinaSVG({ comp, x, y }) {
  const arcs = [0,1,2,3].map(i => `M ${x - 24 + i*16} ${y} a 8 8 0 0 1 16 0`);
  return (
    <g>
      <path d={arcs.join(' ')} fill="none" stroke="#fbbf24" strokeWidth={2} />
      <line x1={x-24} y1={y} x2={x-38} y2={y} stroke="#6b7280" strokeWidth={1.5} />
      <line x1={x+40} y1={y} x2={x+54} y2={y} stroke="#6b7280" strokeWidth={1.5} />
      <text textAnchor="middle" x={x+8} y={y+18} fontSize={9} fill="#94a3b8" fontFamily="monospace">
        {comp.id}: {comp.value}H
      </text>
    </g>
  );
}

// ─── Etiquetas de nodo ────────────────────────────────────────────────────────

function NodeLabels({ netlist }) {
  const seen = new Set();
  const labels = [];
  netlist.forEach((comp) => {
    Object.entries(comp.nodes ?? {}).forEach(([, pinData]) => {
      const nodo = getNodoNum(pinData);
      if (!nodo || nodo === '0' || seen.has(nodo)) return;
      seen.add(nodo);
      const pos = getPinSVG(pinData) ?? toSVG(comp.position);
      labels.push(
        <text key={`lbl-${nodo}`} x={pos.x} y={pos.y - 12}
          textAnchor="middle" fontSize={10} fill="#475569" fontFamily="monospace">
          {nodo}
        </text>
      );
    });
  });
  return <g className="node-labels">{labels}</g>;
}

// ─── Renderizador de componentes ──────────────────────────────────────────────

function renderComponent(comp) {
  const { x, y }    = getCompSVG(comp);
  const rotation    = comp.rotation ?? 0;
  const valueNum    = parseNotation(comp.value) || 0;
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
          <PowerSource x={x - 116} y={y - 51} scale={0.38}
            componentId={comp.id} initialValue={valueNum} />
        </g>
      );
    case 'fuente_corriente':
      return <CurrentSourceSVG key={comp.id} comp={comp} x={x} y={y} />;
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

// ─── Componente principal ─────────────────────────────────────────────────────

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

  const gndMap = new Map();
  netlist.forEach((comp) => {
    Object.values(comp.nodes ?? {}).forEach((pinData) => {
      if (getNodoNum(pinData) !== '0') return;
      const pos = getPinSVG(pinData) ?? toSVG(comp.position);
      const key = `${Math.round(pos.x)},${Math.round(pos.y)}`;
      if (!gndMap.has(key)) gndMap.set(key, pos);
    });
  });

  return (
    <svg width="100%" height={preview ? 120 : '100%'} viewBox={viewBox}
      style={{ background: '#16181d', borderRadius: 8, minHeight: preview ? 120 : 280 }}>

      <defs>
        <pattern id="grid" width={100} height={100} patternUnits="userSpaceOnUse">
          <path d="M 100 0 L 0 0 0 100"
            fill="none" stroke="#1e2028" strokeWidth={0.5} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      <WireLayer netlist={netlist} />
      {!preview && <JunctionDots netlist={netlist} />}
      {!preview && [...gndMap.values()].map((p, i) => (
        <GndSymbol key={`gnd-${i}`} x={p.x} y={p.y} />
      ))}
      {netlist.map((comp) => renderComponent(comp))}
      {!preview && <NodeLabels netlist={netlist} />}
    </svg>
  );
}