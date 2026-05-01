import { useMemo } from 'react';

/**
 * PreviewSVG — Canvas SVG en tiempo real del circuito.
 *
 * Recibe la lista de componentes de la netlist admin y:
 * 1. Calcula posiciones automaticamente (auto-layout).
 * 2. Dibuja los SVG de cada componente.
 * 3. Dibuja los cables que unen los nodos.
 *
 * Los SVG de los componentes se derivan de los modelos en
 * src/components/Simulator/models/ como formas simplificadas
 * adaptadas para el preview estático.
 *
 * @param {{
 *   componentes: Array<{ id, type, value, nodo_a, nodo_b, rotation, params }>,
 *   hoveredId?: string,
 *   onHoverComp?: (id: string|null) => void,
 * }} props
 */
export function PreviewSVG({ componentes = [], hoveredId, onHoverComp }) {
  const layout = useMemo(() => computeLayout(componentes), [componentes]);

  const W = 580, H = 380;

  return (
    <div style={wrapper}>
      <p style={label}>Vista previa del circuito</p>
      <div style={canvasWrapper}>
        <svg
          width="100%" height="100%"
          viewBox={`0 0 ${W} ${H}`}
          style={{ display: 'block' }}
        >
          {/* Cuadricula milimetrica */}
          <defs>
            <pattern id="grid-minor" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
            </pattern>
            <pattern id="grid-major" width="50" height="50" patternUnits="userSpaceOnUse">
              <rect width="50" height="50" fill="url(#grid-minor)"/>
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width={W} height={H} fill="var(--bg)" rx="8"/>
          <rect width={W} height={H} fill="url(#grid-major)" rx="8" opacity="0.6"/>

          {/* Cables */}
          {layout.cables.map((cable, i) => (
            <line
              key={i}
              x1={cable.x1} y1={cable.y1}
              x2={cable.x2} y2={cable.y2}
              stroke="#4a90d9"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          ))}

          {/* Nodos: punto en cruces */}
          {layout.nodosPunto.map((np, i) => (
            <circle key={i} cx={np.x} cy={np.y} r="3" fill="#4a90d9" />
          ))}

          {/* Componentes */}
          {layout.items.map((item) => (
            <g
              key={item.id}
              transform={`translate(${item.cx}, ${item.cy}) rotate(${item.rotation})`}
              opacity={hoveredId && hoveredId !== item.id ? 0.4 : 1}
              style={{ cursor: 'pointer', transition: 'opacity .15s' }}
              onMouseEnter={() => onHoverComp?.(item.id)}
              onMouseLeave={() => onHoverComp?.(null)}
            >
              <ComponentShape
                type={item.type}
                value={item.value}
                hovered={hoveredId === item.id}
                params={item.params}
              />
            </g>
          ))}

          {/* Etiqueta vacia */}
          {componentes.length === 0 && (
            <text x={W / 2} y={H / 2} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="14">
              Agrega componentes para ver la vista previa
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── *
 *  AUTO-LAYOUT
 *  Algoritmo: construye un grafo de nodos, coloca componentes
 *  en una grilla BFS desde el nodo "0" o el primer nodo declarado.
 * ─────────────────────────────────────────────────────────── */
function computeLayout(componentes) {
  if (!componentes || componentes.length === 0) {
    return { items: [], cables: [], nodosPunto: [] };
  }

  // Dimensiones del canvas
  const W = 580, H = 380;
  const PAD = 60;
  const COMP_W = 60, COMP_H = 30; // tamanio logico de un componente
  const SPACING_X = 110, SPACING_Y = 100;

  // 1. Recolectar nodos unicos
  const nodoSet = new Set();
  componentes.forEach((c) => {
    if (c.nodo_a) nodoSet.add(String(c.nodo_a));
    if (c.nodo_b) nodoSet.add(String(c.nodo_b));
  });
  const nodos = [...nodoSet].sort((a, b) => {
    if (a === '0') return -1;
    if (b === '0') return 1;
    return a.localeCompare(b, undefined, { numeric: true });
  });

  // 2. Asignar posicion a cada nodo
  const cols = Math.max(2, Math.ceil(Math.sqrt(nodos.length + 1)));
  const nodoPos = {};
  nodos.forEach((n, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    nodoPos[n] = {
      x: PAD + col * SPACING_X + (row % 2 === 1 ? SPACING_X / 2 : 0),
      y: PAD + row * SPACING_Y,
    };
  });

  // Nodo tierra (0) siempre abajo
  if (nodoPos['0']) {
    nodoPos['0'].y = Math.min(H - PAD, nodoPos['0'].y + SPACING_Y * 0.8);
  }

  // 3. Colocar componente en el punto medio entre sus dos nodos
  const items = componentes.map((c) => {
    const pA = nodoPos[c.nodo_a] ?? { x: PAD, y: PAD };
    const pB = nodoPos[c.nodo_b] ?? { x: PAD + SPACING_X, y: PAD };
    const cx = (pA.x + pB.x) / 2;
    const cy = (pA.y + pB.y) / 2;

    // Determinar orientacion si nodos estan verticalmente alineados
    const dxAbs = Math.abs(pB.x - pA.x);
    const dyAbs = Math.abs(pB.y - pA.y);
    const autoRot = dyAbs > dxAbs ? 90 : 0;
    const rotation = c.rotation ?? autoRot;

    return { id: c.id, type: c.type, value: c.value, cx, cy, rotation, params: c.params ?? {} };
  });

  // 4. Cables: conectar terminales de componente a posicion del nodo
  const cables = [];
  componentes.forEach((c) => {
    const pA = nodoPos[c.nodo_a];
    const pB = nodoPos[c.nodo_b];
    if (!pA || !pB) return;

    const item = items.find((i) => i.id === c.id);
    if (!item) return;

    const rot = (item.rotation * Math.PI) / 180;
    const cosR = Math.cos(rot), sinR = Math.sin(rot);
    const half = COMP_W / 2;

    // Terminal A (lado izquierdo del componente, rotado)
    const tAx = item.cx + cosR * (-half);
    const tAy = item.cy + sinR * (-half);
    // Terminal B (lado derecho)
    const tBx = item.cx + cosR * half;
    const tBy = item.cy + sinR * half;

    cables.push({ x1: pA.x, y1: pA.y, x2: tAx, y2: tAy });
    cables.push({ x1: pB.x, y1: pB.y, x2: tBx, y2: tBy });
  });

  // 5. Marcar nodos con mas de 2 conexiones con un punto
  const nodoCount = {};
  componentes.forEach((c) => {
    [c.nodo_a, c.nodo_b].forEach((n) => {
      if (!n) return;
      nodoCount[n] = (nodoCount[n] ?? 0) + 1;
    });
  });
  const nodosPunto = Object.entries(nodoCount)
    .filter(([, count]) => count > 2)
    .map(([n]) => nodoPos[n])
    .filter(Boolean);

  return { items, cables, nodosPunto };
}

/* ─────────────────────────────────────────────────────────── *
 *  SHAPES — representaciones SVG simplificadas por tipo,
 *  derivadas de los modelos en src/components/Simulator/models/
 * ─────────────────────────────────────────────────────────── */
function ComponentShape({ type, value, hovered, params }) {
  const stroke = hovered ? '#a78bfa' : '#6c63ff';
  const fill   = hovered ? 'rgba(108,99,255,0.15)' : 'var(--bg-elevated)';

  switch (type) {
    case 'resistencia':
    case 'resistencia_variable':
      return <ResistorShape value={value} stroke={stroke} fill={fill} variable={type === 'resistencia_variable'} />;
    case 'fuente_voltaje':
      return <VoltageSourceShape value={value} stroke={stroke} />;
    case 'fuente_corriente':
      return <CurrentSourceShape value={value} stroke={stroke} />;
    case 'capacitor':
      return <CapacitorShape value={value} stroke={stroke} />;
    case 'bobina':
      return <BobinaShape value={value} stroke={stroke} />;
    case 'diodo':
      return <DiodoShape value={value} stroke={stroke} tipo={params?.tipo} />;
    case 'transistor_bjt':
    case 'transistor_fet':
      return <TransistorShape stroke={stroke} tipo={params?.tipo} />;
    case 'regulador_voltaje':
      return <ReguladorShape stroke={stroke} />;
    default:
      return <GenericShape value={value} stroke={stroke} fill={fill} />;
  }
}

function ResistorShape({ value, stroke, fill, variable }) {
  return (
    <g>
      <line x1="-30" y1="0" x2="-18" y2="0" stroke={stroke} strokeWidth="1.5"/>
      <rect x="-18" y="-9" width="36" height="18" rx="2" fill={fill} stroke={stroke} strokeWidth="1.5"/>
      <line x1="18" y1="0" x2="30" y2="0" stroke={stroke} strokeWidth="1.5"/>
      {variable && <line x1="-14" y1="-12" x2="14" y2="12" stroke={stroke} strokeWidth="1.2"/>}
      <text y="18" textAnchor="middle" fill={stroke} fontSize="9">{value || ''}</text>
    </g>
  );
}

function VoltageSourceShape({ value, stroke }) {
  return (
    <g>
      <line x1="-30" y1="0" x2="-14" y2="0" stroke={stroke} strokeWidth="1.5"/>
      <circle cx="0" cy="0" r="14" fill="none" stroke={stroke} strokeWidth="1.5"/>
      <line x1="-7" y1="0" x2="7" y2="0" stroke={stroke} strokeWidth="1.2"/>
      <line x1="0" y1="-7" x2="0" y2="7" stroke={stroke} strokeWidth="1.2"/>
      <line x1="14" y1="0" x2="30" y2="0" stroke={stroke} strokeWidth="1.5"/>
      <text y="22" textAnchor="middle" fill={stroke} fontSize="9">{value}V</text>
    </g>
  );
}

function CurrentSourceShape({ value, stroke }) {
  return (
    <g>
      <line x1="-30" y1="0" x2="-14" y2="0" stroke={stroke} strokeWidth="1.5"/>
      <circle cx="0" cy="0" r="14" fill="none" stroke={stroke} strokeWidth="1.5"/>
      <line x1="-7" y1="0" x2="4" y2="0" stroke={stroke} strokeWidth="1.2"/>
      <polygon points="4,0 -2,-4 -2,4" fill={stroke}/>
      <line x1="14" y1="0" x2="30" y2="0" stroke={stroke} strokeWidth="1.5"/>
      <text y="22" textAnchor="middle" fill={stroke} fontSize="9">{value}A</text>
    </g>
  );
}

function CapacitorShape({ value, stroke }) {
  return (
    <g>
      <line x1="-30" y1="0" x2="-5" y2="0" stroke={stroke} strokeWidth="1.5"/>
      <line x1="-5" y1="-14" x2="-5" y2="14" stroke={stroke} strokeWidth="2.2"/>
      <line x1="5" y1="-14" x2="5" y2="14" stroke={stroke} strokeWidth="2.2"/>
      <line x1="5" y1="0" x2="30" y2="0" stroke={stroke} strokeWidth="1.5"/>
      <text y="22" textAnchor="middle" fill={stroke} fontSize="9">{value}F</text>
    </g>
  );
}

function BobinaShape({ value, stroke }) {
  const arcs = [-18, -6, 6, 18];
  return (
    <g>
      <line x1="-30" y1="0" x2="-24" y2="0" stroke={stroke} strokeWidth="1.5"/>
      {arcs.map((cx, i) => (
        <path key={i} d={`M ${cx - 6} 0 A 6 6 0 0 1 ${cx + 6} 0`} fill="none" stroke={stroke} strokeWidth="1.5"/>
      ))}
      <line x1="24" y1="0" x2="30" y2="0" stroke={stroke} strokeWidth="1.5"/>
      <text y="18" textAnchor="middle" fill={stroke} fontSize="9">{value}H</text>
    </g>
  );
}

function DiodoShape({ value, stroke, tipo }) {
  const isLed   = tipo?.includes('LED');
  const isZener = tipo === 'Zener';
  return (
    <g>
      <line x1="-30" y1="0" x2="-10" y2="0" stroke={stroke} strokeWidth="1.5"/>
      <polygon points="-10,0 10,-10 10,10" fill={isLed ? '#fbbf24' : stroke}/>
      {isZener
        ? <path d={`M 10 -12 L 10 0 L 16 12`} fill="none" stroke={stroke} strokeWidth="1.8"/>
        : <line x1="10" y1="-12" x2="10" y2="12" stroke={stroke} strokeWidth="1.8"/>}
      <line x1="10" y1="0" x2="30" y2="0" stroke={stroke} strokeWidth="1.5"/>
      {isLed && (
        <>
          <line x1="12" y1="-8" x2="18" y2="-16" stroke="#fbbf24" strokeWidth="1"/>
          <line x1="16" y1="-5" x2="22" y2="-13" stroke="#fbbf24" strokeWidth="1"/>
        </>
      )}
      <text y="20" textAnchor="middle" fill={stroke} fontSize="8">{value}</text>
    </g>
  );
}

function TransistorShape({ stroke, tipo }) {
  const isNPN = !tipo?.includes('P') || tipo === 'JFET_N' || tipo === 'MOSFET_N';
  return (
    <g>
      <line x1="-30" y1="0" x2="-10" y2="0" stroke={stroke} strokeWidth="1.5"/>
      <line x1="-10" y1="-18" x2="-10" y2="18" stroke={stroke} strokeWidth="2"/>
      <line x1="-10" y1="-12" x2="10" y2="-20" stroke={stroke} strokeWidth="1.5"/>
      <line x1="-10" y1="12" x2="10" y2="20" stroke={stroke} strokeWidth="1.5"/>
      {isNPN
        ? <polygon points="10,20 2,14 8,10" fill={stroke}/>
        : <polygon points="-10,12 -2,8 -8,14" fill={stroke}/>
      }
      <line x1="10" y1="-20" x2="30" y2="-20" stroke={stroke} strokeWidth="1.5"/>
      <line x1="10" y1="20" x2="30" y2="20" stroke={stroke} strokeWidth="1.5"/>
      <text y="32" textAnchor="middle" fill={stroke} fontSize="9">{tipo ?? 'BJT'}</text>
    </g>
  );
}

function ReguladorShape({ stroke }) {
  return (
    <g>
      <line x1="-30" y1="0" x2="-14" y2="0" stroke={stroke} strokeWidth="1.5"/>
      <rect x="-14" y="-14" width="28" height="28" rx="3" fill="none" stroke={stroke} strokeWidth="1.5"/>
      <text textAnchor="middle" fill={stroke} fontSize="8" fontWeight="bold">REG</text>
      <line x1="14" y1="0" x2="30" y2="0" stroke={stroke} strokeWidth="1.5"/>
      <line x1="0" y1="-14" x2="0" y2="-28" stroke={stroke} strokeWidth="1.5"/>
    </g>
  );
}

function GenericShape({ value, stroke, fill }) {
  return (
    <g>
      <line x1="-30" y1="0" x2="-16" y2="0" stroke={stroke} strokeWidth="1.5"/>
      <rect x="-16" y="-10" width="32" height="20" rx="3" fill={fill} stroke={stroke} strokeWidth="1.5"/>
      <text textAnchor="middle" fill={stroke} fontSize="9">{value ?? '?'}</text>
      <line x1="16" y1="0" x2="30" y2="0" stroke={stroke} strokeWidth="1.5"/>
    </g>
  );
}

/* ── Estilos ────────────────────────────────────── */
const wrapper      = { display: 'flex', flexDirection: 'column', height: '100%' };
const label        = { fontSize: 11, color: 'var(--text-hint)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' };
const canvasWrapper = {
  flex: 1,
  background: 'var(--bg)',
  borderRadius: 'var(--r-lg)',
  border: '1px solid var(--border)',
  overflow: 'hidden',
  minHeight: 260,
};
