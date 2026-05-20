/**
 * Atomos de UI reutilizables. 
 */
import { latexToText, formatNums } from '../utils/format.js';

// Tokens de estilo compartidos

export const INPUT_STYLE = {
  background: '#1e1e2e',
  border: '1px solid #444',
  borderRadius: 4,
  padding: '3px 7px',
  color: '#ccc',
  fontFamily: 'monospace',
  fontSize: 12,
};

// Atomos

/** Fila clave–valor con alineacion espacio-entre. */
export function Row({ label, value, color = '#94a3b8', mono = true }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
      <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
      <span style={{ fontSize: 12, color, fontFamily: mono ? 'monospace' : 'inherit', fontWeight: 600 }}>
        {value}
      </span>
    </div>
  );
}

/** Boton de calculo con spinner de carga. */
export function CalcButton({ onClick, loading, disabled, children, style = {} }) {
  return (
    <button
      className="control-btn primary"
      onClick={onClick}
      disabled={loading || disabled}
      style={{ fontSize: 12, padding: '4px 12px', ...style }}
    >
      {loading ? '⏳ Calculando…' : children}
    </button>
  );
}

/** Mensaje placeholder cuando no hay datos que mostrar. */
export function Placeholder({ text }) {
  return <p style={{ fontSize: 12, color: '#3a3f4e', margin: 0 }}>{text}</p>;
}

/** Alerta de advertencia amarilla inline. */
export function WarningBadge({ children }) {
  return (
    <p style={{ fontSize: 12, color: '#fbbf24', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
      <span>⚠</span> {children}
    </p>
  );
}

/** Un paso de procedimiento con formula LaTeX -> texto */
export function FormulaStep({ paso }) {
  const text = formatNums(latexToText(paso.eq ?? ''));
  return (
    <div style={{
      padding: '6px 10px', background: '#1a1b22', borderRadius: 6,
      borderLeft: '2px solid #6c63ff', display: 'flex', gap: 10, alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: 10, color: '#5a6278', minWidth: 16, paddingTop: 2 }}>{paso.paso}.</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {paso.titulo && (
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{paso.titulo}</span>
        )}
        <span style={{ fontSize: 13, color: '#e2e8f0', fontFamily: 'monospace', letterSpacing: '0.02em' }}>
          {text}
        </span>
      </div>
    </div>
  );
}

/** Input con etiqueta apilada verticalmente. */
export function LabeledInput({ label, value, onChange, width = 90 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <label style={{ fontSize: 10, color: '#5a6278' }}>{label}</label>
      <input
        style={{ ...INPUT_STYLE, width }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/** Select de nodo con etiqueta apilada. */
export function NodeSelector({ label, value, options, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <label style={{ fontSize: 10, color: '#5a6278' }}>{label}</label>
      <select
        style={{ ...INPUT_STYLE, width: 70 }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
    </div>
  );
}