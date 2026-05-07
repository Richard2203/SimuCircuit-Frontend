import { useState } from 'react';

/**
 * TeoremasPanel — Subpanel reutilizable para Thévenin/Norton y Superposición.
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
 * Cubre: fracciones, subíndices, superíndices, símbolos griegos y unidades.
 */
function latexToText(str) {
  if (!str) return '';
  return str
    // \frac{a}{b} → a / b
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1) / ($2)')
    // subíndices _{x} → x (en subscript)
    .replace(/\_\{([^}]+)\}/g, (_, s) => s)
    .replace(/\_([a-zA-Z0-9])/g, (_, s) => s)
    // superíndices ^{x} → ^x
    .replace(/\^\{([^}]+)\}/g, '^$1')
    .replace(/\^([a-zA-Z0-9])/g, '^$1')
    // Símbolos griegos y matemáticos
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
 * Formatea un número dentro de un string: recorta decimales innecesarios.
 * "12.0000000000" → "12", "615.2988403211" → "615.2988", "0.0195027184" → "0.01950"
 */
function formatNums(str) {
  return str.replace(/(-?\d+\.\d+)/g, (match) => {
    const n = parseFloat(match);
    if (Number.isInteger(n)) return String(n);
    // Máximo 5 cifras significativas después del punto
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

      {/* Resultado Thévenin/Norton */}
      {tipo === 'thevenin-norton' && resultado && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <ResultRow label="V_th" value={`${Number(resultado.thevenin?.Vth ?? 0).toFixed(4)} ${resultado.thevenin?.unidadV}`} color="#6c63ff" />
          <ResultRow label="R_th" value={`${Number(resultado.thevenin?.Rth ?? 0).toFixed(4)} ${resultado.thevenin?.unidadR}`} color="#6c63ff" />
          <ResultRow label="I_n"  value={`${Number(resultado.norton?.In ?? 0).toFixed(6)} ${resultado.norton?.unidadI}`}       color="#4ade80" />
          <ResultRow label="R_n"  value={`${Number(resultado.norton?.Rn ?? 0).toFixed(4)} ${resultado.norton?.unidadR}`}       color="#4ade80" />
          <ResultRow label="P_max" value={`${Number(resultado.maximaPotencia?.valor ?? 0).toFixed(6)} ${resultado.maximaPotencia?.unidad}`} color="#fbbf24" />

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

      {/* Resultado Superposición */}
      {tipo === 'superposicion' && resultado && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Backend devuelve: { total, aportaciones, procedimiento } */}
          <ResultRow
            label={`${parametro === 'voltaje' ? 'V' : 'I'} total en ${compId}`}
            value={`${Number(resultado.total ?? 0).toFixed(4)} ${parametro === 'voltaje' ? 'V' : 'A'}`}
            color="#fbbf24"
          />
          {resultado.aportaciones?.map((ap) => (
            <ResultRow
              key={ap.fuenteId}
              label={`Aporte de ${ap.fuenteId}`}
              value={`${Number(ap.valorAporte ?? 0).toFixed(4)} ${parametro === 'voltaje' ? 'V' : 'A'}`}
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

      {/* Placeholder vacío */}
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