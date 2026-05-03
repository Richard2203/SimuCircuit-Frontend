import { useState } from 'react';
import { ComponentValueLabel, formatValue } from './ComponentValueLabel.jsx';
import { useComponentValue } from '../../../hooks/useComponentValue.js';

export const CurrentSource = ({
  nodeA = 'pos',
  nodeB = 'neg',
  x = 0,
  y = 0,
  scale = 0.38,
  rotation = 0,
  componentId,
  initialValue = 0.001, // 1 mA por defecto en SI (Amperios)
  onValueChange,
}) => {
  const id = componentId || `isrc-${x}-${y}`;
  const [value, setValue] = useComponentValue(id, initialValue);
  const [hovered, setHovered] = useState(false);

  const PIN_DIST_SVG = 38;

  // Helper: rota un offset por rotation° alrededor del centro.
  const rotPt = (dx, dy) => {
    const r = (rotation * Math.PI) / 180;
    const c = Math.cos(r);
    const s = Math.sin(r);
    return { x: x + dx * c - dy * s, y: y + dx * s + dy * c };
  };

  const pinPos = rotPt(0, -PIN_DIST_SVG);
  const pinNeg = rotPt(0,  PIN_DIST_SVG);

  const handleValueChange = (newVal) => {
    setValue(newVal);
    onValueChange?.(newVal);
  };

  // Etiqueta legible: amperios con prefijos
  const displayValue = formatValue(value, 'A');

  return (
    <g
      data-node-a={nodeA}
      data-node-b={nodeB}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <defs>
        <radialGradient id={`${id}-body`} cx="38%" cy="34%" r="65%">
          <stop offset="0%"   stopColor="#3a3f5c"/>
          <stop offset="100%" stopColor="#1a1d2e"/>
        </radialGradient>
        <linearGradient id={`${id}-pin`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#666"/>
          <stop offset="50%"  stopColor="#bbb"/>
          <stop offset="100%" stopColor="#666"/>
        </linearGradient>
      </defs>

      {/* Cuerpo: rotamos un grupo entero */}
      <g transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scale})`}>
        {/* Glow al hover */}
        {hovered && (
          <circle cx="0" cy="0" r="72"
            fill="none" stroke="rgba(167,139,250,0.30)" strokeWidth="6"
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Pin superior (+) */}
        <rect x="-3" y="-100" width="6" height="34" rx="2"
          fill={`url(#${id}-pin)`}/>
        {/* Pin inferior (−) */}
        <rect x="-3" y="66" width="6" height="34" rx="2"
          fill={`url(#${id}-pin)`}/>

        {/* Cuerpo circular */}
        <circle cx="0" cy="0" r="65"
          fill={`url(#${id}-body)`}
          stroke="#a78bfa"
          strokeWidth="3"/>

        {/* Flecha vertical interior (indica polo + arriba) */}
        {/* Línea principal */}
        <line x1="0" y1="36" x2="0" y2="-22"
          stroke="#a78bfa" strokeWidth="4" strokeLinecap="round"/>
        {/* Cabeza de flecha */}
        <polygon
          points="0,-40 -14,-18 14,-18"
          fill="#a78bfa"
          stroke="#a78bfa"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Marcas de polaridad */}
        <text x="0" y="-46" textAnchor="middle" fontSize="20"
          fontWeight="bold" fontFamily="Arial, sans-serif"
          fill="#fbbf24">+</text>
        <text x="0" y="58" textAnchor="middle" fontSize="22"
          fontWeight="bold" fontFamily="Arial, sans-serif"
          fill="#94a3b8">−</text>

        {/* Brillo decorativo */}
        <ellipse cx="-22" cy="-22" rx="14" ry="9"
          fill="rgba(255,255,255,0.07)"
          style={{ pointerEvents: 'none' }}/>

        {/* Etiqueta del valor (siempre legible: contra-rotamos) */}
        <ComponentValueLabel
          componentId={id}
          type="currentSource"
          value={value}
          onChange={handleValueChange}
          x={0}
          y={108}
          textAnchor="middle"
          fontSize={14 / scale}
          fill="#a78bfa"
          rotate={-rotation}
        />

        <text x="0" y="-72" textAnchor="middle"
          fontSize="13" fontWeight="600" fontFamily="monospace"
          fill="#94a3b8" style={{ pointerEvents: 'none' }}>
          {displayValue}
        </text>
      </g>

      {/* Hitboxes en coordenadas mundiales (ya rotadas) */}
      <circle cx={pinPos.x} cy={pinPos.y} r="5" fill="transparent" data-pin="pos"/>
      <circle cx={pinNeg.x} cy={pinNeg.y} r="5" fill="transparent" data-pin="neg"/>
    </g>
  );
};
