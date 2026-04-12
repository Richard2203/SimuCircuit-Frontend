// PowerSource.jsx
import { useState } from 'react';
import { COMPONENT_SCALE } from '../ConfigComponents/circuitConfig.js';
import { ComponentValueLabel } from './ComponentValueLabel.jsx';
import { useComponentValue } from '../../../hooks/useComponentValue.js';

export const PowerSource = ({
  nodeA = 'vcc',
  nodeB = 'gnd',
  label = 'Power Source',
  x = 0,
  y = 0,
  scale = COMPONENT_SCALE.powerSource,
  // Value props
  componentId,
  initialValue = 12,   // 12V default in SI (Volts)
  onValueChange,
}) => {
  const id = componentId || `power-${x}-${y}`;
  const [value, setValue] = useComponentValue(id, initialValue);
  const [hovered, setHovered] = useState(false);

  const pinA = { x: x + 575 * scale, y: y + 68 * scale };
  const pinB = { x: x + 585 * scale, y: y + 220 * scale };

  const handleValueChange = (newVal) => {
    setValue(newVal);
    onValueChange?.(newVal);
  };

  // Build display label from live value — e.g. "12V DC"
  const displayedLabel = `${value}V DC`;

  return (
    <g
      data-node-a={nodeA}
      data-node-b={nodeB}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <defs>
        <linearGradient id={`${id}-top`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#4a4a4a"/>
          <stop offset="50%"  stopColor="#2e2e2e"/>
          <stop offset="100%" stopColor="#1a1a1a"/>
        </linearGradient>
        <linearGradient id={`${id}-front`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#2a2a2a"/>
          <stop offset="100%" stopColor="#0d0d0d"/>
        </linearGradient>
        <linearGradient id={`${id}-side`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#1a1a1a"/>
          <stop offset="100%" stopColor="#0a0a0a"/>
        </linearGradient>
        <linearGradient id={`${id}-text`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#aaaaaa"/>
          <stop offset="40%"  stopColor="#dddddd"/>
          <stop offset="100%" stopColor="#888888"/>
        </linearGradient>
        <radialGradient id={`${id}-screw`} cx="35%" cy="35%" r="60%">
          <stop offset="0%"   stopColor="#666"/>
          <stop offset="100%" stopColor="#222"/>
        </radialGradient>
      </defs>

      <g transform={`translate(${x}, ${y}) scale(${scale})`}>
        {/* Selection glow */}
        {hovered && (
          <rect x="100" y="35" width="408" height="200" rx="6"
            fill="none" stroke="rgba(97,218,251,0.35)" strokeWidth="8"
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Cara lateral derecha */}
        <path d="M 484,55 L 500,43 L 500,228 L 484,218 Z"
          fill={`url(#${id}-side)`} stroke="#000" strokeWidth="1"/>
        <path d="M 484,55 L 500,43 L 500,55 L 484,67 Z"
          fill="#383838" stroke="#000" strokeWidth="0.8"/>
        {/* Cara frontal */}
        <path d="M 106,67 L 484,67 L 484,218 L 106,218 Z"
          fill={`url(#${id}-front)`} stroke="#000" strokeWidth="1"/>
        {/* Cara superior */}
        <path d="M 106,43 L 484,43 L 484,67 L 106,67 Z"
          fill={`url(#${id}-top)`} stroke="#000" strokeWidth="1"/>

        {/* Bordes */}
        <rect x="106" y="38" width="378" height="8" rx="3"
          fill="#111" stroke="#000" strokeWidth="0.5"/>
        <path d="M 484,38 L 500,28 L 500,43 L 484,46 Z"
          fill="#0d0d0d" stroke="#000" strokeWidth="0.5"/>
        <rect x="106" y="218" width="378" height="8" rx="3"
          fill="#111" stroke="#000" strokeWidth="0.5"/>
        <path d="M 484,218 L 500,208 L 500,226 L 484,226 Z"
          fill="#0d0d0d" stroke="#000" strokeWidth="0.5"/>

        {/* Texto estático del label (sombra) */}
        <text x="295" y="152" fontSize="30" fontWeight="bold"
          fontFamily="Arial, sans-serif" fill="#000"
          textAnchor="middle" opacity="0.5">{displayedLabel}</text>
        <text x="295" y="150" fontSize="30" fontWeight="bold"
          fontFamily="Arial, sans-serif" fill={`url(#${id}-text)`}
          textAnchor="middle" letterSpacing="1">{displayedLabel}</text>

        {/* Tornillos */}
        {[
          { cx: 136, cy: 88  },
          { cx: 454, cy: 88  },
          { cx: 136, cy: 198 },
          { cx: 454, cy: 198 },
        ].map(({ cx, cy }) => (
          <g key={`${cx}-${cy}`}>
            <circle cx={cx} cy={cy} r="9"
              fill={`url(#${id}-screw)`} stroke="#000" strokeWidth="0.8"/>
            <line x1={cx-6} y1={cy} x2={cx+6} y2={cy} stroke="#111" strokeWidth="1.5"/>
            <line x1={cx} y1={cy-6} x2={cx} y2={cy+6} stroke="#111" strokeWidth="1.5"/>
          </g>
        ))}

        {/* Indicadores triángulo */}
        <path d="M 480,122 L 488,128 L 480,134 Z" fill="#555"/>
        <path d="M 480,152 L 488,158 L 480,164 Z" fill="#555"/>

        {/* Cable rojo (VCC) */}
        <path d="M 500,128 L 575,128 L 575,80"
          fill="none" stroke="#333" strokeWidth="9"
          strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M 500,128 L 575,128 L 575,80"
          fill="none" stroke="#cc1111" strokeWidth="6"
          strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="575" y1="80" x2="575" y2="70"
          stroke="#b87333" strokeWidth="5" strokeLinecap="round"/>
        <circle cx="575" cy="68" r="3.5"
          fill="#d4943a" stroke="#996620" strokeWidth="0.8"/>

        {/* Cable negro (GND) */}
        <path d="M 500,158 L 585,158 L 585,208"
          fill="none" stroke="#333" strokeWidth="9"
          strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M 500,158 L 585,158 L 585,208"
          fill="none" stroke="#222" strokeWidth="6"
          strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="585" y1="208" x2="585" y2="218"
          stroke="#b87333" strokeWidth="5" strokeLinecap="round"/>
        <circle cx="585" cy="220" r="3.5"
          fill="#d4943a" stroke="#996620" strokeWidth="0.8"/>

        {/* Value label — editable, below the body */}
        <ComponentValueLabel
          componentId={id}
          type="voltageSource"
          value={value}
          onChange={handleValueChange}
          x={295}
          y={245}
          textAnchor="middle"
          fontSize={14}
          fill="#61dafb"
          rotate={0}
        />
      </g>

      <circle cx={pinA.x} cy={pinA.y} r="4" fill="transparent" data-pin="a"/>
      <circle cx={pinB.x} cy={pinB.y} r="4" fill="transparent" data-pin="b"/>
    </g>
  );
};
