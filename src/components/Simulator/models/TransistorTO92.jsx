import { useState } from 'react';
import { COMPONENT_SCALE } from '../ConfigComponents/circuitConfig.js';
import { ComponentValueLabel } from './ComponentValueLabel.jsx';
import { useComponentValue } from '../../../hooks/useComponentValue.js';

export const TransistorTO92 = ({
  nodeE = 'emisor1', nodeB = 'base1', nodeC = 'colector1',
  x = 0, y = 0,
  orientation = 'vertical',
  scale = COMPONENT_SCALE.transistorTO92,
  // Value props
  componentId,
  initialValue = 100, // Beta (hFE)
  onValueChange,
}) => {
  const id = componentId || `transistorTO92-${x}-${y}`;
  const [value, setValue] = useComponentValue(id, initialValue);
  const [hovered, setHovered] = useState(false);

  const rotate = orientation === 'horizontal' ? -90 : 0;

  const pins = orientation === 'vertical'
    ? {
        e: { x: x - 15 * scale, y: y + 60 * scale },
        b: { x: x,              y: y + 60 * scale },
        c: { x: x + 15 * scale, y: y + 60 * scale },
      }
    : {
        e: { x: x - 60 * scale, y: y - 15 * scale },
        b: { x: x - 60 * scale, y: y },
        c: { x: x - 60 * scale, y: y + 15 * scale },
      };

  const handleValueChange = (newVal) => {
    setValue(newVal);
    onValueChange?.(newVal);
  };

  return (
    <g
      data-node-e={nodeE}
      data-node-b={nodeB}
      data-node-c={nodeC}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <defs>
        <linearGradient id={`${id}-pin-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#ddd"/>
          <stop offset="50%"  stopColor="#fff"/>
          <stop offset="100%" stopColor="#ddd"/>
        </linearGradient>
        <linearGradient id={`${id}-body-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#222"/>
          <stop offset="50%"  stopColor="#333"/>
          <stop offset="100%" stopColor="#111"/>
        </linearGradient>
      </defs>

      <g transform={`translate(${x}, ${y}) rotate(${rotate}) scale(${scale})`}>
        {hovered && (
          <rect x="-35" y="-20" width="70" height="85" rx="6"
            fill="none" stroke="rgba(97,218,251,0.3)" strokeWidth="4"
            style={{ pointerEvents: 'none' }}
          />
        )}
        <g stroke="#9f9f9f" strokeWidth="6" strokeLinecap="round">
          <line x1="-15" y1="12" x2="-15" y2="60"/>
          <line x1="0"   y1="12" x2="0"   y2="60"/>
          <line x1="15"  y1="12" x2="15"  y2="60"/>
        </g>
        <rect x="-30" y="-15" width="60" height="30" rx="4" fill={`url(#${id}-body-grad)`}/>
        <rect x="-30" y="-15" width="60" height="6"  rx="4" fill="#000" opacity="0.6"/>
        <g stroke={`url(#${id}-pin-grad)`} strokeWidth="6" strokeLinecap="round">
          <line x1="-15" y1="15" x2="-15" y2="60"/>
          <line x1="0"   y1="15" x2="0"   y2="60"/>
          <line x1="15"  y1="15" x2="15"  y2="60"/>
        </g>
        <g opacity="0.4" stroke="#fff" strokeWidth="1">
          <line x1="-10" y1="0"  x2="10" y2="0"/>
          <line x1="-10" y1="10" x2="10" y2="10"/>
        </g>

        {/* β value label */}
        <ComponentValueLabel
          componentId={id}
          type="bjt"
          value={value}
          onChange={handleValueChange}
          x={38}
          y={0}
          textAnchor="start"
          fontSize={14/scale}
          fill="#aaa"
          rotate={-rotate}
        />
      </g>

      <circle cx={pins.e.x} cy={pins.e.y} r="5" fill="transparent" data-pin="e"/>
      <circle cx={pins.b.x} cy={pins.b.y} r="5" fill="transparent" data-pin="b"/>
      <circle cx={pins.c.x} cy={pins.c.y} r="5" fill="transparent" data-pin="c"/>
    </g>
  );
};
