/**
 * utils/circuitSVG.jsx
 * Renderizador de SVGs para distintos tipos de circuito.
 * Separado de los componentes para mantener SRP.
 */

const PURPLE = '#6c63ff';
const PURPLE_LIGHT = '#a78bfa';
const GREEN = '#4ade80';
const MUTED = '#64748b';

/**
 * SVG de circuito en paralelo / mallas
 */
function ParallelCircuitSVG({ circuit }) {
  return (
    <svg viewBox="0 0 300 220" width="100%" height="100%" style={{ maxHeight: 220 }}>
      {/* Marco exterior */}
      <line x1="30" y1="40" x2="270" y2="40" stroke={PURPLE} strokeWidth="2" />
      <line x1="30" y1="40" x2="30" y2="180" stroke={PURPLE} strokeWidth="2" />
      <line x1="270" y1="40" x2="270" y2="180" stroke={PURPLE} strokeWidth="2" />
      <line x1="30" y1="180" x2="270" y2="180" stroke={PURPLE} strokeWidth="2" />

      {/* Ramas internas */}
      <line x1="120" y1="40" x2="120" y2="80" stroke={PURPLE} strokeWidth="1.5" />
      <line x1="180" y1="40" x2="180" y2="80" stroke={PURPLE} strokeWidth="1.5" />
      <line x1="120" y1="110" x2="120" y2="150" stroke={PURPLE} strokeWidth="1.5" />
      <line x1="180" y1="110" x2="180" y2="150" stroke={PURPLE} strokeWidth="1.5" />
      <line x1="120" y1="150" x2="180" y2="150" stroke={PURPLE} strokeWidth="1.5" />

      {/* Resistencias paralelas */}
      {[80, 115, 145].map((y, i) => (
        <g key={i}>
          <rect x="115" y={y} width="70" height="12" rx="2" fill="none" stroke={PURPLE_LIGHT} strokeWidth="1.5" />
          <text x="150" y={y + 9} textAnchor="middle" fontSize="9" fill={PURPLE_LIGHT}>
            R{i + 1}= {[3, 6, 3][i]}Ω
          </text>
        </g>
      ))}

      {/* Fuente de corriente */}
      <g transform="translate(20,140)">
        <line x1="5" y1="0" x2="5" y2="30" stroke={GREEN} strokeWidth="2" />
        <line x1="0" y1="15" x2="10" y2="15" stroke={GREEN} strokeWidth="2" />
        <text x="12" y="12" fontSize="9" fill={GREEN}>V</text>
        <text x="-2" y="45" fontSize="8" fill={MUTED}>I={circuit.current}A</text>
      </g>

      {/* Resistencia inferior */}
      <rect x="200" y="168" width="50" height="12" rx="2" fill="none" stroke={PURPLE_LIGHT} strokeWidth="1.5" />
      <text x="225" y="177" textAnchor="middle" fontSize="8" fill={PURPLE_LIGHT}>R₄=2Ω</text>
    </svg>
  );
}

/**
 * SVG de circuito en serie
 */
function SeriesCircuitSVG({ circuit }) {
  const resistors = [
    { x: 60, label: '1Ω' },
    { x: 130, label: '6Ω' },
    { x: 200, label: '12Ω' },
    { x: 255, label: '10Ω' },
  ];

  return (
    <svg viewBox="0 0 320 200" width="100%" height="100%" style={{ maxHeight: 200 }}>
      {/* Marco */}
      <line x1="20" y1="50" x2="290" y2="50" stroke={PURPLE} strokeWidth="2" />
      <line x1="20" y1="50" x2="20" y2="160" stroke={PURPLE} strokeWidth="2" />
      <line x1="290" y1="50" x2="290" y2="160" stroke={PURPLE} strokeWidth="2" />
      <line x1="20" y1="160" x2="290" y2="160" stroke={PURPLE} strokeWidth="2" />

      {/* Resistencias en serie */}
      {resistors.map((r, i) => (
        <g key={i}>
          <rect x={r.x} y="42" width="35" height="12" rx="2" fill="none" stroke={PURPLE_LIGHT} strokeWidth="1.5" />
          <text x={r.x + 17} y="51" textAnchor="middle" fontSize="8" fill={PURPLE_LIGHT}>{r.label}</text>
        </g>
      ))}

      {/* Fuente de voltaje */}
      <g transform="translate(10,100)">
        <line x1="5" y1="-30" x2="5" y2="30" stroke={GREEN} strokeWidth="2" />
        <line x1="2" y1="-10" x2="8" y2="-10" stroke={GREEN} strokeWidth="1" />
        <line x1="2" y1="0" x2="8" y2="0" stroke={GREEN} strokeWidth="1" />
        <text x="12" y="5" fontSize="9" fill={GREEN}>{circuit.voltage}V</text>
      </g>

      {/* Label voltaje */}
      <text x="155" y="180" textAnchor="middle" fontSize="9" fill={MUTED}>{circuit.voltage} V</text>
    </svg>
  );
}

/**
 * Componente principal que elige el SVG según el tipo de circuito.
 * @param {{ circuit: object }} props
 */
export function CircuitSVG({ circuit }) {
  const isParallel =
    circuit.type === 'Paralelo' ||
    circuit.type === 'Mallas' ||
    circuit.name.toLowerCase().includes('mallas');

  return isParallel
    ? <ParallelCircuitSVG circuit={circuit} />
    : <SeriesCircuitSVG circuit={circuit} />;
}
