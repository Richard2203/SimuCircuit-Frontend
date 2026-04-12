// DiodoRectificador.jsx
import { useState } from 'react';
import { COMPONENT_SCALE } from '../ConfigComponents/circuitConfig.js';
import { ComponentValueLabel } from './ComponentValueLabel.jsx';
import { useComponentValue } from '../../../hooks/useComponentValue.js';

export const DiodoRectificador = ({
  nodeA = 'anodo1',
  nodeB = 'catodo1',
  x = 0,
  y = 0,
  orientation = 'horizontal',
  scale = COMPONENT_SCALE.diodoRectificador,
  // Value props
  componentId,
  initialValue = 0.7,  // 0.7V forward voltage drop (SI = Volts)
  onValueChange,
}) => {
  const id = componentId || `diodo-${x}-${y}`;
  const [value, setValue] = useComponentValue(id, initialValue);
  const [hovered, setHovered] = useState(false);

  const rotate = orientation === 'vertical' ? 90 : 0;

  const pinA = orientation === 'horizontal'
    ? { x: x - 85 * scale, y: y }
    : { x: x, y: y - 85 * scale };

  const pinB = orientation === 'horizontal'
    ? { x: x + 85 * scale, y: y }
    : { x: x, y: y + 85 * scale };

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
          <rect x="-90" y="-30" width="180" height="60" rx="10"
            fill="none" stroke="rgba(97,218,251,0.3)" strokeWidth="4"
            style={{ pointerEvents: 'none' }}
          />
        )}
        <rect x="-85" y="-4" width="30"  height="8" rx="4" fill="#9f9f9f"/>
        <rect x="55"  y="-4" width="30"  height="8" rx="4" fill="#9f9f9f"/>
        <rect x="-60" y="-25" width="120" height="50" rx="8" fill="#2a2a2a"/>
        <rect x="-40" y="-25" width="15"  height="50" fill="#66747d"/>

        {/* Value label — Vf */}
        <ComponentValueLabel
          componentId={id}
          type="diode"
          value={value}
          onChange={handleValueChange}
          x={0}
          y={38}
          textAnchor="middle"
          fontSize={14/scale}
          fill="#aaa"
          rotate={-rotate}
        />
      </g>

      <circle cx={pinA.x} cy={pinA.y} r="5" fill="transparent" data-pin="a"/>
      <circle cx={pinB.x} cy={pinB.y} r="5" fill="transparent" data-pin="b"/>
    </g>
  );
};
