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

/* Helpers */
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

const formatResistance = (v) =>
  v >= 1000 ? `${parseFloat((v / 1000).toPrecision(3))}kΩ` : `${v}Ω`;

const formatPct = (w) => `${Math.round(w * 100)}%`;

/* Componente */

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
  initialWiper = 0.5,
  minValue = 0,
  onValueChange,
}) => {
  const id     = componentId || `pot-${x}-${y}`;
  const minVal = minValue;

  injectStyles();

  // Valor nominal del potenciometro — solo lo modifica el label
  const [nominalValue, setNominalValue] = useState(initialValue);

  // Wiper comprometido (-> mediator / eventBus) guardado como float [0-1]
  const [committedWiper, setCommittedWiper] = useComponentValue(
    `${id}-wiper`,
    clamp(initialWiper, 0, 1),
  );
  const [liveWiper, setLiveWiper] = useState(clamp(initialWiper, 0, 1));

  // Sincronizar liveWiper cuando el wiper comprometido cambia externamente
  const isDraggingRef = useRef(false);
  useEffect(() => {
    if (!isDraggingRef.current) setLiveWiper(committedWiper);
  }, [committedWiper]);

  const [open,    setOpen]    = useState(false);
  const [hovered, setHov]     = useState(false);
  const [pos,     setPos]     = useState({ top: 0, left: 0, width: 0 });

  const dialRef = useRef(null);
  const { locked } = useContext(CircuitEditContext);

  /* Geometria del dial */
  const rotate     = orientation === 'vertical' ? 90 : 0;
  const R          = 28;
  const Ri         = 22;
  const Rs         = 9;
  const pinLen     = 38;
  const pinSpacing = 14;

  // Muesca: usa liveWiper para feedback inmediato
  const notchDeg   = START_DEG + liveWiper * RANGE_DEG;
  const notchRad   = (notchDeg * Math.PI) / 180;
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

  /* Popup */
  const calcPos = useCallback(() => {
    if (!dialRef.current) return null;
    const rect = dialRef.current.getBoundingClientRect();
    return { top: rect.bottom + 12, left: rect.left + rect.width / 2, width: 240 };
  }, []);

  const openPopup = useCallback((e) => {
    e.stopPropagation();
    if (locked) return;
    const p = calcPos();
    if (!p) return;
    setPos(p);
    setOpen(true);
  }, [locked, calcPos]);

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

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      const popup = document.getElementById(`pot-popup-${id}`);
      if (
        popup && !popup.contains(e.target) &&
        dialRef.current && !dialRef.current.contains(e.target)
      ) setOpen(false);
    };
    const t = setTimeout(() => window.addEventListener('pointerdown', close), 60);
    return () => { clearTimeout(t); window.removeEventListener('pointerdown', close); };
  }, [open, id]);

  /* Publicar cambios al mediator y eventBus */

  // Solo mueve el wiper;
  const publishWiper = useCallback((w) => {
    const wClamped = clamp(w, 0, 1);
    setCommittedWiper(wClamped);
    eventBus.publish('COMPONENT_VALUE_CHANGED', {
      id,
      type:  'resistencia_variable',
      wiper: wClamped,  // actualiza params.wiper en el backend
    });
  }, [setCommittedWiper, id]);

  // Cambia el valor nominal (desde el label); el wiper permanece igual
  const publishNominal = useCallback((nominal) => {
    setNominalValue(nominal);
    eventBus.publish('COMPONENT_VALUE_CHANGED', {
      id,
      type:  'resistencia_variable',
      value: nominal,         // actualiza netlist[].value en el backend
      wiper: committedWiper,  // params.wiper no cambia
    });
  }, [id, committedWiper]);

  /* Handlers del slider (opera sobre el wiper) */

  // onChange: actualiza SOLO liveWiper — sin mediator, fluido durante el drag
  const onRangeChange = useCallback((e) => {
    e.stopPropagation();
    const w = clamp(Number(e.target.value) / 100, 0, 1);
    setLiveWiper(w);
    onValueChange?.(Math.round(nominalValue * w));
  }, [onValueChange, nominalValue]);

  const onRangePointerDown = useCallback((e) => {
    e.stopPropagation();
    isDraggingRef.current = true;
  }, []);

  // onPointerUp: commit del wiper al mediator/eventBus
  const onRangeCommit = useCallback((e) => {
    e.stopPropagation();
    isDraggingRef.current = false;
    const w = clamp(Number(e.currentTarget.value) / 100, 0, 1);
    setLiveWiper(w);
    publishWiper(w);
  }, [publishWiper]);

  /* Handler del label (opera sobre el valor nominal) */
  const onLabelChange = useCallback((newNominal) => {
    publishNominal(newNominal);
    onValueChange?.(Math.round(newNominal * committedWiper));
  }, [publishNominal, committedWiper, onValueChange]);

  // Resistencia efectiva y slider (entero 0-100)
  const effectiveResistance = Math.round(nominalValue * liveWiper);
  const sliderValue         = Math.round(liveWiper * 100);

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
        {(hovered || open) && (
          <circle cx="0" cy="0" r={R + 6} fill="none"
            stroke={open ? 'rgba(97,218,251,0.6)' : 'rgba(97,218,251,0.3)'}
            strokeWidth="5" style={{ pointerEvents: 'none' }}/>
        )}

        {pins.map(p => (
          <rect key={p.key} x={p.lx - 2} y={p.ly} width="4" height={pinLen} rx="1.5"
            fill={`url(#${id}-pin)`}/>
        ))}

        <circle cx="0" cy="0" r={R} fill={`url(#${id}-body)`}/>
        <circle cx="0" cy="0" r={R} fill="none" stroke="#0d1a22" strokeWidth="1.5"/>

        {[45, 135, 225, 315].map(d => {
          const r = (d * Math.PI) / 180;
          return (
            <circle key={d}
              cx={Math.cos(r) * (R - 4)} cy={Math.sin(r) * (R - 4)}
              r="2.5" fill="#2a3d4a" stroke="#0d1a22" strokeWidth="0.8"/>
          );
        })}

        <circle ref={dialRef} cx="0" cy="0" r={Ri}
          fill={`url(#${id}-dial)`}
          style={{ cursor: locked ? 'not-allowed' : 'pointer' }}
          onPointerDown={openPopup}/>
        <circle cx="0" cy="0" r={Ri} fill="none" stroke="#2a4555" strokeWidth="1"
          style={{ pointerEvents: 'none' }}/>

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

        <circle cx="0" cy="0" r={Rs} fill={`url(#${id}-screw)`}
          style={{ pointerEvents: 'none' }}/>
        <circle cx="0" cy="0" r={Rs} fill="none" stroke="#0d1a22" strokeWidth="1"
          style={{ pointerEvents: 'none' }}/>
        <line
          x1={notchInner.x} y1={notchInner.y}
          x2={notchOuter.x} y2={notchOuter.y}
          stroke="rgba(255,255,255,0.95)" strokeWidth="2.5" strokeLinecap="round"
          style={{ pointerEvents: 'none' }}/>

        <ComponentValueLabel
          componentId={id} type="resistor" value={nominalValue}
          onChange={onLabelChange}
          x={0} y={R + pinLen + 14} textAnchor="middle"
          fontSize={14 / scale} fill="#aaa" rotate={-rotate}
        />
      </g>

      <circle cx={pinA.x} cy={pinA.y} r="5" fill="transparent" data-pin="a"/>
      <circle cx={pinW.x} cy={pinW.y} r="5" fill="transparent" data-pin="b"/>
      <circle cx={pinB.x} cy={pinB.y} r="5" fill="transparent" data-pin="w"/>

      {/* Popup de ajuste del wiper */}
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
      
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#5a6278' }}>
              Nominal: <span style={{ color: '#94a3b8' }}>{formatResistance(nominalValue)}</span>
            </span>
            <span style={{ fontSize: 13, color: '#61dafb', fontWeight: 700 }}>
              {formatResistance(effectiveResistance)}
            </span>
            <span style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600 }}>
              {formatPct(liveWiper)}
            </span>
          </div>

          <input
            type="range"
            className="pot-range"
            min={0}
            max={100}
            step={1}
            value={sliderValue}
            onChange={onRangeChange}
            onPointerDown={onRangePointerDown}
            onPointerUp={onRangeCommit}
            onMouseUp={onRangeCommit}
            style={{ '--p': `${sliderValue}%` }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: '#5a6278' }}>0%  (0Ω)</span>
            <span style={{ fontSize: 10, color: '#5a6278' }}>100%  ({formatResistance(nominalValue)})</span>
          </div>

          <p style={{ margin: '8px 0 0', fontSize: 10, color: '#4a4f5e', textAlign: 'center' }}>
            Arrastra para ajustar el wiper · Clic fuera para cerrar
          </p>
        </div>,
        document.body
      )}
    </g>
  );
};