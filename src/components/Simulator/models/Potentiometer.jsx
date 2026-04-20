// Potentiometer.jsx
import { useState } from 'react';
import { COMPONENT_SCALE } from '../ConfigComponents/circuitConfig.js';
import { ComponentValueLabel } from './ComponentValueLabel.jsx';
import { useComponentValue } from '../../../hooks/useComponentValue.js';

const START_DEG = 210;
const RANGE_DEG = 300;

function percentToDeg(pct) {
  return START_DEG + (pct / 100) * RANGE_DEG;
}

export const Potentiometer = ({
  nodeA = 'node1',
  nodeB = 'node2',
  nodeW = 'nodeW',
  x = 0, y = 0,
  orientation = 'horizontal',
  scale = COMPONENT_SCALE.resistor,
  componentId,
  initialValue = 10000,
  minValue     = 0,
  maxValue     = 10000,
  onValueChange,
}) => {
  const id = componentId || `pot-${x}-${y}`;
  const [value, setValue] = useComponentValue(id, initialValue);
  const [hovered, setHovered] = useState(false);

  const rotate = orientation === 'vertical' ? 90 : 0;

  const R  = 28;
  const Ri = 22;
  const Rs =  9;

  const pct      = (value - minValue) / (maxValue - minValue);
  const notchRad = (percentToDeg(pct * 100) * Math.PI) / 180;
  const notchOuter = { x: Math.cos(notchRad) * Rs,       y: Math.sin(notchRad) * Rs };
  const notchInner = { x: Math.cos(notchRad) * (Rs - 7), y: Math.sin(notchRad) * (Rs - 7) };

  const pinLen     = 38;
  const pinSpacing = 14;
  const pins = [
    { key: 'a', lx: -pinSpacing, ly: R },
    { key: 'w', lx:  0,          ly: R },
    { key: 'b', lx:  pinSpacing, ly: R },
  ];

  function localToWorld(lx, ly) {
    const r = (rotate * Math.PI) / 180;
    return {
      x: x + (lx * Math.cos(r) - ly * Math.sin(r)) * scale,
      y: y + (lx * Math.sin(r) + ly * Math.cos(r)) * scale,
    };
  }

  const pinA = localToWorld(-pinSpacing, R + pinLen);
  const pinB = localToWorld( pinSpacing, R + pinLen);
  const pinW = localToWorld( 0,          R + pinLen);

  const handleChange = (newVal) => {
    setValue(newVal);
    onValueChange?.(newVal);
  };

  return (
    <g
      data-node-a={nodeA}
      data-node-b={nodeB}
      data-node-w={nodeW}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <defs>
        <radialGradient id={`${id}-body`} cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#4a6070"/>
          <stop offset="100%" stopColor="#1e2f3a"/>
        </radialGradient>
        <radialGradient id={`${id}-dial`} cx="45%" cy="38%" r="60%">
          <stop offset="0%"   stopColor="#7aa8c4"/>
          <stop offset="100%" stopColor="#4a7f9e"/>
        </radialGradient>
        <radialGradient id={`${id}-screw`} cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#3a4f5c"/>
          <stop offset="100%" stopColor="#1a2830"/>
        </radialGradient>
        <linearGradient id={`${id}-pin`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#666"/>
          <stop offset="50%"  stopColor="#bbb"/>
          <stop offset="100%" stopColor="#666"/>
        </linearGradient>
      </defs>

      <g transform={`translate(${x}, ${y}) rotate(${rotate}) scale(${scale})`}>

        {/* Hover glow */}
        {hovered && (
          <circle cx="0" cy="0" r={R + 6}
            fill="none" stroke="rgba(97,218,251,0.35)" strokeWidth="5"
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Patas */}
        {pins.map(p => (
          <rect key={p.key}
            x={p.lx - 2} y={p.ly} width="4" height={pinLen} rx="1.5"
            fill={`url(#${id}-pin)`}
          />
        ))}

        {/* Cuerpo exterior */}
        <circle cx="0" cy="0" r={R} fill={`url(#${id}-body)`}/>
        <circle cx="0" cy="0" r={R} fill="none" stroke="#0d1a22" strokeWidth="1.5"/>

        {/* Tornillos decorativos */}
        {[45, 135, 225, 315].map(d => {
          const r = (d * Math.PI) / 180;
          return <circle key={d}
            cx={Math.cos(r) * (R - 4)} cy={Math.sin(r) * (R - 4)}
            r="2.5" fill="#2a3d4a" stroke="#0d1a22" strokeWidth="0.8"
          />;
        })}

        {/* Dial interior */}
        <circle cx="0" cy="0" r={Ri} fill={`url(#${id}-dial)`}/>
        <circle cx="0" cy="0" r={Ri} fill="none" stroke="#2a4555" strokeWidth="1"/>

        {/* Marcas de escala */}
        {Array.from({ length: 31 }).map((_, i) => {
          const deg = START_DEG + (i / 30) * RANGE_DEG;
          const r   = (deg * Math.PI) / 180;
          const maj = i % 5 === 0;
          return (
            <line key={i}
              x1={Math.cos(r) * (Ri - 1)}          y1={Math.sin(r) * (Ri - 1)}
              x2={Math.cos(r) * (maj ? Ri-6 : Ri-4)} y2={Math.sin(r) * (maj ? Ri-6 : Ri-4)}
              stroke="rgba(255,255,255,0.6)"
              strokeWidth={maj ? 1.2 : 0.7}
              strokeLinecap="round"
            />
          );
        })}

        {/* Tornillo central */}
        <circle cx="0" cy="0" r={Rs} fill={`url(#${id}-screw)`}/>
        <circle cx="0" cy="0" r={Rs} fill="none" stroke="#0d1a22" strokeWidth="1"/>

        {/* Muesca */}
        <line
          x1={notchInner.x} y1={notchInner.y}
          x2={notchOuter.x} y2={notchOuter.y}
          stroke="rgba(255,255,255,0.75)" strokeWidth="2.2" strokeLinecap="round"
        />

        {/* Brillo */}
        <ellipse cx="-5" cy="-8" rx="8" ry="5"
          fill="rgba(255,255,255,0.10)" style={{ pointerEvents: 'none' }}/>

        {/* Value label */}
        <ComponentValueLabel
          componentId={id}
          type="resistor"
          value={value}
          onChange={handleChange}
          x={0}
          y={R + pinLen + 14}
          textAnchor="middle"
          fontSize={14 / scale}
          fill="#aaa"
          rotate={-rotate}
        />
      </g>

      {/* Hitboxes terminales */}
      <circle cx={pinA.x} cy={pinA.y} r="5" fill="transparent" data-pin="a"/>
      <circle cx={pinW.x} cy={pinW.y} r="5" fill="transparent" data-pin="b"/>
      <circle cx={pinB.x} cy={pinB.y} r="5" fill="transparent" data-pin="w"/>
    </g>
  );
};