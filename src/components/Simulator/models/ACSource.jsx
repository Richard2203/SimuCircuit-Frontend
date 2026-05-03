// ACSource.jsx — Fuente de voltaje de corriente alterna senoidal.
// Símbolo electrico estandar: círculo con una onda senoidal en su interior.
//
// Convencion de pines (en local-space, antes de aplicar rotation):
//   pin 'pos' a la DERECHA del circulo (terminal +)
//   pin 'neg' a la IZQUIERDA del círculo (terminal −, identificado
//   con un cable rojo corto saliendo desde el cuerpo).
//
import { useState } from 'react';
import { COMPONENT_SCALE } from '../ConfigComponents/circuitConfig.js';
import { ComponentValueLabel } from './ComponentValueLabel.jsx';
import { useComponentValue } from '../../../hooks/useComponentValue.js';

export const ACSource = ({
  nodePos = 'pos',
  nodeNeg = 'neg',
  x = 0,
  y = 0,
  scale = COMPONENT_SCALE.powerSource,
  rotation = 0,
  componentId,
  initialValue = 5,            // 5V default
  frequency   = 60,            // 60 Hz default
  onValueChange,
}) => {
  const id = componentId || `acsource-${x}-${y}`;
  const [value, setValue] = useComponentValue(id, initialValue);
  const [hovered, setHovered] = useState(false);

  // Geometria base (en local-space, antes de scale)
  const R       = 60;        // radio del círculo
  const armLen  = 78;        // longitud del cable que sale a cada lado
  const pinDist = R + armLen;  // distancia x desde el centro hasta cada pin

  // Pines en world-space (rotPt aplica rotación + escala)
  const rotPt = (dx, dy) => {
    const r = (rotation * Math.PI) / 180;
    const c = Math.cos(r), s = Math.sin(r);
    return { x: x + (dx * c - dy * s) * scale, y: y + (dx * s + dy * c) * scale };
  };
  const pinPos = rotPt( pinDist, 0);   // a la derecha
  const pinNeg = rotPt(-pinDist, 0);   // a la izquierda

  const handleValueChange = (v) => { setValue(v); onValueChange?.(v); };

  // Onda senoidal dentro del circulo: 1.5 ciclos de seno, escalado al ~70% del radio
  // Usa 24 puntos para que sea suave.
  const wavePts = [];
  const waveW = R * 1.4;
  const waveH = R * 0.5;
  const cycles = 1.5;
  const N = 32;
  for (let i = 0; i <= N; i++) {
    const tx = (i / N - 0.5) * waveW;
    const ty = -Math.sin((i / N) * cycles * 2 * Math.PI) * waveH;
    wavePts.push(`${tx.toFixed(2)},${ty.toFixed(2)}`);
  }
  const wavePath = `M ${wavePts.join(' L ')}`;

  return (
    <g
      data-node-pos={nodePos}
      data-node-neg={nodeNeg}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <defs>
        {/* Cuerpo metalico oscuro con sombreado radial (para dar volumen) */}
        <radialGradient id={`${id}-body`} cx="50%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#3a4555"/>
          <stop offset="50%"  stopColor="#1f2935"/>
          <stop offset="100%" stopColor="#0d141d"/>
        </radialGradient>
        {/* Brillo especular */}
        <radialGradient id={`${id}-shine`} cx="40%" cy="25%" r="35%">
          <stop offset="0%"   stopColor="rgba(180,210,255,0.45)"/>
          <stop offset="100%" stopColor="rgba(180,210,255,0)"/>
        </radialGradient>
        {/* Cables metalicos */}
        <linearGradient id={`${id}-pin`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#888"/>
          <stop offset="50%"  stopColor="#ddd"/>
          <stop offset="100%" stopColor="#888"/>
        </linearGradient>
      </defs>

      <g transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scale})`}>
        {/* Glow al hover */}
        {hovered && (
          <circle cx="0" cy="0" r={R + 8}
            fill="none" stroke="rgba(64,156,255,0.55)" strokeWidth="6"
            style={{ pointerEvents: 'none' }}/>
        )}

        {/* Sombra de base bajo el circulo */}
        <ellipse cx="0" cy={R + 6} rx={R * 0.85} ry={R * 0.12}
          fill="rgba(0,0,0,0.4)" style={{ pointerEvents: 'none' }}/>

        {/* Cables a izquierda y derecha (gris metalico) */}
        <rect x={-pinDist} y={-3} width={armLen + 6} height={6} rx={2}
          fill={`url(#${id}-pin)`}/>
        {/* Cable rojo del lado positivo (derecha) — convención visual */}
        <rect x={R - 2} y={-2.5} width={armLen * 0.45} height={5} rx={1.5}
          fill="#d32d2d" opacity="0.9"/>
        <rect x={R - 2 + armLen * 0.45} y={-3} width={armLen * 0.55 + 8}
          height={6} rx={2} fill={`url(#${id}-pin)`}/>

        {/* Cuerpo del círculo */}
        <circle cx="0" cy="0" r={R}
          fill={`url(#${id}-body)`}
          stroke="#0a0e14" strokeWidth="2"/>

        {/* Brillo especular */}
        <circle cx="0" cy="0" r={R} fill={`url(#${id}-shine)`}
          style={{ pointerEvents: 'none' }}/>

        {/* Onda senoidal — el simbolo del AC */}
        <path d={wavePath} fill="none" stroke="#5fb3ff" strokeWidth="3"
          strokeLinecap="round" strokeLinejoin="round"/>

        {/* Glow tenue alrededor de la onda (efecto "luz") */}
        <path d={wavePath} fill="none" stroke="#5fb3ff" strokeWidth="6"
          strokeLinecap="round" strokeLinejoin="round" opacity="0.25"
          style={{ pointerEvents: 'none', filter: 'blur(2px)' }}/>

        {/* Marca "+" tenue arriba a la derecha (interior del circulo) */}
        <text x={R * 0.55} y={-R * 0.55}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={R * 0.26} fontWeight="700"
          fontFamily="sans-serif" fill="#7eb9ff"
          opacity="0.7"
          style={{ pointerEvents: 'none' }}>~</text>

        {/* Etiqueta del valor (Voltios) — abajo */}
        <ComponentValueLabel
          componentId={id}
          type="voltageSource"
          value={value}
          onChange={handleValueChange}
          x={0}
          y={R + 24}
          textAnchor="middle"
          fontSize={14 / scale}
          fill="#5fb3ff"
          rotate={-rotation}
        />

        {/* Etiqueta de frecuencia, debajo del valor */}
        <text x="0" y={R + 44}
          textAnchor="middle" fontSize={12 / scale} fill="#7c8d9e"
          fontFamily="monospace"
          transform={`rotate(${-rotation} 0 ${R + 44})`}
          style={{ pointerEvents: 'none' }}>
          {frequency}Hz
        </text>
      </g>

      {/* Hitboxes para conectores en world-space */}
      <circle cx={pinPos.x} cy={pinPos.y} r="5" fill="transparent" data-pin="pos"/>
      <circle cx={pinNeg.x} cy={pinNeg.y} r="5" fill="transparent" data-pin="neg"/>
    </g>
  );
};
