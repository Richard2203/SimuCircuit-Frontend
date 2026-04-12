import React from 'react';
import { Resistor }    from './components/Simulator/models/resistor.jsx';
import { PowerSource } from './components/Simulator/models/PowerSource.jsx';

const CircuitoUnaMalla = ({ preview = false }) => {
  const S_RES = preview ? 0.25 : 0.5;
  const S_PWR = preview ? 0.25 : 0.5;

  const pwrX = preview ? 5  : 20;
  const pwrY = preview ? 30 : 80;

  const vccPunta = { x: pwrX + 575 * S_PWR, y: pwrY + 68 * S_PWR };
  const gndPunta = { x: pwrX + 585 * S_PWR, y: pwrY + 220 * S_PWR };

  const commonY = vccPunta.y;

  const r1X = vccPunta.x + 100 * S_RES;
  const r2X = r1X + 250 * S_RES;
  const r3X = r2X + 250 * S_RES;

  const bridge1 = { start: r1X + 100 * S_RES, end: r2X - 100 * S_RES };
  const bridge2 = { start: r2X + 100 * S_RES, end: r3X - 100 * S_RES };
  const finalPin = r3X + 100 * S_RES;

  const W  = preview ? 480 : 900;
  const H  = preview ? 160 : 280;

  return (
    <svg
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ background: '#f5f5f5', borderRadius: 8 }}
    >
      <PowerSource
        x={pwrX} y={pwrY} scale={S_PWR}
        componentId="uma-pwr1"
        initialValue={12}
      />

      <Resistor
        x={r1X} y={commonY} scale={S_RES}
        componentId="uma-r1"
        initialValue={1000}
      />
      <Resistor
        x={r2X} y={commonY} scale={S_RES}
        componentId="uma-r2"
        initialValue={2200}
      />
      <Resistor
        x={r3X} y={commonY} scale={S_RES}
        componentId="uma-r3"
        initialValue={3300}
      />

      <line x1={bridge1.start} y1={commonY} x2={bridge1.end} y2={commonY}
        stroke="#777" strokeWidth={preview ? 2 : 4} strokeLinecap="round" />
      <line x1={bridge2.start} y1={commonY} x2={bridge2.end} y2={commonY}
        stroke="#777" strokeWidth={preview ? 2 : 4} strokeLinecap="round" />

      <path
        d={`M ${finalPin} ${commonY} L ${finalPin + 30} ${commonY} L ${finalPin + 30} ${gndPunta.y} L ${gndPunta.x} ${gndPunta.y}`}
        fill="none" stroke="#333" strokeWidth={preview ? 2 : 4}
        strokeLinecap="round" strokeLinejoin="round"
      />
      <line
        x1={vccPunta.x} y1={vccPunta.y}
        x2={r1X - 100 * S_RES} y2={commonY}
        stroke="#cc1111" strokeWidth={preview ? 2 : 4} strokeLinecap="round"
      />
    </svg>
  );
};

export default CircuitoUnaMalla;
