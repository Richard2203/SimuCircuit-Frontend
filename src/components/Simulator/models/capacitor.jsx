// Capacitor.jsx
import { useState } from 'react';
import { COMPONENT_SCALE } from '../ConfigComponents/circuitConfig.js';
import { ComponentValueLabel } from './ComponentValueLabel.jsx';
import { useComponentValue } from '../../../hooks/useComponentValue.js';

export const Capacitor = ({
  nodeA = 'node1',
  nodeB = 'node2',
  voltage = '25V',
  x = 0,
  y = 0,
  orientation = 'vertical',
  scale = COMPONENT_SCALE.capacitor,
  // Value props
  componentId,
  initialValue = 100e-6, // 100µF in SI (Farads)
  onValueChange,
}) => {
  const id = componentId || `cap-${x}-${y}`;
  const [value, setValue] = useComponentValue(id, initialValue);
  const [hovered, setHovered] = useState(false);

  const rotate = orientation === 'horizontal' ? 90 : 0;

  const pinA = orientation === 'vertical'
    ? { x: x - 24 * scale, y: y + 108 * scale }
    : { x: x - 108 * scale, y: y - 24 * scale };

  const pinB = orientation === 'vertical'
    ? { x: x + 23 * scale, y: y + 108 * scale }
    : { x: x + 108 * scale, y: y + 23 * scale };

  // Label positioned to the right of the capacitor body
  const labelX = 66;
  const labelY = -10;
  const labelRotate = -rotate;

  const handleValueChange = (newVal) => {
    setValue(newVal);
    onValueChange?.(newVal);
  };

  return (
    <g
      data-node-a={nodeA}
      data-node-b={nodeB}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <defs>
        <linearGradient id={`${id}-body`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#111"/>
          <stop offset="15%"  stopColor="#333"/>
          <stop offset="45%"  stopColor="#3a3a3a"/>
          <stop offset="78%"  stopColor="#222"/>
          <stop offset="100%" stopColor="#0d0d0d"/>
        </linearGradient>
        <linearGradient id={`${id}-stripe`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#505050"/>
          <stop offset="50%"  stopColor="#888898"/>
          <stop offset="100%" stopColor="#505050"/>
        </linearGradient>
        <radialGradient id={`${id}-top`} cx="36%" cy="32%" r="60%">
          <stop offset="0%"   stopColor="#d8d8d8"/>
          <stop offset="40%"  stopColor="#a0a0a0"/>
          <stop offset="100%" stopColor="#505050"/>
        </radialGradient>
        <radialGradient id={`${id}-shine`} cx="30%" cy="25%" r="40%">
          <stop offset="0%"   stopColor="#fff" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#fff" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id={`${id}-rim`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#0a0a0a"/>
          <stop offset="40%"  stopColor="#1e1e1e"/>
          <stop offset="100%" stopColor="#080808"/>
        </linearGradient>
        <linearGradient id={`${id}-pin`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#3a3a3a"/>
          <stop offset="40%"  stopColor="#b0b0b0"/>
          <stop offset="100%" stopColor="#3a3a3a"/>
        </linearGradient>
        <clipPath id={`${id}-cap-shape`}>
          <path d="M -58,-85 L 58,-85 L 58,53 Q 58,90 0,90 Q -58,90 -58,53 Z"/>
        </clipPath>
        <clipPath id={`${id}-top-clip`}>
          <ellipse cx="0" cy="-85" rx="58" ry="16"/>
        </clipPath>
      </defs>

      <g transform={`translate(${x}, ${y}) rotate(${rotate}) scale(${scale})`}>
        {/* Selection glow */}
        {hovered && (
          <ellipse cx="0" cy="0" rx="65" ry="100"
            fill="none" stroke="rgba(97,218,251,0.3)" strokeWidth="5"
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Pins */}
        <rect x="-28" y="83"  width="9"   height="48" rx="4" fill={`url(#${id}-pin)`}/>
        <rect x="19"  y="83"  width="9"   height="48" rx="4" fill={`url(#${id}-pin)`}/>
        <rect x="-25" y="83"  width="2.5" height="48" rx="1" fill="#fff" opacity="0.15"/>
        <rect x="22"  y="83"  width="2.5" height="48" rx="1" fill="#fff" opacity="0.15"/>

        {/* Body */}
        <path d="M -58,-85 L 58,-85 L 58,53 Q 58,90 0,90 Q -58,90 -58,53 Z"
          fill={`url(#${id}-body)`} stroke="#0a0a0a" strokeWidth="1"/>
        <rect x="-40" y="-85" width="38" height="175"
          fill={`url(#${id}-stripe)`} clipPath={`url(#${id}-cap-shape)`}/>
        <line x1="-2" y1="-83" x2="-2" y2="67"
          stroke="#222" strokeWidth="1.2" opacity="0.9"/>
        <rect x="-58" y="-85" width="9" height="175"
          fill="#000" opacity="0.55" clipPath={`url(#${id}-cap-shape)`}/>
        <rect x="49"  y="-85" width="9" height="175"
          fill="#000" opacity="0.5"  clipPath={`url(#${id}-cap-shape)`}/>
        <path d="M -58,53 A 58,10 0 0 0 58,53"
          fill="none" stroke="#0d0d0d" strokeWidth="5" strokeLinecap="round"/>
        <ellipse cx="0" cy="-81" rx="60" ry="16"
          fill={`url(#${id}-rim)`} stroke="#050505" strokeWidth="0.5"/>
        <ellipse cx="0" cy="-87" rx="58" ry="18"
          fill={`url(#${id}-top)`} stroke="#2a2a2a" strokeWidth="0.8"/>
        <ellipse cx="0" cy="-87" rx="58" ry="18"
          fill={`url(#${id}-shine)`}/>

        {/* Polarity cross on top */}
        <g clipPath={`url(#${id}-top-clip)`}>
          <line x1="-58" y1="-87" x2="58" y2="-87"
            stroke="#444" strokeWidth="3.5" strokeLinecap="round"/>
          <line x1="0" y1="-105" x2="0" y2="-69"
            stroke="#444" strokeWidth="3.5" strokeLinecap="round"/>
        </g>

        {/* Polarity indicator — "+" label on positive lead */}
        <text x="-20" y="105" fontSize="13" fill="#a0e0a0"
          fontFamily="monospace" textAnchor="middle"
          transform={`rotate(${-rotate})`}>+</text>

        {/* Value label — editable */}
        <ComponentValueLabel
          componentId={id}
          type="capacitor"
          value={value}
          onChange={handleValueChange}
          x={labelX}
          y={labelY}
          textAnchor="start"
          fontSize={14/scale}
          fill="#777"
          rotate={labelRotate}
        />

        {/* Voltage rating (static) */}
        <text x={66} y={6} fontSize={14/scale} fill="#555" fontFamily="monospace"
          transform={`rotate(${-rotate})`}>{voltage}</text>
      </g>

      <circle cx={pinA.x} cy={pinA.y} r="3" fill="transparent" data-pin="a"/>
      <circle cx={pinB.x} cy={pinB.y} r="3" fill="transparent" data-pin="b"/>
    </g>
  );
};
