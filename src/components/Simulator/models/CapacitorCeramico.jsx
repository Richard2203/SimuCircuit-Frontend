// CapacitorCeramico.jsx — Capacitor cerámico de disco, no polarizado.
// Vista frontal: cuerpo en forma de "lágrima" o "disco" cobre/dorado, con
// el código numérico (3 dígitos del cap) impreso encima, y dos patas
// verticales (una arriba, otra abajo) sin distinción de polaridad.
//
// Convención de pines (en local-space, antes de aplicar rotation):
//   pinA en  (0, pinDistTop)    ← terminal superior (arriba del cuerpo)
//   pinB en  (0, pinDistBot)    ← terminal inferior (abajo del cuerpo)
// Esto es consistente con un componente bipolar vertical clásico, lo que
// hace que el cap se conecte naturalmente entre dos buses horizontales.
import { useState } from 'react';
import { COMPONENT_SCALE } from '../ConfigComponents/circuitConfig.js';
import { ComponentValueLabel, formatValue } from './ComponentValueLabel.jsx';
import { useComponentValue } from '../../../hooks/useComponentValue.js';

/**
 * Convierte un valor de capacitancia en Faradios al código de 3 dígitos
 * que se imprime en capacitores cerámicos: pp(M) donde pp son dos cifras
 * significativas y M es el multiplicador en pF. Por ejemplo:
 *   1nF = 1000pF → "102" (10 × 10^2)
 *   100pF       → "101"
 *   10nF        → "103"
 *   470nF       → "474"
 */
function toCeramicCode(faradios) {
  if (!faradios || faradios <= 0) return '000';
  const pf = faradios * 1e12; // a picoFaradios
  // Normalizamos: pf = base × 10^exp con base entre 10 y 99
  let exp = Math.floor(Math.log10(pf)) - 1;
  let base = Math.round(pf / Math.pow(10, exp));
  // Si por redondeo nos pasamos a 100, normalizamos
  if (base >= 100) {
    base = Math.round(base / 10);
    exp += 1;
  }
  if (base < 10) {
    base *= 10;
    exp -= 1;
  }
  // base de 2 dígitos, exp como un dígito (clamp 0-9)
  const expStr = Math.max(0, Math.min(9, exp));
  return `${base}${expStr}`;
}

export const CapacitorCeramico = ({
  nodeA = 'a',
  nodeB = 'b',
  x = 0,
  y = 0,
  scale = COMPONENT_SCALE.capacitor,
  rotation = 0,
  componentId,
  initialValue = 1e-9, // 1 nF default = 102
  onValueChange,
}) => {
  const id = componentId || `capceramico-${x}-${y}`;
  const [value, setValue] = useComponentValue(id, initialValue);
  const [hovered, setHovered] = useState(false);

  // Geometría base (en local-space, antes de scale)
  const bodyW       = 70;       // ancho del "disco/blob" cerámico
  const bodyH       = 78;       // alto, ligeramente alargado
  const pinLen      = 38;       // largo de cada pata visible
  const bodyTopY    = -bodyH * 0.55; // donde empieza el cuerpo (arriba)
  const bodyBotY    =  bodyH * 0.30; // donde termina el cuerpo (parte baja)
  // Pines orientados como bipolar tradicional: uno arriba, otro abajo, en x=0.
  // Cuando rotación = 90, pasan a estar a izquierda/derecha del cuerpo.
  const pinDistTop  = bodyTopY - pinLen;        // pin A (arriba)
  const pinDistBot  = bodyBotY + pinLen;        // pin B (abajo)

  // Pines en world-space (rotPt aplica rotación + escala)
  const rotPt = (dx, dy) => {
    const r = (rotation * Math.PI) / 180;
    const c = Math.cos(r), s = Math.sin(r);
    return { x: x + (dx * c - dy * s) * scale, y: y + (dx * s + dy * c) * scale };
  };
  const pinA = rotPt(0, pinDistTop);
  const pinB = rotPt(0, pinDistBot);

  const handleValueChange = (v) => { setValue(v); onValueChange?.(v); };

  // Código cerámico (ej. "102" para 1nF) — se muestra en grande en el cuerpo
  const code = toCeramicCode(value);

  // Path del cuerpo: forma de "blob" / lágrima invertida con el cuello abajo.
  // Clave: arco superior amplio, ligero estrechamiento donde nacen las patas.
  // (M = top-left, curva por arriba a top-right, baja con curva al cuello)
  const bodyPath = `
    M ${-bodyW * 0.45},${bodyTopY * 0.4}
    C ${-bodyW * 0.55},${bodyTopY}
      ${ bodyW * 0.55},${bodyTopY}
      ${ bodyW * 0.45},${bodyTopY * 0.4}
    C ${ bodyW * 0.50},${bodyBotY * 0.5}
      ${ bodyW * 0.30},${bodyBotY}
      ${ bodyW * 0.18},${bodyBotY}
    L ${-bodyW * 0.18},${bodyBotY}
    C ${-bodyW * 0.30},${bodyBotY}
      ${-bodyW * 0.50},${bodyBotY * 0.5}
      ${-bodyW * 0.45},${bodyTopY * 0.4}
    Z
  `;

  return (
    <g
      data-node-a={nodeA}
      data-node-b={nodeB}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <defs>
        {/* Cerámica color cobre/ámbar — gradiente radial cenital */}
        <radialGradient id={`${id}-ceramic`} cx="50%" cy="35%" r="70%">
          <stop offset="0%"   stopColor="#f5c97a"/>
          <stop offset="40%"  stopColor="#c97a3a"/>
          <stop offset="100%" stopColor="#5a2e10"/>
        </radialGradient>
        {/* Brillo especular en la parte superior del disco */}
        <radialGradient id={`${id}-shine`} cx="35%" cy="25%" r="35%">
          <stop offset="0%"   stopColor="rgba(255,240,210,0.7)"/>
          <stop offset="100%" stopColor="rgba(255,240,210,0)"/>
        </radialGradient>
        {/* Pines metálicos */}
        <linearGradient id={`${id}-pin`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#777"/>
          <stop offset="50%"  stopColor="#e0e0e0"/>
          <stop offset="100%" stopColor="#777"/>
        </linearGradient>
      </defs>

      <g transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scale})`}>
        {/* Glow al hover */}
        {hovered && (
          <ellipse cx="0" cy={bodyTopY * 0.2} rx={bodyW * 0.55} ry={bodyH * 0.5}
            fill="none" stroke="rgba(201,122,58,0.55)" strokeWidth="6"
            style={{ pointerEvents: 'none' }}/>
        )}

        {/* Sombra de base */}
        <ellipse cx="0" cy={bodyBotY + 4} rx={bodyW * 0.35} ry={4}
          fill="rgba(0,0,0,0.4)" style={{ pointerEvents: 'none' }}/>

        {/* Patas: dos cilindros metálicos, uno arriba y otro abajo del cuerpo */}
        <rect x={-1.5} y={pinDistTop} width="3" height={Math.abs(pinDistTop - bodyTopY) + 4} rx="1"
          fill={`url(#${id}-pin)`}/>
        <rect x={-1.5} y={bodyBotY - 2} width="3" height={pinLen + 4} rx="1"
          fill={`url(#${id}-pin)`}/>

        {/* Cuerpo cerámico (blob principal) */}
        <path d={bodyPath} fill={`url(#${id}-ceramic)`}
          stroke="#3a1f08" strokeWidth="1" strokeLinejoin="round"/>

        {/* Brillo especular */}
        <path d={bodyPath} fill={`url(#${id}-shine)`}
          style={{ pointerEvents: 'none' }}/>

        {/* Código cerámico — texto grande negro centrado */}
        <text x="0" y={bodyTopY * 0.05}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={bodyH * 0.32} fontWeight="700"
          fontFamily="'Arial Black', Arial, sans-serif"
          fill="#1a0d05"
          style={{ pointerEvents: 'none' }}>
          {code}
        </text>

        {/* Etiqueta del valor (Faradios SI) — abajo, contra-rotada */}
        <ComponentValueLabel
          componentId={id}
          type="capacitor"
          value={value}
          onChange={handleValueChange}
          x={0}
          y={pinDistBot + 14}
          textAnchor="middle"
          fontSize={14 / scale}
          fill="#c97a3a"
          rotate={-rotation}
        />
      </g>

      {/* Hitboxes para conectores en world-space */}
      <circle cx={pinA.x} cy={pinA.y} r="5" fill="transparent" data-pin="a"/>
      <circle cx={pinB.x} cy={pinB.y} r="5" fill="transparent" data-pin="b"/>
    </g>
  );
};
