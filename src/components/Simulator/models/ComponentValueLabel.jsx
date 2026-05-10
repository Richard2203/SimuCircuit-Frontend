import { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { CircuitEditContext } from '../../../core/CircuitEditContext';
import eventBus from '../../../core/EventBus';


const READONLY_TYPES = new Set([
  'regulador_voltaje',
  'diodo',
  'diode',
  'bjt',
  'fet',
  'vreg',
]);

// Notation parser

const SUFFIX_MAP = {
  t: 1e12, g: 1e9, meg: 1e6, k: 1e3, m: 1e-3,
  u: 1e-6, µ: 1e-6, n: 1e-9, p: 1e-12, f: 1e-15,
};

/**
 * Conversion de notacion de ingeneria a notacion de string (SI)
 */
export function parseNotation(str) {
  if (str === null || str === undefined || str === '') return NaN;
  const s = String(str).trim().toLowerCase();

  const plain = parseFloat(s);
  if (!isNaN(plain) && /^[+-]?[\d.]+([eE][+-]?\d+)?$/.test(s)) return plain;

  const match = s.match(/^([+-]?[\d.]+(?:[eE][+-]?\d+)?)\s*(t|g|meg|k|m|µ|u|n|p|f)?$/);
  if (!match) return NaN;

  const num = parseFloat(match[1]);
  const suffix = match[2] || '';
  const multiplier = SUFFIX_MAP[suffix] ?? 1;
  return num * multiplier;
}

// Value formatter

/**
 * Conversion de numeracion cruda (SI) a notacion de ingenieria legible.
 */
export function formatValue(value, unit = '') {
  if (value === null || value === undefined || isNaN(value)) return `—${unit}`;

  // Caso especial: exactamente cero → no tiene sentido un prefijo
  if (value === 0) return `0${unit}`;

  const abs = Math.abs(value);
  const tiers = [
    { threshold: 1e9,  divisor: 1e9,  prefix: 'G' },
    { threshold: 1e6,  divisor: 1e6,  prefix: 'M' },
    { threshold: 1e3,  divisor: 1e3,  prefix: 'k' },
    { threshold: 1,    divisor: 1,    prefix: ''  },
    { threshold: 1e-3, divisor: 1e-3, prefix: 'm' },
    { threshold: 1e-6, divisor: 1e-6, prefix: 'µ' },
    { threshold: 1e-9, divisor: 1e-9, prefix: 'n' },
    { threshold: 1e-12,divisor: 1e-12,prefix: 'p' },
  ];

  for (const tier of tiers) {
    if (abs >= tier.threshold) {
      const scaled    = value / tier.divisor;
      const formatted = parseFloat(scaled.toPrecision(3));
      return `${formatted}${tier.prefix}${unit}`;
    }
  }
  // Valores menores que 1 pF/pA/etc. -> mostrar en pico igualmente
  const scaled = value / 1e-12;
  return `${parseFloat(scaled.toPrecision(3))}p${unit}`;
}

// Per-component constraints

export const COMPONENT_CONSTRAINTS = {
  resistor:      { min: 1,       max: 10e6,  unit: 'Ω', label: '1 Ω – 10 MΩ' },
  capacitor:     { min: 0.5e-12, max: 100e-6, unit: 'F', label: '0.5 pF – 100 µF' },
  inductor:      { min: 1e-6,   max: 10,    unit: 'H', label: '1 µH – 10 H' },
  voltageSource: { min: -23,    max: 23,    unit: 'V', label: '-23 V – 23 V' },
  currentSource: { min: 0,      max: 100,   unit: 'A', label: '0 A – 100 A' },
  diode:   { min: -Infinity, max: Infinity, unit: '', label: 'Valor Fijo' },
  bjt:     { min: -Infinity, max: Infinity, unit: '', label: 'Valor Fijo' },
  fet:     { min: -Infinity, max: Infinity, unit: '', label: 'Valor Fijo' },
  vreg:    { min: -Infinity, max: Infinity, unit: '', label: 'Valor Fijo' },
  generic: { min: -Infinity, max: Infinity, unit: '', label: 'cualquier valor' },
};

function getConstraint(type) {
  return COMPONENT_CONSTRAINTS[type] || COMPONENT_CONSTRAINTS.generic;
}

// ComponentValueLabel

export function ComponentValueLabel({
  componentId,
  type = 'generic',
  value,
  onChange,
  x = 0,
  y = 0,
  textAnchor = 'start',
  fontSize = 12,
  fill = '#aaa',
  rotate = 0,
  svgRef,
}) {
  const constraint = getConstraint(type);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [valid, setValid] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef(null);

  const isReadOnly = READONLY_TYPES.has(type);
  const { locked } = useContext(CircuitEditContext);

  // Display label: use formatValue for all types
  const displayLabel = formatValue(value, constraint.unit);

  // Validate: parseNotation already returns SI
  const validate = useCallback((str) => {
    const si = parseNotation(str);
    if (isNaN(si)) return false;
    return si >= constraint.min && si <= constraint.max;
  }, [constraint]);

  const startEditing = () => {
    if (locked) return;
    // Seed with current value formatted in engineering notation
    const seed = formatValue(value, '');
    setInputVal(seed);
    setValid(true);
    setShowTooltip(false);
    setEditing(true);
  };

  const commit = useCallback(() => {
    const si = parseNotation(inputVal);
    if (isNaN(si)) { cancel(); return; }
    if (si < constraint.min || si > constraint.max) {
      setValid(false);
      setShowTooltip(true);
      return;
    }
    setEditing(false);
    setShowTooltip(false);
    onChange?.(si);
    eventBus.publish('COMPONENT_VALUE_CHANGED', { id: componentId, type, value: si });
  }, [inputVal, constraint, onChange, componentId, type]);

  const cancel = () => {
    setEditing(false);
    setShowTooltip(false);
    setValid(true);
  };

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
  };

  const handleChange = (e) => {
    const v = e.target.value;
    setInputVal(v);
    setValid(validate(v));
    setShowTooltip(false);
  };

  const FOW = 90, FOH = 26;
  const foX = textAnchor === 'middle' ? x - FOW / 2
            : textAnchor === 'end'   ? x - FOW
            : x;
  const foY = y - FOH / 2;

  const labelColor = hovered && !editing ? '#61dafb' : fill;

  return (
    <g
      transform={rotate ? `rotate(${rotate}, ${x}, ${y})` : undefined}
      style={{ cursor: locked ? 'not-allowed' : editing ? 'text' : 'pointer' }}
    >
      {!editing && (
        <g>
          {isReadOnly ? (
            <text x={x} y={y} fontSize={fontSize} fill={fill}
              fontFamily="'JetBrains Mono', 'Fira Code', monospace"
              textAnchor={textAnchor} style={{ userSelect: 'none' }}>
              {value}
            </text>
          ) : (
            <>
              {hovered && (
                <rect
                  x={textAnchor === 'middle' ? x - 38 : textAnchor === 'end' ? x - 76 : x - 4}
                  y={y - fontSize * 0.85}
                  width={80} height={fontSize * 1.6} rx={4}
                  fill="rgba(97,218,251,0.08)"
                  stroke="rgba(97,218,251,0.3)" strokeWidth={0.8}
                  style={{ pointerEvents: 'none' }}
                />
              )}
              <text x={x} y={y} fontSize={fontSize} fill={labelColor}
                fontFamily="'JetBrains Mono', 'Fira Code', monospace"
                textAnchor={textAnchor}
                style={{
                  userSelect: 'none', transition: 'fill 0.15s',
                  paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.5)', strokeWidth: 3,
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onClick={(e) => { e.stopPropagation(); startEditing(); }}
              >
                {displayLabel}
              </text>
              {hovered && (
                <text
                  x={textAnchor === 'end' ? x - 78 : x + 44} y={y}
                  fontSize={9} fill="rgba(97,218,251,0.7)" fontFamily="sans-serif"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}>
                  ✎
                </text>
              )}
            </>
          )}
        </g>
      )}

      {editing && (
        <foreignObject x={foX} y={foY} width={FOW} height={FOH} overflow="visible">
          <div xmlns="http://www.w3.org/1999/xhtml"
            style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <input
              ref={inputRef}
              value={inputVal}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onBlur={commit}
              style={{
                width: FOW - 4, height: FOH - 2, padding: '2px 5px',
                fontSize: fontSize + 1,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                background: '#1e1e2e',
                color: valid ? '#a6e22e' : '#f92672',
                border: `1.5px solid ${valid ? '#a6e22e' : '#f92672'}`,
                borderRadius: 4, outline: 'none', boxSizing: 'border-box',
                boxShadow: valid
                  ? '0 0 6px rgba(166,226,46,0.4)'
                  : '0 0 6px rgba(249,38,114,0.4)',
                transition: 'border-color 0.15s, color 0.15s, box-shadow 0.15s',
              }}
            />
            {showTooltip && (
              <div style={{
                position: 'absolute', top: FOH + 2, left: 0,
                whiteSpace: 'nowrap', background: '#2d1b2e',
                color: '#f92672', border: '1px solid #f92672',
                borderRadius: 4, padding: '2px 6px', fontSize: 10,
                fontFamily: 'sans-serif', zIndex: 9999,
                pointerEvents: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              }}>
                Rango: {constraint.label}
              </div>
            )}
          </div>
        </foreignObject>
      )}
    </g>
  );
}