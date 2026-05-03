import { useState } from 'react';
import { COMPONENT_SCALE } from '../ConfigComponents/circuitConfig.js';
import { ComponentValueLabel } from './ComponentValueLabel.jsx';
import { useComponentValue } from '../../../hooks/useComponentValue.js';

export const Transistor = ({
  nodeIn = 'in', nodeAdj = 'adj', nodeOut = 'out',
  x = 0, y = 0,
  orientation = 'vertical',
  scale = COMPONENT_SCALE.transistor,
  // Value props
  componentId,
  initialValue = 100, // Beta (hFE) por defecto cuando es BJT;
                      // se sobrescribe con voltaje_salida cuando se usa como regulador.
  labelType = 'bjt', // 'bjt' (β) | 'vreg' (V de salida)
  onValueChange,
}) => {
  const id = componentId || `transistor-${x}-${y}`;
  const [value, setValue] = useComponentValue(id, initialValue);
  const [hovered, setHovered] = useState(false);

  const rotate = orientation === 'horizontal' ? -90 : 0;

  const pins = orientation === 'vertical'
    ? {
        adj: { x: x - 15 * scale, y: y + 60 * scale },
        out: { x: x,              y: y + 60 * scale },
        in:  { x: x + 15 * scale, y: y + 60 * scale },
      }
    : {
        adj: { x: x - 60 * scale, y: y - 15 * scale },
        out: { x: x - 60 * scale, y: y },
        in:  { x: x - 60 * scale, y: y + 15 * scale },
      };

  const handleValueChange = (newVal) => {
    setValue(newVal);
    onValueChange?.(newVal);
  };

  return (
    <g
      data-node-in={nodeIn}
      data-node-adj={nodeAdj}
      data-node-out={nodeOut}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <g transform={`translate(${x}, ${y}) rotate(${rotate}) scale(${scale})`}>
        {hovered && (
          <rect x="-35" y="-62" width="70" height="80" rx="6"
            fill="none" stroke="rgba(97,218,251,0.3)" strokeWidth="4"
            style={{ pointerEvents: 'none' }}
          />
        )}
        <path d="M -25,-10 L 25,-10 L 25,-45 L 15,-55 L -15,-55 L -25,-45 Z" fill="#b3b3b3"/>
        <circle cx="0" cy="-35" r="7" fill="#666"/>
        <circle cx="0" cy="-35" r="5" fill="#f4f4f4" opacity="0.3"/>
        <g stroke="#9f9f9f" strokeWidth="6" strokeLinecap="round">
          <line x1="-15" y1="15" x2="-15" y2="60"/>
          <line x1="0"   y1="15" x2="0"   y2="60"/>
          <line x1="15"  y1="15" x2="15"  y2="60"/>
        </g>
        <rect x="-30" y="-15" width="60" height="40" rx="2" fill="#1a1a1a"/>
        <rect x="-30" y="-15" width="60" height="8"  rx="2" fill="#333"/>
        <g opacity="0.4" stroke="#fff" strokeWidth="1">
          <line x1="-10" y1="0" x2="10" y2="0"/>
          <line x1="-15" y1="8" x2="15" y2="8"/>
        </g>

        {/* Value label: β para BJT, V para regulador */}
        <ComponentValueLabel
          componentId={id}
          type={labelType}
          value={value}
          onChange={handleValueChange}
          x={38}
          y={-5}
          textAnchor="start"
          fontSize={14/scale}
          fill="#aaa"
          rotate={-rotate}
        />
      </g>

      <circle cx={pins.adj.x} cy={pins.adj.y} r="5" fill="transparent" data-pin="adj"/>
      <circle cx={pins.out.x} cy={pins.out.y} r="5" fill="transparent" data-pin="out"/>
      <circle cx={pins.in.x}  cy={pins.in.y}  r="5" fill="transparent" data-pin="in"/>
    </g>
  );
};
