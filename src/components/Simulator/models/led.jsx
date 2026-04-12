// LED.jsx
import { useState } from 'react';
import { COMPONENT_SCALE } from '../ConfigComponents/circuitConfig.js';
import { ComponentValueLabel } from './ComponentValueLabel.jsx';
import { useComponentValue } from '../../../hooks/useComponentValue.js';

export const LED = ({
  nodeA = 'anodo1',
  nodeB = 'catodo1',
  x = 0,
  y = 0,
  orientation = 'vertical',
  scale = COMPONENT_SCALE.led,
  // Value props
  componentId,
  initialValue = 2.0,  // Forward voltage drop in Volts
  onValueChange,
}) => {
  const id = componentId || `led-${x}-${y}`;
  const [value, setValue] = useComponentValue(id, initialValue);
  const [hovered, setHovered] = useState(false);

  const rotate = orientation === 'horizontal' ? -90 : 0;

  const pinA = orientation === 'vertical'
    ? { x: x - 15 * scale, y: y + 95 * scale }
    : { x: x - 95 * scale, y: y - 15 * scale };

  const pinB = orientation === 'vertical'
    ? { x: x + 18 * scale, y: y + 95 * scale }
    : { x: x + 95 * scale, y: y + 18 * scale };

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
      <g transform={`translate(${x}, ${y}) rotate(${rotate}) scale(${scale})`}>
        {hovered && (
          <rect x="-35" y="-20" width="80" height="110" rx="8"
            fill="none" stroke="rgba(97,218,251,0.3)" strokeWidth="4"
            style={{ pointerEvents: 'none' }}
          />
        )}
        <path d="M 14.5,45 V 55 Q 14.5,60 18,63.5 L 20,65.5 Q 23.5,69 23.5,74 V 85"
          fill="none" stroke="#9f9f9f" strokeWidth="6"
          strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M -14.5,45 V 85"
          fill="none" stroke="#9f9f9f" strokeWidth="6" strokeLinecap="round"/>
        <path d="M -30,42 V 45 A 30,6.5 0 0 0 30,45 V 42" fill="#3a6cac"/>
        <ellipse cx="0" cy="42" rx="30" ry="6.5" fill="#4688ca"/>
        <path d="M -30,42 V -15 A 30,30 0 0 1 30,-15 V 42 Z" fill="#2b538e"/>

        {/* Vf label */}
        <ComponentValueLabel
          componentId={id}
          type="diode"
          value={value}
          onChange={handleValueChange}
          x={38}
          y={10}
          textAnchor="start"
          fontSize={11}
          fill="#777"
          rotate={-rotate}
        />
      </g>

      <circle cx={pinA.x} cy={pinA.y} r="4" fill="transparent" data-pin="a"/>
      <circle cx={pinB.x} cy={pinB.y} r="4" fill="transparent" data-pin="b"/>
    </g>
  );
};
