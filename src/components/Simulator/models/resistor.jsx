import { useState } from 'react';
import { COMPONENT_SCALE } from '../ConfigComponents/circuitConfig.js';
import { ComponentValueLabel, parseNotation } from './ComponentValueLabel.jsx';
import { useComponentValue } from '../../../hooks/useComponentValue.js';
import { colorCodeMap, ohmsToBands } from './resistorColorCodes.js';

const getSVGColor = (c) => colorCodeMap[c?.toLowerCase()]?.color || c || 'transparent';

export const Resistor = ({
  nodeA = 'node1',
  nodeB = 'node2',
  bodyColor = '#e1c18e',
  x = 0, y = 0,
  orientation = 'horizontal',
  scale = COMPONENT_SCALE.resistor,
  // Value props
  componentId,
  initialValue = 1000, // 1kΩ default in SI (Ohms)
  onValueChange,
}) => {
  const id = componentId || `resistor-${x}-${y}`;
  const [value, setValue] = useComponentValue(id, initialValue);
  const [hovered, setHovered] = useState(false);
  const [b1, b2, b3, b4] = ohmsToBands(value)


  const rotate = orientation === 'vertical' ? 90 : 0;
  const armLength = 100;

  const pinA = orientation === 'horizontal'
    ? { x: x - armLength * scale, y: y }
    : { x: x, y: y - armLength * scale };

  const pinB = orientation === 'horizontal'
    ? { x: x + armLength * scale, y: y }
    : { x: x, y: y + armLength * scale };

  const resistorPath = `
    M -60,0 C -60,-28 -40,-25 -20,-18 L 20,-18
    C 40,-25 60,-28 60,0
    C 60,28 40,25 20,18 L -20,18
    C -40,25 -60,28 -60,0 Z
  `;

  // POsicion del label
  const labelX = 0;
  const labelY = 52;
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
        <linearGradient id={`${id}-body-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#fff" stopOpacity="0.5"/>
          <stop offset="35%"  stopColor={bodyColor}/>
          <stop offset="65%"  stopColor={bodyColor}/>
          <stop offset="100%" stopColor="#5d4a2a" stopOpacity="0.4"/>
        </linearGradient>
        <linearGradient id={`${id}-pin-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#666"/>
          <stop offset="50%"  stopColor="#ccc"/>
          <stop offset="100%" stopColor="#666"/>
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d={resistorPath}/>
        </clipPath>
        {hovered && (
          <filter id={`${id}-glow`}>
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        )}
      </defs>

      <g transform={`translate(${x}, ${y}) rotate(${rotate}) scale(${scale})`}>
        {/* Selection glow */}
        {hovered && (
          <ellipse cx="0" cy="0" rx="65" ry="25"
            fill="none" stroke="rgba(97,218,251,0.35)" strokeWidth="6"
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Pata Izquierda */}
        <rect x="-100" y="-3" width="45" height="6" rx="2" fill={`url(#${id}-pin-grad)`}/>
        {/* Pata Derecha */}
        <rect x="55"  y="-3" width="45" height="6" rx="2" fill={`url(#${id}-pin-grad)`}/>

        {/* Cuerpo */}
        <path d={resistorPath} fill={`url(#${id}-body-grad)`}/>

        {/* Bandas de color */}
        <g clipPath={`url(#${id}-clip)`}>
          <rect x="-52" y="-30" width="10" height="60" fill={getSVGColor(b1)}/>
          <rect x="-35" y="-30" width="8"  height="60" fill={getSVGColor(b2)}/>
          <rect x="-15" y="-30" width="8"  height="60" fill={getSVGColor(b3)}/>
          <rect x="35"  y="-30" width="10" height="60" fill={getSVGColor(b4)}/>
        </g>

        {/* Brillo */}
        <path d="M -45,-12 Q 0,-18 45,-12"
          fill="none" stroke="#fff" strokeWidth="5" opacity="0.25" strokeLinecap="round"/>

        {/* Value label — usando ComponentValueLabel */}
        <ComponentValueLabel
          componentId={id}
          type="resistor"
          value={value}
          onChange={handleValueChange}
          x={labelX}
          y={labelY}
          textAnchor="middle"
          fontSize={14/scale}
          fill="#aaa"
          rotate={labelRotate}
        />
      </g>

      {/* Hitboxes */}
      <circle cx={pinA.x} cy={pinA.y} r="5" fill="transparent" data-pin="a"/>
      <circle cx={pinB.x} cy={pinB.y} r="5" fill="transparent" data-pin="b"/>
    </g>
  );
};
