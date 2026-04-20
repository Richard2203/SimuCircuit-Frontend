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
          <ResultRow label="V_th" value={`${resultado.thevenin?.Vth} ${resultado.thevenin?.unidadV}`} color="#6c63ff" />
          <ResultRow label="R_th" value={`${resultado.thevenin?.Rth} ${resultado.thevenin?.unidadR}`} color="#6c63ff" />
          <ResultRow label="I_n"  value={`${resultado.norton?.In} ${resultado.norton?.unidadI}`}       color="#4ade80" />
          <ResultRow label="R_n"  value={`${resultado.norton?.Rn} ${resultado.norton?.unidadR}`}       color="#4ade80" />
          <ResultRow label="P_max" value={`${resultado.maximaPotencia?.valor} ${resultado.maximaPotencia?.unidad}`} color="#fbbf24" />

          {resultado.procedimiento?.length > 0 && (
            <div style={{ marginTop: 6, borderTop: '1px solid #333', paddingTop: 6 }}>
              <p style={{ fontSize: 11, color: '#666', margin: '0 0 4px' }}>Procedimiento:</p>
              {resultado.procedimiento.map((paso) => (
                <p key={paso.paso} style={{ fontSize: 12, color: '#aaa', margin: '2px 0', fontFamily: 'monospace' }}>
                  {paso.paso}. {paso.eq}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resultado Superposición */}
      {tipo === 'superposicion' && resultado && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <ResultRow
            label={`${resultado.parametro === 'voltaje' ? 'V' : 'I'} total en ${resultado.componenteObjetivo}`}
            value={`${resultado.valorTotal} ${resultado.unidad}`}
            color="#fbbf24"
          />
          {resultado.aportaciones?.map((ap) => (
            <ResultRow
              key={ap.fuenteId}
              label={`Aporte de ${ap.fuenteId}`}
              value={`${ap.valorAporte} ${resultado.unidad}`}
              color="#4ade80"
            />
          ))}
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