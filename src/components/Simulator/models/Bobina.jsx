import { useState } from 'react';
import { COMPONENT_SCALE } from '../ConfigComponents/circuitConfig.js';
import { ComponentValueLabel } from './ComponentValueLabel.jsx';
import { useComponentValue } from '../../../hooks/useComponentValue.js';

/**
 * Construye N vueltas de cobre alrededor del aro toroidal visto de frente.
 * Cada vuelta es un arco curvo radial corto que va del borde exterior al
 * borde interior del aro.
 *
 * @param {number} rOuter  radio exterior del toroide
 * @param {number} rInner  radio interior (agujero)
 * @param {number} turns   numero de vueltas
 * @returns {Array<{path:string, angle:number}>}
 */
function buildWindings(rOuter, rInner, turns) {
  const segments = [];
  for (let i = 0; i < turns; i++) {
    const a = (i / turns) * Math.PI * 2;
    // Punto exterior (en el borde de afuera del toro)
    const ex = Math.cos(a) * rOuter;
    const ey = Math.sin(a) * rOuter;
    // Punto interior (en el borde del agujero)
    const ix = Math.cos(a) * rInner;
    const iy = Math.sin(a) * rInner;
    // Punto de control para curvar la vuelta tangencialmente, dandole volumen.
    // Lo desplazamos perpendicular al radio (sentido tangente) un poco.
    const tx = -Math.sin(a);  // tangente unitaria
    const ty =  Math.cos(a);
    const mid = (rOuter + rInner) / 2;
    const cx  = Math.cos(a) * mid + tx * 4;
    const cy  = Math.sin(a) * mid + ty * 4;
    segments.push({
      path: `M ${ex.toFixed(2)},${ey.toFixed(2)} Q ${cx.toFixed(2)},${cy.toFixed(2)} ${ix.toFixed(2)},${iy.toFixed(2)}`,
      angle: a,
    });
  }
  return segments;
}

export const Bobina = ({
  nodeA = 'a',
  nodeB = 'b',
  x = 0,
  y = 0,
  scale = COMPONENT_SCALE.bobina,
  rotation = 0,
  componentId,
  initialValue = 0.001, // 1 mH default in SI (Henrios)
  onValueChange,
}) => {
  const id = componentId || `bobina-${x}-${y}`;
  const [value, setValue] = useComponentValue(id, initialValue);
  const [hovered, setHovered] = useState(false);

  // Geometria base (en local-space, antes de scale)
  const rOuter      = 56;        // radio exterior del toroide
  const rInner      = 22;        // radio del agujero
  const turns       = 32;        // numero de vueltas de cobre
  const pinSpacing  = 16;        // distancia horizontal entre las dos patas
  const pinLen      = 38;        // longitud de cada pata desde el borde inferior del toro
  const pinDist     = rOuter + pinLen;  // distancia y desde el centro hasta el pin

  // Pines en local-space; rotPt los traslada al mundo.
  const rotPt = (dx, dy) => {
    const r = (rotation * Math.PI) / 180;
    const c = Math.cos(r), s = Math.sin(r);
    return { x: x + (dx * c - dy * s) * scale, y: y + (dx * s + dy * c) * scale };
  };
  const pinA = rotPt(-pinSpacing, pinDist);
  const pinB = rotPt( pinSpacing, pinDist);

  const windings = buildWindings(rOuter, rInner, turns);

  const handleValueChange = (v) => { setValue(v); onValueChange?.(v); };

  return (
    <g
      data-node-a={nodeA}
      data-node-b={nodeB}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <defs>
        {/* Cobre: gradiente de claro arriba a oscuro abajo (luz cenital) */}
        <radialGradient id={`${id}-copper`} cx="50%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#ffd9a8"/>
          <stop offset="40%"  stopColor="#d97a2c"/>
          <stop offset="100%" stopColor="#5a2706"/>
        </radialGradient>
        {/* Sombra del agujero del toroide */}
        <radialGradient id={`${id}-hole`} cx="50%" cy="50%" r="55%">
          <stop offset="0%"   stopColor="#000000"/>
          <stop offset="60%"  stopColor="#1a0f08"/>
          <stop offset="100%" stopColor="#3d2412"/>
        </radialGradient>
        {/* Pines metalicos */}
        <linearGradient id={`${id}-pin`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#666"/>
          <stop offset="50%"  stopColor="#ddd"/>
          <stop offset="100%" stopColor="#666"/>
        </linearGradient>
      </defs>

      <g transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scale})`}>
        {/* Glow de seleccion */}
        {hovered && (
          <circle cx="0" cy="0" r={rOuter + 8}
            fill="none" stroke="rgba(217,122,44,0.45)" strokeWidth="6"
            style={{ pointerEvents: 'none' }}/>
        )}

        {/* Sombra suave en el suelo, debajo del toroide */}
        <ellipse cx="0" cy={rOuter + 6} rx={rOuter * 0.85} ry={rOuter * 0.12}
          fill="rgba(0,0,0,0.35)" style={{ pointerEvents: 'none' }}/>

        {/* Patas: dos cilindros metalicos rectos hacia abajo */}
        <rect x={-pinSpacing - 2} y={rOuter - 4} width="4" height={pinLen + 4} rx="1.5"
          fill={`url(#${id}-pin)`}/>
        <rect x={ pinSpacing - 2} y={rOuter - 4} width="4" height={pinLen + 4} rx="1.5"
          fill={`url(#${id}-pin)`}/>

        {/* Aro base oscuro (el "nucleo" sobre el que se enrolla el cable) */}
        <circle cx="0" cy="0" r={rOuter}
          fill="none" stroke="#2b1808" strokeWidth="2" opacity="0.7"/>

        {/* Vueltas de cobre */}
        <g>
          {windings.map((w, i) => (
            <g key={i}>
              <path d={w.path} stroke={`url(#${id}-copper)`} strokeWidth="6"
                fill="none" strokeLinecap="round"/>
              {/* Highlight central de la vuelta */}
              <path d={w.path} stroke="#ffeacc" strokeWidth="1.4"
                fill="none" strokeLinecap="round" opacity="0.55"/>
            </g>
          ))}
        </g>

        {/* Sombra anular: oscurece el borde interno del aro para profundidad */}
        <circle cx="0" cy="0" r={rInner + 1}
          fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="3"/>

        {/* Agujero central del toroide */}
        <circle cx="0" cy="0" r={rInner}
          fill={`url(#${id}-hole)`}/>

        {/* Reflejo direccional sobre el cobre (luz cenital) */}
        <path
          d={`M ${-rOuter * 0.55},${-rOuter * 0.7} A ${rOuter} ${rOuter} 0 0 1 ${rOuter * 0.55},${-rOuter * 0.7}`}
          stroke="rgba(255,245,224,0.35)" strokeWidth="3" fill="none" strokeLinecap="round"
          style={{ pointerEvents: 'none' }}/>

        {/* Etiqueta del valor (Henrios) — debajo, contra-rotada */}
        <ComponentValueLabel
          componentId={id}
          type="inductor"
          value={value}
          onChange={handleValueChange}
          x={0}
          y={pinDist + 14}
          textAnchor="middle"
          fontSize={14 / scale}
          fill="#d97a2c"
          rotate={-rotation}
        />
      </g>

      {/* Hitboxes para conectores en coords mundiales */}
      <circle cx={pinA.x} cy={pinA.y} r="5" fill="transparent" data-pin="a"/>
      <circle cx={pinB.x} cy={pinB.y} r="5" fill="transparent" data-pin="b"/>
    </g>
  );
};
