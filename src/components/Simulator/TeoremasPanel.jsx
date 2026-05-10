import { useState } from 'react';
import { formatValue } from './models/ComponentValueLabel.jsx';

/* Helpers de formato */
const fmtV    = (v)          => formatValue(Number(v), 'V');
const fmtA    = (v)          => formatValue(Number(v), 'A');
const fmtOhm  = (v)          => formatValue(Number(v), 'Ω');
const fmtW    = (v)          => formatValue(Number(v), 'W');
const fmtAuto = (v, unit='') => formatValue(Number(v), unit);

/**
 * TeoremasPanel — Subpanel reutilizable para Thevenin/Norton y Superposicion.
 * Se muestra dentro de un AccordionSection cuando el circuito tiene netlist.
 *
 * @param {{
 *   tipo:        'thevenin-norton' | 'superposicion',
 *   resultado:   object|null,
 *   loading:     boolean,
 *   error:       string|null,
 *   onCalcular:  Function
 * }} props
 */
/**
 * Convierte el subconjunto de LaTeX que devuelve el backend a texto legible.
 * Cubre: fracciones, subindices, superindices, simbolos griegos y unidades.
 */
function latexToText(str) {
  if (!str) return '';
  return str
    // \frac{a}{b} -> a / b
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1) / ($2)')
    // subindices _{x} -> x (en subscript)
    .replace(/\_\{([^}]+)\}/g, (_, s) => s)
    .replace(/\_([a-zA-Z0-9])/g, (_, s) => s)
    // superindices ^{x} -> ^x
    .replace(/\^\{([^}]+)\}/g, '^$1')
    .replace(/\^([a-zA-Z0-9])/g, '^$1')
    // Simbolos griegos y matematicos
    .replace(/\\Omega/g, 'Ω')
    .replace(/\\omega/g, 'ω')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g,  'β')
    .replace(/\\pi/g,    'π')
    .replace(/\\infty/g, '∞')
    .replace(/\\cdot/g,  '·')
    .replace(/\\times/g, '×')
    .replace(/\\approx/g,'≈')
    .replace(/\\leq/g,   '≤')
    .replace(/\\geq/g,   '≥')
    .replace(/\\neq/g,   '≠')
    // Limpiar llaves y backslashes sobrantes
    .replace(/\{|\}/g, '')
    .replace(/\\/g, '')
    .trim();
}

/**
 * Formatea un numero dentro de un string: recorta decimales innecesarios.
 */
function formatNums(str) {
  return str.replace(/(-?\d+\.\d+)/g, (match) => {
    const n = parseFloat(match);
    if (Number.isInteger(n)) return String(n);
    // Maximo 5 cifras significativas despues del punto
    const s = n.toPrecision(5);
    // Quitar ceros finales innecesarios
    return parseFloat(s).toString();
  });
}

function PasoFormula({ paso }) {
  const texto = formatNums(latexToText(paso.eq ?? ''));
  return (
    <div style={{
      padding: '6px 10px',
      background: '#1a1b22',
      borderRadius: 6,
      borderLeft: '2px solid #6c63ff',
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: 10, color: '#5a6278', minWidth: 16, paddingTop: 2 }}>
        {paso.paso}.
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {paso.titulo && (
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
            {paso.titulo}
          </span>
        )}
        <span style={{
          fontSize: 13,
          color: '#e2e8f0',
          fontFamily: 'monospace',
          letterSpacing: '0.02em',
        }}>
          {texto}
        </span>
      </div>
    </div>
  );
}

export function TeoremasPanel({ tipo, resultado, loading, error, onCalcular }) {
  const [compId, setCompId]     = useState('');
  const [parametro, setParametro] = useState('voltaje');

  const handleSubmit = () => {
    if (!compId.trim()) return;
    if (tipo === 'thevenin-norton') {
      onCalcular(compId.trim());
    } else {
      onCalcular(compId.trim(), parametro);
    }
  };

  return (
    <div className="analysis-content" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Formulario de entrada */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: '#888' }}>
            {tipo === 'thevenin-norton' ? 'ID componente de carga' : 'ID componente objetivo'}
          </label>
          <input
            value={compId}
            onChange={(e) => setCompId(e.target.value)}
            placeholder={tipo === 'thevenin-norton' ? 'ej. RL' : 'ej. R3'}
            style={{
              background: '#1e1e2e',
              border: '1px solid #444',
              borderRadius: 4,
              padding: '4px 8px',
              color: '#ccc',
              fontFamily: 'monospace',
              fontSize: 13,
              width: 120,
            }}
          />
        </div>

        {tipo === 'superposicion' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: '#888' }}>Parámetro</label>
            <select
              value={parametro}
              onChange={(e) => setParametro(e.target.value)}
              style={{
                background: '#1e1e2e',
                border: '1px solid #444',
                borderRadius: 4,
                padding: '4px 8px',
                color: '#ccc',
                fontSize: 13,
              }}
            >
              <option value="voltaje">Voltaje</option>
              <option value="corriente">Corriente</option>
            </select>
          </div>
        )}

        <button
          className="control-btn primary"
          style={{ alignSelf: 'flex-end', padding: '5px 14px', fontSize: 13 }}
          onClick={handleSubmit}
          disabled={loading || !compId.trim()}
        >
          {loading ? '⏳…' : 'Calcular'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <p style={{ color: '#e74c3c', fontSize: 12, margin: 0 }}>⚠ {error}</p>
      )}

      {/* Resultado Thevenin/Norton */}
      {tipo === 'thevenin-norton' && resultado && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <ResultRow label="V_th" value={fmtAuto(resultado.thevenin?.Vth ?? 0, resultado.thevenin?.unidadV ?? 'V')} color="#6c63ff" />
          <ResultRow label="R_th" value={fmtAuto(resultado.thevenin?.Rth ?? 0, resultado.thevenin?.unidadR ?? 'Ω')} color="#6c63ff" />
          <ResultRow label="I_n"  value={fmtAuto(resultado.norton?.In ?? 0, resultado.norton?.unidadI ?? 'A')} color="#4ade80" />
          <ResultRow label="R_n"  value={fmtAuto(resultado.norton?.Rn ?? 0, resultado.norton?.unidadR ?? 'Ω')} color="#4ade80" />
          <ResultRow label="P_max" value={fmtAuto(resultado.maximaPotencia?.valor ?? 0, resultado.maximaPotencia?.unidad ?? 'W')} color="#fbbf24" />

          {resultado.procedimiento?.length > 0 && (
            <div style={{ marginTop: 8, borderTop: '1px solid #252830', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p style={{ fontSize: 11, color: '#5a6278', margin: '0 0 4px', fontWeight: 500 }}>Procedimiento:</p>
              {resultado.procedimiento.map((paso) => (
                <PasoFormula key={paso.paso} paso={paso} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resultado Superposicion */}
      {tipo === 'superposicion' && resultado && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Backend devuelve: { total, aportaciones, procedimiento } */}
          <ResultRow
            label={`${parametro === 'voltaje' ? 'V' : 'I'} total en ${compId}`}
            value={fmtAuto(resultado.total ?? 0, parametro === 'voltaje' ? 'V' : 'A')}
            color="#fbbf24"
          />
          {resultado.aportaciones?.map((ap) => (
            <ResultRow
              key={ap.fuenteId}
              label={`Aporte de ${ap.fuenteId}`}
              value={fmtAuto(ap.valorAporte ?? 0, parametro === 'voltaje' ? 'V' : 'A')}
              color="#4ade80"
            />
          ))}
          {resultado.procedimiento?.length > 0 && (
            <div style={{ marginTop: 8, borderTop: '1px solid #252830', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p style={{ fontSize: 11, color: '#5a6278', margin: '0 0 4px', fontWeight: 500 }}>Procedimiento:</p>
              {resultado.procedimiento.map((paso) => (
                <PasoFormula key={paso.paso} paso={paso} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Placeholder vacio */}
      {!resultado && !loading && !error && (
        <p style={{ color: '#555', fontSize: 12, margin: 0 }}>
          Ingresa el ID del componente y presiona Calcular.
        </p>
      )}
    </div>
  );
}

function ResultRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: '#888' }}>{label}</span>
      <span style={{ fontSize: 13, color: color ?? '#ccc', fontFamily: 'monospace', fontWeight: 600 }}>
        {value}
      </span>
    </div>
  );
}