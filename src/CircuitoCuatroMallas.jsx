import React from 'react';
import { Resistor }    from './components/Simulator/models/resistor.jsx';
import { PowerSource } from './components/Simulator/models/PowerSource.jsx';

const CircuitoCuatroMallas = ({ preview = false }) => {
  const S    = preview ? 0.22 : 0.45;
  const arm  = 100 * S;
  const stepX = preview ? 160 : 320;
  const stepY = preview ? 100 : 210;

  const NX = [
    preview ? 140 : 180,
    (preview ? 140 : 180) + stepX,
    (preview ? 140 : 180) + 2 * stepX,
  ];
  const NY = [
    preview ? 50  : 80,
    (preview ? 50  : 80) + stepY,
    (preview ? 50  : 80) + 2 * stepY,
  ];

  const Cable = ({ x1, y1, x2, y2, color = '#555' }) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={color} strokeWidth={preview ? 1.5 : 3} strokeLinecap="round" />
  );

  const p22v = { x: NX[0] - (preview ? 125 : 255), y: NY[1] + (preview ? 30 : 60) };
  const p18v = { x: NX[1] - (preview ? 126 : 256), y: NY[2] - (preview ? 80 : 165) };

  const W = preview ? 580 : 1150;
  const H = preview ? 340 : 680;

  return (
    <svg
      width="100%"
      height={preview ? 160 : 500}
      viewBox={`0 0 ${W} ${H}`}
      style={{ background: '#f8f9fa', borderRadius: 8 }}
    >
      {/* Fuente 22V */}
      <PowerSource x={p22v.x} y={p22v.y} scale={S} label="22V" />
      <path
        d={`M ${p22v.x + 575*S} ${p22v.y + 68*S} L ${NX[0]} ${p22v.y + 68*S} L ${NX[0]} ${NY[0]}`}
        fill="none" stroke="#cc1111" strokeWidth={preview ? 1.5 : 3}
      />
      <path
        d={`M ${p22v.x + 585*S} ${p22v.y + 220*S} L ${NX[0]} ${p22v.y + 220*S} L ${NX[0]} ${NY[2]}`}
        fill="none" stroke="#333" strokeWidth={preview ? 1.5 : 3}
      />

      {/* Fuente 18V */}
      <PowerSource x={p18v.x} y={p18v.y} scale={S} label="18V" />
      <path
        d={`M ${p18v.x + 575*S} ${p18v.y + 68*S} L ${NX[1]} ${p18v.y + 68*S} L ${NX[1]} ${NY[1]}`}
        fill="none" stroke="#cc1111" strokeWidth={preview ? 1.5 : 3}
      />
      <path
        d={`M ${p18v.x + 585*S} ${p18v.y + 220*S} L ${NX[1]} ${p18v.y + 220*S} L ${NX[1]} ${NY[2]}`}
        fill="none" stroke="#333" strokeWidth={preview ? 1.5 : 3}
      />

      {/* Resistencias horizontales */}
      <Resistor x={(NX[0]+NX[1])/2} y={NY[0]} scale={S} band1="yellow" />
      <Cable x1={NX[0]} y1={NY[0]} x2={(NX[0]+NX[1])/2 - arm} y2={NY[0]} />
      <Cable x1={(NX[0]+NX[1])/2 + arm} y1={NY[0]} x2={NX[1]} y2={NY[0]} />

      <Resistor x={(NX[1]+NX[2])/2} y={NY[0]} scale={S} band1="orange" />
      <Cable x1={NX[1]} y1={NY[0]} x2={(NX[1]+NX[2])/2 - arm} y2={NY[0]} />
      <Cable x1={(NX[1]+NX[2])/2 + arm} y1={NY[0]} x2={NX[2]} y2={NY[0]} />

      <Resistor x={(NX[0]+NX[1])/2} y={NY[1]} scale={S} band1="brown" />
      <Cable x1={NX[0]} y1={NY[1]} x2={(NX[0]+NX[1])/2 - arm} y2={NY[1]} />
      <Cable x1={(NX[0]+NX[1])/2 + arm} y1={NY[1]} x2={NX[1]} y2={NY[1]} />

      <Resistor x={(NX[1]+NX[2])/2} y={NY[1]} scale={S} band1="red" />
      <Cable x1={NX[1]} y1={NY[1]} x2={(NX[1]+NX[2])/2 - arm} y2={NY[1]} />
      <Cable x1={(NX[1]+NX[2])/2 + arm} y1={NY[1]} x2={NX[2]} y2={NY[1]} />

      <Resistor x={(NX[0]+NX[1])/2} y={NY[2]} scale={S} band1="green" />
      <Cable x1={NX[0]} y1={NY[2]} x2={(NX[0]+NX[1])/2 - arm} y2={NY[2]} />
      <Cable x1={(NX[0]+NX[1])/2 + arm} y1={NY[2]} x2={NX[1]} y2={NY[2]} />

      <Resistor x={(NX[1]+NX[2])/2} y={NY[2]} scale={S} band1="green" />
      <Cable x1={NX[1]} y1={NY[2]} x2={(NX[1]+NX[2])/2 - arm} y2={NY[2]} />
      <Cable x1={(NX[1]+NX[2])/2 + arm} y1={NY[2]} x2={NX[2]} y2={NY[2]} />

      {/* Resistencias verticales */}
      <Resistor x={NX[1]} y={(NY[0]+NY[1])/2} scale={S} orientation="vertical" band1="brown" />
      <Cable x1={NX[1]} y1={NY[0]} x2={NX[1]} y2={(NY[0]+NY[1])/2 - arm} />
      <Cable x1={NX[1]} y1={(NY[0]+NY[1])/2 + arm} x2={NX[1]} y2={NY[1]} />

      <Resistor x={NX[2]} y={(NY[0]+NY[1])/2} scale={S} orientation="vertical" band1="brown" />
      <Cable x1={NX[2]} y1={NY[0]} x2={NX[2]} y2={(NY[0]+NY[1])/2 - arm} />
      <Cable x1={NX[2]} y1={(NY[0]+NY[1])/2 + arm} x2={NX[2]} y2={NY[1]} />

      <Resistor x={NX[2]} y={(NY[1]+NY[2])/2} scale={S} orientation="vertical" band1="red" />
      <Cable x1={NX[2]} y1={NY[1]} x2={NX[2]} y2={(NY[1]+NY[2])/2 - arm} />
      <Cable x1={NX[2]} y1={(NY[1]+NY[2])/2 + arm} x2={NX[2]} y2={NY[2]} />

      {/* Nodos */}
      {NX.map(x => NY.map(y => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={preview ? 3 : 5} fill="red" />
      )))}
    </svg>
  );
};

export default CircuitoCuatroMallas;
