import { Resistor }          from './models/resistor.jsx';
import { Capacitor }         from './models/capacitor.jsx';
import { PowerSource }       from './models/PowerSource.jsx';
import { DiodoRectificador } from './models/DiodoRectificador.jsx';
import { Transistor }        from './models/Transistor.jsx';
import { parseNotation }     from './models/ComponentValueLabel.jsx';
import { Potentiometer }     from './models/Potentiometer.jsx';

const CANVAS_SCALE = 1.8;
const OFFSET_X     = 60;
const OFFSET_Y     = 60;

function toSVG(pos) {
  return {
    x: (parseFloat(pos?.x ?? 0)) * CANVAS_SCALE + OFFSET_X,
    y: (parseFloat(pos?.y ?? 0)) * CANVAS_SCALE + OFFSET_Y,
  };
}

/** Extrae el número de nodo tanto del formato viejo (string) como nuevo ({nodo,x,y}) */
function getNodoNum(pinData) {
  if (pinData && typeof pinData === 'object') return String(pinData.nodo);
  return String(pinData);
}

function calcViewBox(netlist) {
  if (!netlist || netlist.length === 0) return '0 0 600 400';
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  netlist.forEach((comp) => {
    const { x, y } = toSVG(comp.position);
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  });
  const margin = 100;
  return `${minX - margin} ${minY - margin} ${Math.max(maxX - minX + margin * 2, 400)} ${Math.max(maxY - minY + margin * 2, 300)}`;
}

function WireLayer({ netlist }) {
  const nodeMap = new Map();
  netlist.forEach((comp) => {
    const { x, y } = toSVG(comp.position);
    Object.entries(comp.nodes ?? {}).forEach(([pinKey, pinData]) => {
      const nodoNum = getNodoNum(pinData);
      if (!nodoNum) return;
      if (!nodeMap.has(nodoNum)) nodeMap.set(nodoNum, []);
      nodeMap.get(nodoNum).push({ x, y, compId: comp.id, pin: pinKey });
    });
  });

  const lines = [];
  nodeMap.forEach((pins, nodo) => {
    if (pins.length < 2) return;
    for (let i = 0; i < pins.length - 1; i++) {
      const a = pins[i], b = pins[i + 1];
      lines.push(
        <line key={`wire-${nodo}-${i}`}
          x1={a.x} y1={a.y} x2={b.x} y2={b.y}
          stroke={nodo === '0' ? '#4a5568' : '#6b7280'}
          strokeWidth={2} strokeLinecap="round"
          strokeDasharray={nodo === '0' ? '4 3' : undefined}
          opacity={0.6}
        />
      );
    }
  });
  return <g className="wires">{lines}</g>;
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

function CurrentSourceSVG({ comp, x, y }) {
  const r = 15;
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle cx={0} cy={0} r={r} fill="#1e2028" stroke="#6c63ff" strokeWidth={2} />
      <text textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="#a78bfa" fontFamily="monospace">I</text>
      <text textAnchor="middle" y={r + 14} fontSize={9} fill="#94a3b8" fontFamily="monospace">
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

  const gndPins = [];
  netlist.forEach((comp) => {
    Object.entries(comp.nodes ?? {}).forEach(([, pinData]) => {
      if (getNodoNum(pinData) === '0') {
        const { x, y } = toSVG(comp.position);
        gndPins.push({ x, y: y + 30 });
      }
    });
  });

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
      <rect width="100%" height="100%" fill="url(#grid)" />

      <WireLayer netlist={netlist} />

      {!preview && gndPins.map((p, i) => (
        <GndSymbol key={`gnd-${i}`} x={p.x} y={p.y} />
      ))}

      {netlist.map((comp) => renderComponent(comp))}

      {!preview && netlist.map((comp) => {
        const { x, y } = toSVG(comp.position);
        return Object.entries(comp.nodes ?? {}).map(([pin, pinData]) => {
          const nodo = getNodoNum(pinData);
          if (!nodo || nodo === '0') return null;
          return (
            <text key={`${comp.id}-${pin}-label`}
              x={x} y={y - 18} textAnchor="middle"
              fontSize={8} fill="#334155" fontFamily="monospace">
              {nodo}
            </text>
          );
        });
      })}
    </svg>
  );
}
