import { useState, useRef, useCallback, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { COMPONENT_SCALE } from '../ConfigComponents/circuitConfig.js';
import { ComponentValueLabel } from './ComponentValueLabel.jsx';
import { useComponentValue } from '../../../hooks/useComponentValue.js';
import { CircuitEditContext } from '../../../core/CircuitEditContext.jsx';
import eventBus from '../../../core/EventBus';

/* Constantes del dial */
const START_DEG = 210;
const RANGE_DEG = 300;



/* Inyeccion de estilos del slider */
let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  stylesInjected = true;
  const s = document.createElement('style');
  s.textContent = `
    .pot-range {
      -webkit-appearance: none; appearance: none;
      width: 100%; height: 8px; border-radius: 4px; outline: none;
      cursor: ew-resize; background: transparent;
    }
    .pot-range::-webkit-slider-runnable-track {
      height: 8px; border-radius: 4px;
      background: linear-gradient(90deg, #6c63ff var(--p,0%), #252830 var(--p,0%));
    }
    .pot-range::-moz-range-track {
      height: 8px; border-radius: 4px; background: #252830;
    }
    .pot-range::-moz-range-progress {
      height: 8px; border-radius: 4px; background: #6c63ff;
    }
    .pot-range::-webkit-slider-thumb {
      -webkit-appearance: none; margin-top: -6px;
      width: 20px; height: 20px; border-radius: 50%;
      background: #6c63ff; border: 2px solid #a78bfa;
      box-shadow: 0 0 8px rgba(108,99,255,0.8); cursor: grab;
    }
    .pot-range::-moz-range-thumb {
      width: 20px; height: 20px; border-radius: 50%;
      background: #6c63ff; border: 2px solid #a78bfa; cursor: grab;
    }
    .pot-range:active::-webkit-slider-thumb { cursor: grabbing; }
  `;
  document.head.appendChild(s);
}

/* Helpers*/

/** Pct [0-1] del valor dentro del rango. Evita division por cero. */
const toPct = (val, min, max) => (max > min ? (val - min) / (max - min) : 0);

/** Formatea un valor de resistencia a string legible. */
const formatResistance = (v) =>
  v >= 1000 ? `${parseFloat((v / 1000).toPrecision(3))}kΩ` : `${v}Ω`;

/* Componente*/

export const Potentiometer = ({
  nodeA = 'node1',
  nodeB = 'node2',
  nodeW = 'nodeW',
  x = 0,
  y = 0,
  orientation = 'horizontal',
  scale = COMPONENT_SCALE.resistor,
  componentId,
  initialValue = 10000,
  minValue = 0,
  maxValue = null,
  onValueChange,
}) => {
  const id     = componentId || `pot-${x}-${y}`;
  const minVal = minValue;

  /**
   * maxVal se fija en el primer render y no cambia cuando initialValue
   * se actualiza por commits del slider (mediator -> re-render).
   * Esto funciona porque CircuitSVG memoiza netlistJSON con useMemo,
   * evitando remounts innecesarios del componente.
   * Solo setMaxVal (llamado desde el label) puede modificarlo.
   */
  const [maxVal, setMaxVal] = useState(() => maxValue ?? initialValue);

  injectStyles();

  /* Estado */

  /**
   * "value" (del hook) = valor comprometido en el Mediator/EventBus.
   *   Se actualiza solo al soltar el slider (onPointerUp).
   *
   * "liveVal" = valor local solo para feedback visual durante el drag.
   *   Evita que cada movimiento del slider dispare un re-render global.
   *   No toca mediator ni eventBus mientras el usuario arrastra.
   */
  const [value, setValue] = useComponentValue(id, initialValue);
  const [liveVal, setLiveVal] = useState(initialValue);

  // Sincronizar liveVal cuando value cambia por fuentes externas
  // (eventBus, carga inicial, etc.). La condicion evita sobreescribir
  // durante un drag activo (isDraggingRef).
  const isDraggingRef = useRef(false);
  useEffect(() => {
    if (!isDraggingRef.current) setLiveVal(value);
  }, [value]);

  const [open,    setOpen]    = useState(false);
  const [hovered, setHov]     = useState(false);
  const [pos,     setPos]     = useState({ top: 0, left: 0, width: 0 });

  const dialRef = useRef(null);
  const { locked } = useContext(CircuitEditContext);

  /* Geometria del dial */
  const rotate     = orientation === 'vertical' ? 90 : 0;
  const R          = 28;   // radio exterior del cuerpo
  const Ri         = 22;   // radio interior del dial giratorio
  const Rs         = 9;    // radio del tornillo central
  const pinLen     = 38;
  const pinSpacing = 14;

  // Posicion de la muesca del dial (usa liveVal para feedback inmediato)
  const pct       = toPct(liveVal, minVal, maxVal);
  const notchDeg  = START_DEG + pct * RANGE_DEG;
  const notchRad  = (notchDeg * Math.PI) / 180;
  const notchOuter = { x: Math.cos(notchRad) * Rs,       y: Math.sin(notchRad) * Rs };
  const notchInner = { x: Math.cos(notchRad) * (Rs - 7), y: Math.sin(notchRad) * (Rs - 7) };

  const pins = [
    { key: 'a', lx: -pinSpacing, ly: R },
    { key: 'w', lx: 0,           ly: R },
    { key: 'b', lx: pinSpacing,  ly: R },
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
  const pinW = localToWorld(0,           R + pinLen);

  /* Popup: posicion y logica*/

  const calcPos = useCallback(() => {
    if (!dialRef.current) return null;
    const rect = dialRef.current.getBoundingClientRect();
    return { top: rect.bottom + 12, left: rect.left + rect.width / 2, width: 220 };
  }, []);

  const openPopup = useCallback((e) => {
    e.stopPropagation();
    if (locked) return;
    const p = calcPos();
    if (!p) return;
    setPos(p);
    setOpen(true);
  }, [locked, calcPos]);

  // Reposicionar popup al hacer scroll o resize
  useEffect(() => {
    if (!open) return;
    const update = () => { const p = calcPos(); if (p) setPos(p); };
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, calcPos]);

  // Cerrar popup al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      const popup = document.getElementById(`pot-popup-${id}`);
      if (
        popup && !popup.contains(e.target) &&
        dialRef.current && !dialRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const t = setTimeout(() => window.addEventListener('pointerdown', close), 60);
    return () => { clearTimeout(t); window.removeEventListener('pointerdown', close); };
  }, [open, id]);

  /* Handlers del slider */

  /**
   * onChange: actualiza SOLO liveVal (estado local, sin mediator, sin eventBus).
   * Esto garantiza que el slider se mueva fluidamente sin disparar re-renders globales.
   */
  const onRangeChange = useCallback((e) => {
    e.stopPropagation();
    const v = Number(e.target.value);
    setLiveVal(v);
    onValueChange?.(v);  // callback opcional en tiempo real
  }, [onValueChange]);

  /**
   * onPointerDown en el slider: marca inicio del drag.
   */
  const onRangePointerDown = useCallback((e) => {
    e.stopPropagation();
    isDraggingRef.current = true;
  }, []);

  /**
   * onPointerUp: commit del valor al hook (-> mediator) y al eventBus.
   * Es el unico momento en que se disparan re-renders globales.
   *
   * cursor_pos (0–100) refleja la posicion real del wiper para que el
   * backend pueda expandir correctamente el potenciometro en dos
   * resistencias en serie: Ra = value * (cursor_pos/100), Rb = value - Ra.
   */
  const onRangeCommit = useCallback((e) => {
    e.stopPropagation();
    isDraggingRef.current = false;
    const v          = Number(e.currentTarget.value);
    const cursorPos  = maxVal > minVal
      ? Math.round(((v - minVal) / (maxVal - minVal)) * 100)
      : 50;
    setValue(v, { cursor_pos: cursorPos, wiper: cursorPos / 100 });
    eventBus.publish('COMPONENT_VALUE_CHANGED', { id, type: 'resistor', value: v });
  }, [setValue, id, minVal, maxVal]);

  // Step dinamico: 256 pasos para suavidad visual
  const step = Math.max(1, Math.round((maxVal - minVal) / 256));

  /* Render */
  return (
    <g
      data-node-a={nodeA} data-node-b={nodeB} data-node-w={nodeW}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <defs>
        <radialGradient id={`${id}-body`} cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#4a6070"/>
          <stop offset="100%" stopColor="#1e2f3a"/>
        </radialGradient>
        <radialGradient id={`${id}-dial`} cx="45%" cy="38%" r="60%">
          <stop offset="0%"   stopColor={open ? '#90c8e8' : '#7aa8c4'}/>
          <stop offset="100%" stopColor={open ? '#5a9fbe' : '#4a7f9e'}/>
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
        {/* Halo de hover/focus */}
        {(hovered || open) && (
          <circle cx="0" cy="0" r={R + 6} fill="none"
            stroke={open ? 'rgba(97,218,251,0.6)' : 'rgba(97,218,251,0.3)'}
            strokeWidth="5" style={{ pointerEvents: 'none' }}/>
        )}

        {/* Pines metelicos */}
        {pins.map(p => (
          <rect key={p.key} x={p.lx - 2} y={p.ly} width="4" height={pinLen} rx="1.5"
            fill={`url(#${id}-pin)`}/>
        ))}

        {/* Cuerpo circular */}
        <circle cx="0" cy="0" r={R} fill={`url(#${id}-body)`}/>
        <circle cx="0" cy="0" r={R} fill="none" stroke="#0d1a22" strokeWidth="1.5"/>

        {/* Tornillos decorativos en las esquinas */}
        {[45, 135, 225, 315].map(d => {
          const r = (d * Math.PI) / 180;
          return (
            <circle key={d}
              cx={Math.cos(r) * (R - 4)} cy={Math.sin(r) * (R - 4)}
              r="2.5" fill="#2a3d4a" stroke="#0d1a22" strokeWidth="0.8"/>
          );
        })}

        {/* Dial giratorio — clickable para abrir popup */}
        <circle ref={dialRef} cx="0" cy="0" r={Ri}
          fill={`url(#${id}-dial)`}
          style={{ cursor: locked ? 'not-allowed' : 'pointer' }}
          onPointerDown={openPopup}/>
        <circle cx="0" cy="0" r={Ri} fill="none" stroke="#2a4555" strokeWidth="1"
          style={{ pointerEvents: 'none' }}/>

        {/* Marcas de graduacion */}
        {Array.from({ length: 31 }).map((_, i) => {
          const deg = START_DEG + (i / 30) * RANGE_DEG;
          const r   = (deg * Math.PI) / 180;
          const maj = i % 5 === 0;
          return (
            <line key={i}
              x1={Math.cos(r) * (Ri - 1)}       y1={Math.sin(r) * (Ri - 1)}
              x2={Math.cos(r) * (maj ? Ri - 6 : Ri - 4)}
              y2={Math.sin(r) * (maj ? Ri - 6 : Ri - 4)}
              stroke="rgba(255,255,255,0.6)"
              strokeWidth={maj ? 1.2 : 0.7} strokeLinecap="round"
              style={{ pointerEvents: 'none' }}/>
          );
        })}

        {/* Tornillo central con muesca indicadora de posicion (usa liveVal -> pct) */}
        <circle cx="0" cy="0" r={Rs} fill={`url(#${id}-screw)`}
          style={{ pointerEvents: 'none' }}/>
        <circle cx="0" cy="0" r={Rs} fill="none" stroke="#0d1a22" strokeWidth="1"
          style={{ pointerEvents: 'none' }}/>
        <line
          x1={notchInner.x} y1={notchInner.y}
          x2={notchOuter.x} y2={notchOuter.y}
          stroke="rgba(255,255,255,0.95)" strokeWidth="2.5" strokeLinecap="round"
          style={{ pointerEvents: 'none' }}/>

        {/* Etiqueta de valor comprometido bajo el componente */}
        <ComponentValueLabel
          componentId={id} type="resistor" value={value}
          onChange={(v) => {
            // Al editar el label el usuario escribe un nuevo valor total.
            // El cursor queda en la posicion porcentual equivalente al liveVal actual
            // dentro del nuevo rango, para no descuadrar la posición visual del dial.
            const newMax     = Math.max(v, maxVal);
            const cursorPos  = newMax > minVal
              ? Math.round(((liveVal - minVal) / (newMax - minVal)) * 100)
              : 50;
            setValue(v, { cursor_pos: Math.max(0, Math.min(100, cursorPos)), wiper: Math.max(0, Math.min(100, cursorPos)) / 100 });
            setLiveVal(v);
            if (v > maxVal) setMaxVal(v);
            onValueChange?.(v);
            eventBus.publish('COMPONENT_VALUE_CHANGED', { id, type: 'resistor', value: v });
          }}
          x={0} y={R + pinLen + 14} textAnchor="middle"
          fontSize={14 / scale} fill="#aaa" rotate={-rotate}
        />
      </g>

      {/* Hotspots de pines (transparentes, para conexiones) */}
      <circle cx={pinA.x} cy={pinA.y} r="5" fill="transparent" data-pin="a"/>
      <circle cx={pinW.x} cy={pinW.y} r="5" fill="transparent" data-pin="b"/>
      <circle cx={pinB.x} cy={pinB.y} r="5" fill="transparent" data-pin="w"/>

      {/* Popup de ajuste fino */}
      {open && createPortal(
        <div
          id={`pot-popup-${id}`}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position:     'fixed',
            top:          pos.top,
            left:         pos.left,
            transform:    'translateX(-50%)',
            width:        pos.width,
            background:   '#1e2028',
            border:       '1.5px solid #6c63ff',
            borderRadius: 10,
            padding:      '12px 16px',
            boxShadow:    '0 8px 32px rgba(0,0,0,0.8)',
            zIndex:       100000,
            userSelect:   'none',
            fontFamily:   'monospace',
          }}
        >
          {/* Fila: min · valor actual (liveVal para feedback inmediato) · max */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#5a6278' }}>{formatResistance(minVal)}</span>
            <span style={{ fontSize: 13, color: '#61dafb', fontWeight: 700 }}>
              {formatResistance(liveVal)}
            </span>
            <span style={{ fontSize: 10, color: '#5a6278' }}>{formatResistance(maxVal)}</span>
          </div>

          <input
            type="range"
            className="pot-range"
            min={minVal}
            max={maxVal}
            step={step}
            value={liveVal}
            onChange={onRangeChange}
            onPointerDown={onRangePointerDown}
            onPointerUp={onRangeCommit}
            // Fallback para entornos sin Pointer Events
            onMouseUp={onRangeCommit}
            style={{ '--p': `${pct * 100}%` }}
          />

          <p style={{ margin: '8px 0 0', fontSize: 10, color: '#4a4f5e', textAlign: 'center' }}>
            Arrastra para ajustar · Clic fuera para cerrar
          </p>
        </div>,
        document.body
      )}
    </g>
  );
};
