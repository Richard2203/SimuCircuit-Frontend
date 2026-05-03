import { useState, useMemo } from 'react';
import { COMPONENT_SCALE } from '../ConfigComponents/circuitConfig.js';
import { useComponentValue } from '../../../hooks/useComponentValue.js';

/** Catalogo de colores LED disponibles. */
export const LED_COLORS = [
  { value: 'ROJO',     label: 'Rojo',     vf: 1.8, lensOff: '#5e1a1a', lensOn: '#ff4040', lensRim: '#3a0e0e', lensBase: '#7a1a1a', emit: '#ff5050' },
  { value: 'VERDE',    label: 'Verde',    vf: 2.2, lensOff: '#1f5e2a', lensOn: '#3eff5a', lensRim: '#0f3015', lensBase: '#246b30', emit: '#5aff75' },
  { value: 'AMARILLO', label: 'Amarillo', vf: 2.1, lensOff: '#5e521a', lensOn: '#ffe040', lensRim: '#322a0e', lensBase: '#6e612a', emit: '#ffe858' },
  { value: 'AZUL',     label: 'Azul',     vf: 3.2, lensOff: '#1f2c5e', lensOn: '#4d7eff', lensRim: '#0e1730', lensBase: '#243869', emit: '#5e8cff' },
  { value: 'BLANCO',   label: 'Blanco',   vf: 3.0, lensOff: '#7a7a7a', lensOn: '#ffffff', lensRim: '#3e3e3e', lensBase: '#aaaaaa', emit: '#ffffff' },
  { value: 'NARANJA',  label: 'Naranja',  vf: 2.0, lensOff: '#5e3a1a', lensOn: '#ff9020', lensRim: '#311c0a', lensBase: '#6f4520', emit: '#ffb050' }
];

function getColorByValue(v) {
  if (!v) return LED_COLORS[1];
  const upper = String(v).trim().toUpperCase();
  return LED_COLORS.find((c) => c.value === upper) || LED_COLORS[1];
}

/**
 * LED — modelo SVG con auto-rotacion interna.
 *
 * Layout en coords locales (centradas en x,y, antes de la rotacion):
 *   • Centro del lente:    (0, 0)
 *   • Pin ANODO  (larga):  (-15, +95)  → izquierda-abajo
 *   • Pin CATODO (corta):  (+18, +95)  → derecha-abajo
 *
 */
export const LED = ({
  nodeA = 'anodo1',
  nodeB = 'catodo1',
  x = 0,
  y = 0,
  rotation = 0,           // ← rotaciON en grados
  scale = COMPONENT_SCALE.led,
  componentId,
  initialColor = 'VERDE',
  energized = false,
  onValueChange,
}) => {
  const id = componentId || `led-${x}-${y}`;
  const [colorValue, setColorValue] = useComponentValue(id, initialColor);
  const [hovered, setHovered]       = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const color = useMemo(() => getColorByValue(colorValue), [colorValue]);

  /**
   * Calcula la posiciOn ABSOLUTA de un punto local (dx_local, dy_local)
   * despuEs de aplicar scale y rotation alrededor del ancla (x, y).
   */
  function localToAbsolute(dxLocal, dyLocal) {
    const dxScaled = dxLocal * scale;
    const dyScaled = dyLocal * scale;
    const r   = (rotation * Math.PI) / 180;
    const cos = Math.cos(r), sin = Math.sin(r);
    return {
      x: x + dxScaled * cos - dyScaled * sin,
      y: y + dxScaled * sin + dyScaled * cos,
    };
  }

  // Pines en coordenadas SVG absolutas (idEnticas a getPins() del NetlistRenderer)
  const pinAnodo  = localToAbsolute(-15, 95);
  const pinCatodo = localToAbsolute( 18, 95);

  const handleColorChange = (newColor) => {
    setColorValue(newColor);
    onValueChange?.(newColor);
    setPickerOpen(false);
  };

  const glowId = `led-glow-${id}`;

  // El transform interno hace todo: translate al ancla, rotar, y escalar.
  // El padre debe pasar un <g> SIN transform.
  const innerTransform = `translate(${x}, ${y}) rotate(${rotation}) scale(${scale})`;

  return (
    <g
      data-node-a={nodeA}
      data-node-b={nodeB}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {energized && (
        <defs>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      )}

      <g transform={innerTransform}>
        {hovered && (
          <rect x="-35" y="-20" width="80" height="120" rx="8"
            fill="none" stroke="rgba(97,218,251,0.3)" strokeWidth={4/scale}
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Halo externo (energizado)  */}
        {energized && (
          <>
            <circle cx="0" cy="13" r="42"
              fill={color.emit} opacity="0.20"
              style={{ filter: `url(#${glowId})` }}/>
            <circle cx="0" cy="13" r="34"
              fill={color.emit} opacity="0.30"/>
          </>
        )}

        {/*
          Pata LARGA (ANODO +) — izquierda, recta, termina en y=95 (donde esta el pin).
          El segmento empieza en y=18 (debajo del lente) y llega hasta y=95.
        */}
        <path d="M -15,18 V 95"
          fill="none" stroke="#9f9f9f" strokeWidth="6"
          strokeLinecap="round"/>

        {/*
          Pata CORTA (CATODO −) — derecha, con doble codo decorativo, termina en y=95.
        */}
        <path d="M 18,18 V 60 Q 18,65 21,68 L 23,70 Q 18,75 18,80 V 95"
          fill="none" stroke="#9f9f9f" strokeWidth="6"
          strokeLinecap="round" strokeLinejoin="round"/>

        {/* Borde del lente */}
        <path d="M -30,15 V 18 A 30,6.5 0 0 0 30,18 V 15"
          fill={color.lensRim}/>
        <ellipse cx="0" cy="15" rx="30" ry="6.5"
          fill={color.lensBase}/>

        {/* Cuerpo del lente  */}
        <path d="M -30,15 V -42 A 30,30 0 0 1 30,-42 V 15 Z"
          fill={energized ? color.lensOn : color.lensOff}
          style={{ transition: 'fill 0.4s ease' }}/>

        {/* Reflejo interno cuando enciende */}
        {energized && (
          <ellipse cx="-8" cy="-25" rx="6" ry="14"
            fill="rgba(255,255,255,0.55)" />
        )}

        {/* Nucleo brillante interior. */}
        {energized && (
          <circle cx="0" cy="-15" r="22"
            fill={color.emit} opacity="0.6"/>
        )}

        {/*
          Etiqueta de color y picker — usar contra-rotacion para que el texto
          siempre se vea horizontal aunque el LED este rotado.
        */}
        <g transform={`rotate(${-rotation})`}>
          <text
            x={38} y={-10}
            fontSize={14/scale}
            fill="#aaa"
            textAnchor="start"
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={(e) => { e.stopPropagation(); setPickerOpen((p) => !p); }}
          >
            {color.label}
          </text>

          {pickerOpen && (
            <foreignObject
              x={38} y={0}
              width={120/scale} height={(LED_COLORS.length * 26 + 8)/scale}
              style={{ overflow: 'visible' }}
            >
              <div
                xmlns="http://www.w3.org/1999/xhtml"
                style={{
                  background: 'var(--surface, #1a1a1a)',
                  border: '1px solid var(--border, #333)',
                  borderRadius: 6,
                  padding: 4,
                  fontSize: 12,
                  fontFamily: 'system-ui, sans-serif',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  width: 120,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {LED_COLORS.map((c) => (
                  <div
                    key={c.value}
                    onClick={() => handleColorChange(c.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 6px',
                      cursor: 'pointer',
                      borderRadius: 3,
                      background: c.value === colorValue ? 'rgba(108,99,255,0.15)' : 'transparent',
                      color: c.value === colorValue ? 'var(--accent, #6c63ff)' : 'var(--text, #ddd)',
                    }}
                    onMouseEnter={(e) => { if (c.value !== colorValue) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={(e) => { if (c.value !== colorValue) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{
                      display: 'inline-block', width: 12, height: 12, borderRadius: '50%',
                      background: c.lensOn, border: '1px solid rgba(255,255,255,0.2)',
                    }}/>
                    {c.label}
                  </div>
                ))}
              </div>
            </foreignObject>
          )}
        </g>
      </g>

      {/* Marcadores invisibles de pines en coords absolutas */}
      <circle cx={pinAnodo.x}  cy={pinAnodo.y}  r="4" fill="transparent" data-pin="a"/>
      <circle cx={pinCatodo.x} cy={pinCatodo.y} r="4" fill="transparent" data-pin="b"/>
    </g>
  );
};