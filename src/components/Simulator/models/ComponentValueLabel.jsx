import { useState, useRef, useEffect, useCallback } from 'react';
import eventBus from '../../../core/EventBus';

// ─── Notation parser ────────────────────────────────────────────────────────

const SUFFIX_MAP = {
  t: 1e12, g: 1e9, meg: 1e6, k: 1e3, m: 1e-3,
  u: 1e-6, µ: 1e-6, n: 1e-9, p: 1e-12, f: 1e-15,
};

/**
 * Parses engineering notation strings into a numeric value.
 * Examples: "10k" → 10000, "4.7u" → 4.7e-6, "1e-6" → 1e-6, "100" → 100
 */
export function parseNotation(str) {
  if (str === null || str === undefined || str === '') return NaN;
  const s = String(str).trim().toLowerCase();

  // Try plain number first (including scientific notation like 1e-6)
  const plain = parseFloat(s);
  if (!isNaN(plain) && /^[+-]?[\d.]+([eE][+-]?\d+)?$/.test(s)) return plain;

  // Try "number + suffix" like 10k, 4.7u, 100meg
  const match = s.match(/^([+-]?[\d.]+(?:[eE][+-]?\d+)?)\s*(t|g|meg|k|m|µ|u|n|p|f)?$/);
  if (!match) return NaN;

  const num = parseFloat(match[1]);
  const suffix = match[2] || '';
  const multiplier = SUFFIX_MAP[suffix] ?? 1;
  return num * multiplier;
}

// ─── Value formatter ─────────────────────────────────────────────────────────

/**
 * Formats a raw numeric value into a human-readable engineering string.
 * formatValue(10000, 'Ω') → "10kΩ"
 * formatValue(0.0001, 'F') → "100µF"
 */
export function formatValue(value, unit = '') {
  if (value === null || value === undefined || isNaN(value)) return `—${unit}`;

  const abs = Math.abs(value);
  const tiers = [
    { threshold: 1e9,  divisor: 1e9,  prefix: 'G' },
    { threshold: 1e6,  divisor: 1e6,  prefix: 'M' },
    { threshold: 1e3,  divisor: 1e3,  prefix: 'k' },
    { threshold: 1,    divisor: 1,    prefix: ''  },
    { threshold: 1e-3, divisor: 1e-3, prefix: 'm' },
    { threshold: 1e-6, divisor: 1e-6, prefix: 'µ' },
    { threshold: 1e-9, divisor: 1e-9, prefix: 'n' },
    { threshold: 0,    divisor: 1e-12,prefix: 'p' },
  ];

  for (const tier of tiers) {
    if (abs >= tier.threshold) {
      const scaled = value / tier.divisor;
      // Up to 3 significant digits, trim trailing zeros
      const formatted = parseFloat(scaled.toPrecision(3));
      return `${formatted}${tier.prefix}${unit}`;
    }
  }
  const scaled = value / 1e-12;
  return `${parseFloat(scaled.toPrecision(3))}p${unit}`;
}

// ─── Per-component constraints ────────────────────────────────────────────────

export const COMPONENT_CONSTRAINTS = {
  resistor:   { min: 1,    max: 10e6,  unit: 'Ω',  label: '1 Ω – 10 MΩ' },
  capacitor:  { min: 1e-6, max: 10e-3, unit: 'F',  label: '1 µF – 10,000 µF',
                displayUnit: 'µF', displayDivisor: 1e-6 },
  inductor:   { min: 1e-6, max: 10,    unit: 'H',  label: '1 µH – 10 H' },
  voltageSource: { min: 0, max: 1000,  unit: 'V',  label: '0 V – 1000 V' },
  currentSource: { min: 0, max: 100,   unit: 'A',  label: '0 A – 100 A' },
  diode:      { min: 0.2,  max: 1.2,   unit: 'V',  label: '0.2 V – 1.2 V' },
  bjt:        { min: 20,   max: 500,   unit: 'β',  label: 'β 20 – 500' },
  fet:        { min: 1,    max: 20,    unit: 'V',  label: '1 V – 20 V (Vgs)' },
  vreg:       { min: 1.2,  max: 48,    unit: 'V',  label: '1.2 V – 48 V' },
  // fallback
  generic:    { min: -Infinity, max: Infinity, unit: '', label: 'cualquier valor' },
};

function getConstraint(type) {
  return COMPONENT_CONSTRAINTS[type] || COMPONENT_CONSTRAINTS.generic;
}

// ─── ComponentValueLabel ──────────────────────────────────────────────────────

/**
 * Props:
 *  componentId  {string}  - unique id for this component instance
 *  type         {string}  - key in COMPONENT_CONSTRAINTS
 *  value        {number}  - current numeric value in SI units
 *  onChange     {fn}      - (newValueSI: number) => void
 *  x            {number}  - SVG x for the label anchor
 *  y            {number}  - SVG y for the label anchor
 *  textAnchor   {string}  - 'start' | 'middle' | 'end'
 *  fontSize     {number}
 *  fill         {string}  - default text color
 *  rotate       {number}  - counter-rotation to keep label upright
 *  svgRef       {ref}     - ref to the parent <svg> element (for foreignObject sizing)
 */
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

  // Format display label
  const displayLabel = (() => {
    if (type === 'capacitor') {
      const uf = value / 1e-6;
      return `${parseFloat(uf.toPrecision(4))}µF`;
    }
    return formatValue(value, constraint.unit);
  })();

  const validate = useCallback((str) => {
    const parsed = parseNotation(str);
    if (isNaN(parsed)) return false;
    // For capacitor, user inputs in µF so convert
    const si = type === 'capacitor' ? parsed * 1e-6 : parsed;
    return si >= constraint.min && si <= constraint.max;
  }, [type, constraint]);

  const startEditing = () => {
    // Seed with current value in user-friendly units
    let seed;
    if (type === 'capacitor') {
      seed = String(parseFloat((value / 1e-6).toPrecision(4)));
    } else {
      seed = String(value);
    }
    setInputVal(seed);
    setValid(true);
    setShowTooltip(false);
    setEditing(true);
  };

  const commit = useCallback(() => {
    const parsed = parseNotation(inputVal);
    if (isNaN(parsed)) { cancel(); return; }
    const si = type === 'capacitor' ? parsed * 1e-6 : parsed;
    if (si < constraint.min || si > constraint.max) {
      setValid(false);
      setShowTooltip(true);
      return;
    }
    setEditing(false);
    setShowTooltip(false);
    onChange?.(si);
    // Publish so mediator / other observers can react
    eventBus.publish('COMPONENT_VALUE_CHANGED', { id: componentId, type, value: si });
  }, [inputVal, type, constraint, onChange, componentId]);

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

  // The foreignObject input box
  const FOW = 90, FOH = 26;
  // Offset so it appears at the label position
  const foX = textAnchor === 'middle' ? x - FOW / 2
            : textAnchor === 'end'   ? x - FOW
            : x;
  const foY = y - FOH / 2;

  const labelColor = hovered && !editing ? '#61dafb' : fill;

  return (
    <g
      transform={rotate ? `rotate(${rotate}, ${x}, ${y})` : undefined}
      style={{ cursor: editing ? 'text' : 'pointer' }}
    >
      {/* Clickable value label */}
      {!editing && (
        <g>
          {/* Hover highlight pill */}
          {hovered && (
            <rect
              x={textAnchor === 'middle' ? x - 38 : textAnchor === 'end' ? x - 76 : x - 4}
              y={y - fontSize * 0.85}
              width={80}
              height={fontSize * 1.6}
              rx={4}
              fill="rgba(97,218,251,0.08)"
              stroke="rgba(97,218,251,0.3)"
              strokeWidth={0.8}
              style={{ pointerEvents: 'none' }}
            />
          )}
          <text
            x={x}
            y={y}
            fontSize={fontSize}
            fill={labelColor}
            fontFamily="'JetBrains Mono', 'Fira Code', 'Courier New', monospace"
            textAnchor={textAnchor}
            style={{
              userSelect: 'none',
              transition: 'fill 0.15s',
              paintOrder: 'stroke',
              stroke: 'rgba(0,0,0,0.5)',
              strokeWidth: 3,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={(e) => { e.stopPropagation(); startEditing(); }}
          >
            {displayLabel}
          </text>
          {/* Edit pencil icon hint */}
          {hovered && (
            <text
              x={textAnchor === 'end' ? x - 78 : x + 44}
              y={y}
              fontSize={9}
              fill="rgba(97,218,251,0.7)"
              fontFamily="sans-serif"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              ✎
            </text>
          )}
        </g>
      )}

      {/* Inline editor via foreignObject */}
      {editing && (
        <foreignObject x={foX} y={foY} width={FOW} height={FOH} overflow="visible">
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            style={{
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            <input
              ref={inputRef}
              value={inputVal}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onBlur={commit}
              style={{
                width: FOW - 4,
                height: FOH - 2,
                padding: '2px 5px',
                fontSize: fontSize + 1,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                background: '#1e1e2e',
                color: valid ? '#a6e22e' : '#f92672',
                border: `1.5px solid ${valid ? '#a6e22e' : '#f92672'}`,
                borderRadius: 4,
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: valid
                  ? '0 0 6px rgba(166,226,46,0.4)'
                  : '0 0 6px rgba(249,38,114,0.4)',
                transition: 'border-color 0.15s, color 0.15s, box-shadow 0.15s',
              }}
            />
            {/* Error tooltip */}
            {showTooltip && (
              <div
                style={{
                  position: 'absolute',
                  top: FOH + 2,
                  left: 0,
                  whiteSpace: 'nowrap',
                  background: '#2d1b2e',
                  color: '#f92672',
                  border: '1px solid #f92672',
                  borderRadius: 4,
                  padding: '2px 6px',
                  fontSize: 10,
                  fontFamily: 'sans-serif',
                  zIndex: 9999,
                  pointerEvents: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                }}
              >
                Rango: {constraint.label}
              </div>
            )}
          </div>
        </foreignObject>
      )}
    </g>
  );
}
