
/**
 * Paneles de analisis para cada AccordionSection.
 * Cada panel recibe solo las props que necesita; ninguno conoce el estado global.
 * 
 * Exports:
 *   NodalPanel           – Analisis nodal/mallas DC
 *   TransientPanel       – Analisis transitorio (t_stop / delta_t)
 *   GeneralPanel         – Resistencia equivalente entre nodos
 *   LawsPanel            – KVL/KCL + divisores de voltaje/corriente
 *   ProcedurePanel       – Procedimiento de calculo paso a paso
 *   SourceTransformPanel – Transformacion de fuente
 */
import { useState } from 'react';
import {
  Row, CalcButton, Placeholder, WarningBadge,
  FormulaStep, LabeledInput, NodeSelector, INPUT_STYLE,
} from '../primitives.jsx';
import { fmtV, fmtA, fmtAuto, expandirCorrientes } from '../../utils/format.js';

// NodalPanel
export function NodalPanel({ resultado, netlist, loading, onCalculate }) {
  const voltages = resultado?.voltages ?? {};
  const currents = resultado?.currents ?? {};
  const hasData  = Object.keys(voltages).length > 0;

  return (
    <div className="analysis-content" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <CalcButton onClick={onCalculate} loading={loading}>⚡ Calcular análisis nodal</CalcButton>

      {hasData && (
        <>
          <SectionLabel>Voltajes nodales</SectionLabel>
          {Object.entries(voltages).map(([node, v]) => (
            <Row key={node} label={`V(nodo ${node})`} value={fmtV(v)} color="#a78bfa" />
          ))}
          {Object.keys(currents).length > 0 && (
            <>
              <SectionLabel>Corrientes de rama</SectionLabel>
              {expandirCorrientes(currents, netlist).map(({ label, value }) => (
                <Row key={label} label={label} value={fmtA(value)} color="#4ade80" />
              ))}
            </>
          )}
        </>
      )}

      {!hasData && !loading && (
        <Placeholder text="Presiona el botón para ejecutar el análisis nodal DC." />
      )}
    </div>
  );
}

// TransientPanel
export function TransientPanel({ resultado, loading, hasReactives, onCalculate }) {
  const [tStop,  setTStop]  = useState('0.05');
  const [deltaT, setDeltaT] = useState('0.0005');

  const points  = resultado?.puntos ?? [];
  const hasData = points.length > 0;

  return (
    <div className="analysis-content" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {!hasReactives && (
        <WarningBadge>El análisis transitorio es útil cuando el circuito tiene capacitores o bobinas.</WarningBadge>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <LabeledInput label="t_stop (s)" value={tStop}  onChange={setTStop}  width={90} />
        <LabeledInput label="delta_t (s)" value={deltaT} onChange={setDeltaT} width={90} />
        <CalcButton
          onClick={() => onCalculate({ t_stop: parseFloat(tStop), delta_t: parseFloat(deltaT) })}
          loading={loading}
        >
          ∿ Ejecutar
        </CalcButton>
      </div>

      {hasData && (
        <>
          <p style={{ fontSize: 11, color: '#5a6278', margin: '4px 0 0', fontWeight: 500 }}>
            {points.length} pasos — t = {points[0]?.tiempo}s → {points[points.length - 1]?.tiempo}s
          </p>
          {[points[0], points[points.length - 1]].map((p, idx) => p && (
            <div key={idx} style={{ background: '#1a1b1e', borderRadius: 6, padding: '6px 10px' }}>
              <p style={{ fontSize: 11, color: '#5a6278', margin: '0 0 4px' }}>
                t = {p.tiempo} s ({idx === 0 ? 'inicio' : 'fin'})
              </p>
              {Object.entries(p.voltajes   ?? {}).map(([n, v]) => <Row key={n}  label={`V(${n})`}  value={fmtV(v)} color="#a78bfa" />)}
              {Object.entries(p.corrientes ?? {}).map(([id, i]) => <Row key={id} label={`I(${id})`} value={fmtA(i)} color="#4ade80" />)}
            </div>
          ))}
          <Placeholder text="Ve a la pestaña 📊 Gráficas para ver la evolución completa." />
        </>
      )}

      {!hasData && !loading && (
        <Placeholder text="Configura el intervalo de tiempo y presiona Ejecutar." />
      )}
    </div>
  );
}

// GeneralPanel
/** Normaliza nodos de la netlist: pueden venir como string o como { nodo, x, y }. */
function extractNodes(netlist) {
  return [...new Set(
    (netlist ?? [])
      .flatMap((c) => Object.values(c?.nodes ?? {}))
      .map((v) => (typeof v === 'object' ? String(v?.nodo ?? '') : String(v)))
      .filter(Boolean),
  )].sort((a, b) => {
    const na = Number(a), nb = Number(b);
    return !isNaN(na) && !isNaN(nb) ? na - nb : a.localeCompare(b);
  });
}

export function GeneralPanel({ resultado, loading, netlist, error, onCalculate }) {
  const [nodeA, setNodeA] = useState('1');
  const [nodeB, setNodeB] = useState('0');
  const nodes     = extractNodes(netlist);
  const hasResult = resultado?.tipo === 'resistencia-equivalente';
  const sameNode  = nodeA === nodeB;

  return (
    <div className="analysis-content" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <SectionLabel>Resistencia equivalente entre nodos</SectionLabel>

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <NodeSelector label="Nodo A" value={nodeA} options={nodes} onChange={setNodeA} />
        <NodeSelector label="Nodo B" value={nodeB} options={nodes} onChange={setNodeB} />
        <CalcButton
          onClick={() => onCalculate(nodeA, nodeB)}
          loading={loading}
          disabled={sameNode}
          style={{ opacity: sameNode ? 0.5 : 1 }}
        >
          Calcular R_eq
        </CalcButton>
      </div>

      {error?.toLowerCase().includes('nodo') && <WarningBadge>{error}</WarningBadge>}

      {hasResult && (
        <Row
          label={`R_eq (nodo ${resultado.nodos?.inicio} → ${resultado.nodos?.fin})`}
          value={fmtAuto(resultado.valor, resultado.unidad)}
          color="#fbbf24"
        />
      )}

      {!hasResult && !loading && (
        <Placeholder text="Selecciona dos nodos distintos y presiona Calcular R_eq." />
      )}
    </div>
  );
}

// LawsPanel  (KVL/KCL + divisores)
const FUNDAMENTAL_LAWS = [
  { label: 'Ley de Ohm', value: 'V = I · R' },
  { label: 'KVL',        value: 'ΣV = 0 (malla)' },
  { label: 'KCL',        value: 'ΣI = 0 (nodo)' },
  { label: 'Potencia',   value: 'P = V·I = I²R = V²/R' },
];

export function LawsPanel({
  resultado, loading, netlist,
  hasDCVoltageSrc, hasDCCurrentSrc,
  error,
  onCalculateVDiv, onCalculateIDiv,
}) {
  const [compId, setCompId] = useState('');
  const divType = resultado?.tipo; // 'divisor-voltaje' | 'divisor-corriente'

  return (
    <div className="analysis-content" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Leyes universales */}
      <div style={{ background: '#1a1b1e', borderRadius: 6, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {FUNDAMENTAL_LAWS.map(({ label, value }) => (
          <Row key={label} label={label} value={value} color="#6c63ff" mono={false} />
        ))}
      </div>

      {hasDCVoltageSrc && (
        <>
          <SectionLabel>Divisor de voltaje</SectionLabel>
          <DivisorRow
            compId={compId} onCompIdChange={setCompId}
            placeholder="ej. R2"
            loading={loading && divType === 'divisor-voltaje'}
            onCalculate={() => onCalculateVDiv(compId)}
            btnLabel="Calcular V_x"
          />
        </>
      )}

      {hasDCCurrentSrc && (
        <>
          <SectionLabel>Divisor de corriente</SectionLabel>
          <DivisorRow
            compId={compId} onCompIdChange={setCompId}
            placeholder="ej. R1"
            loading={loading && divType === 'divisor-corriente'}
            onCalculate={() => onCalculateIDiv(compId)}
            btnLabel="Calcular I_x"
          />
        </>
      )}

      {error && <WarningBadge>{error}</WarningBadge>}

      {divType === 'divisor-voltaje' && resultado && (
        <Row label={`Caída de voltaje en ${compId}`} value={fmtAuto(resultado.voltajeCaida ?? 0, resultado.unidad)} color="#4ade80" />
      )}
      {divType === 'divisor-corriente' && resultado && (
        <Row label={`Corriente en ${compId}`} value={fmtAuto(resultado.corrienteCaida ?? 0, resultado.unidad)} color="#4ade80" />
      )}

      {!resultado && !loading && !hasDCVoltageSrc && !hasDCCurrentSrc && (
        <Placeholder text="Este circuito no tiene fuentes identificadas para aplicar divisores." />
      )}
    </div>
  );
}

// ProcedurePanel
/** Shape `{ titulo, pasos: [{ paso, calculos[] }] }` — identico para DC y AC. */
export function ProcedurePanel({ procedimiento }) {
  const [openStep, setOpenStep] = useState(null);
  if (!procedimiento) return null;

  const { titulo, pasos = [] } = procedimiento;
  const toggle = (idx) => setOpenStep((prev) => (prev === idx ? null : idx));

  return (
    <div className="analysis-content" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {titulo && (
        <p style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600, margin: 0 }}>{titulo}</p>
      )}

      {pasos.map((paso, idx) => {
        const isOpen = openStep === idx;
        return (
          <div key={idx} style={{ borderRadius: 6, overflow: 'hidden', border: '1px solid #2a2a3a' }}>
            <button
              onClick={() => toggle(idx)}
              style={{
                width: '100%', textAlign: 'left',
                background: isOpen ? '#1e1a2e' : '#16161e',
                border: 'none', cursor: 'pointer', padding: '8px 12px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
              }}
            >
              <span style={{ fontSize: 12, color: isOpen ? '#c4b5fd' : '#94a3b8', fontWeight: 500 }}>
                {paso.paso}
              </span>
              <span style={{ fontSize: 10, color: '#5a6278' }}>{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
              <div style={{ background: '#0f0f16', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(paso.calculos ?? []).map((calc, ci) => (
                  <div key={ci} style={{ padding: '5px 10px', background: '#1a1b22', borderRadius: 5, borderLeft: '2px solid #6c63ff' }}>
                    <span style={{ fontSize: 12, color: '#e2e8f0', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {calc}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {pasos.length === 0 && (
        <Placeholder text="No hay pasos de cálculo disponibles para este circuito." />
      )}
    </div>
  );
}

// SourceTransformPanel
export function SourceTransformPanel({ resultado, loading, error, netlist, onCalculate }) {
  const [sourceId, setSourceId] = useState('');

  const sources = (netlist ?? []).filter(
    (c) => c?.type === 'fuente_voltaje' || c?.type === 'fuente_corriente',
  );

  return (
    <div className="analysis-content" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: '#888' }}>Fuente a transformar</label>
          {sources.length > 0 ? (
            <select style={INPUT_STYLE} value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
              <option value="">Seleccionar…</option>
              {sources.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.id} ({f.type === 'fuente_voltaje' ? 'Voltaje' : 'Corriente'})
                </option>
              ))}
            </select>
          ) : (
            <input
              style={{ ...INPUT_STYLE, width: 100 }}
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value.toUpperCase())}
              placeholder="ej. V1"
            />
          )}
        </div>
        <CalcButton
          onClick={() => onCalculate(sourceId.trim())}
          loading={loading}
          disabled={!sourceId.trim()}
          style={{ padding: '5px 14px', fontSize: 12 }}
        >
          ⇄ Transformar
        </CalcButton>
      </div>

      {error && <p style={{ color: '#e74c3c', fontSize: 12, margin: 0 }}>⚠ {error}</p>}

      {resultado && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Row label="Fuente original"       value={resultado.fuenteOriginal}                                                         color="#94a3b8" mono={false} />
          <Row label="Resistencia asociada"  value={resultado.resistenciaInvolucrada}                                                  color="#94a3b8" mono={false} />
          <Row label="Tipo resultante"       value={resultado.transformacion?.tipo}                                                    color="#a78bfa" mono={false} />
          <Row label="Nuevo valor de fuente" value={fmtAuto(resultado.transformacion?.nuevoValorFuente ?? 0, resultado.transformacion?.unidad ?? '')} color="#4ade80" />
          <Row label="Resistencia"           value={`${resultado.transformacion?.valorResistencia} Ω`}                                color="#fbbf24" />

          {resultado.procedimiento?.length > 0 && (
            <div style={{ marginTop: 4, borderTop: '1px solid #2a2a3a', paddingTop: 6 }}>
              <SectionLabel>Procedimiento:</SectionLabel>
              {resultado.procedimiento.map((step) => (
                <FormulaStep key={step.paso} paso={step} />
              ))}
            </div>
          )}
        </div>
      )}

      {!resultado && !loading && !error && (
        <Placeholder text={
          sources.length === 0
            ? 'No se detectaron fuentes en la netlist de este circuito.'
            : 'Selecciona una fuente y presiona Transformar.'
        } />
      )}
    </div>
  );
}

// Micro-componentes privados 
function SectionLabel({ children }) {
  return (
    <p style={{ fontSize: 11, color: '#5a6278', margin: '4px 0 0', fontWeight: 500 }}>
      {children}
    </p>
  );
}

function DivisorRow({ compId, onCompIdChange, placeholder, loading, onCalculate, btnLabel }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <label style={{ fontSize: 10, color: '#5a6278' }}>ID componente objetivo</label>
        <input
          style={{ ...INPUT_STYLE, width: 100 }}
          value={compId}
          onChange={(e) => onCompIdChange(e.target.value.toUpperCase())}
          placeholder={placeholder}
        />
      </div>
      <CalcButton onClick={onCalculate} loading={loading}>{btnLabel}</CalcButton>
    </div>
  );
}