import { CircuitSVG }        from '../../utils/circuitSVG';
import { getDifficultyClass } from '../../utils/difficulty';
import { useSimTime }         from '../../hooks/useSimTime';
import { AccordionSection }   from './AccordionSection';
import { WaveformChart }      from './WaveformChart';
import { SimulatorSidebar }   from './SimulatorSidebar';
import { TeoremasPanel }       from './TeoremasPanel';

/**
 * Normaliza un circuito independientemente de si viene del dataset local
 * (name, difficulty, R, C…) o de la API (nombre_circuito, dificultad, netlist…).
 */
function normalizar(c, netlist) {
  const name       = c.name ?? c.nombre_circuito ?? c.nombre ?? '—';
  const difficulty = c.difficulty ?? c.dificultad ?? '';
  const unit       = c.unit ?? c.materia ?? '';
  const topic      = c.topic ?? c.unidad_tematica ?? '';
  const desc       = c.descripcion ?? c.description ?? null;

  // Métricas: preferir campos locales; si son de la API, calcular desde netlist
  let voltage    = c.voltage    ?? 0;
  let current    = c.current    ?? 0;
  let resistance = c.resistance ?? 0;

  // Para circuitos de la API, extraer valor de la primera fuente de voltaje
  if (!voltage && Array.isArray(netlist) && netlist.length > 0) {
    const fv = netlist.find((n) => n.type === 'fuente_voltaje');
    if (fv) voltage = parseFloat(fv.value) || 0;
    const fc = netlist.find((n) => n.type === 'fuente_corriente');
    if (fc) current = parseFloat(fc.value) || 0;
    // R equivalente: primera resistencia como referencia
    const r = netlist.find((n) => n.type === 'resistencia');
    if (r) resistance = parseFloat(r.value) || 0;
  }

  return { name, difficulty, unit, topic, desc, voltage, current, resistance };
}

/**
 * Simulator — Vista del simulador activo.
 * Recibe state, dispatch y api desde App a través del Mediator.
 * No llama directamente a ningún servicio; todo pasa por api.*.
 *
 * @param {{ state: object, dispatch: Function, api: object }} props
 */
export function Simulator({ state, dispatch, api }) {
  const {
    selectedCircuit: c,
    simStatus,
    activeTab,
    simResultadoDC,
    simResultadoAC,
    simError,
    loading,
    netlist,
    teoremaResultado,
  } = state;

  const simTime = useSimTime();

  if (!c) return null;

  // Normalizar campos independientemente del origen (local vs API)
  const norm = normalizar(c, netlist);

  const isActive    = simStatus === 'activo';
  const diffClass   = getDifficultyClass(norm.difficulty);
  const voltage     = norm.voltage;
  const current     = norm.current;
  const resistance  = norm.resistance;
  const power       = parseFloat((voltage * current).toFixed(2));

  const isRunningDC = loading?.simulacionDC;
  const isRunningAC = loading?.simulacionAC;

  const metrics = [
    { val: voltage    ? `${voltage}V`    : '—', label: 'Voltaje'      },
    { val: current    ? `${current}A`    : '—', label: 'Corriente'    },
    { val: resistance ? `${resistance}Ω` : '—', label: 'Resistencia'  },
    { val: power      ? `${power}W`      : '—', label: 'Potencia'     },
  ];

  return (
    <div className="page-container">
      {/* Nav */}
      <nav className="sim-nav">
        <button className="nav-back" onClick={() => dispatch('GO_LIBRARY')}>
          ← Volver a Circuitos
        </button>
        <div>
          <h1 className="sim-title">Simulador</h1>
          <p className="sim-subtitle">Experimenta con el circuito seleccionado</p>
        </div>
      </nav>

      <div className="sim-layout">
        {/* Panel principal */}
        <div className="sim-main">

          {/* Diagrama */}
          <div className="sim-panel p-5">
            <div className="circuit-header">
              <span className="circuit-icon">⚡</span>
              <span className="circuit-name">{norm.name}</span>
              {norm.difficulty && (
                <span className={`status-pill ${diffClass}`}>{norm.difficulty}</span>
              )}
            </div>

            <div className="circuit-svg-wrap">
              <button className="export-btn">↓ Exportar PNG</button>
              <CircuitSVG circuit={c} />
            </div>

            {/* Controles de simulación visual (timer local) */}
            <div className="sim-controls">
              <button
                className="control-btn primary"
                onClick={() => dispatch('SIM_INICIAR')}
                disabled={isActive}
              >
                ▶ Iniciar
              </button>
              <button
                className="control-btn"
                onClick={() => dispatch('SIM_PAUSAR')}
                disabled={simStatus !== 'activo'}
              >
                ⏸ Pausar
              </button>
              <button className="control-btn" onClick={() => dispatch('SIM_REINICIAR')}>
                ↺ Reiniciar
              </button>
            </div>

            {/* Controles de simulación via API */}
            {netlist.length > 0 && (
              <div className="sim-controls" style={{ marginTop: 8 }}>
                <button
                  className="control-btn primary"
                  onClick={() => api.simularDC()}
                  disabled={isRunningDC}
                >
                  {isRunningDC ? '⏳ Simulando…' : '⚡ Simular DC'}
                </button>
                <button
                  className="control-btn"
                  onClick={() =>
                    api.simularAC({
                      configuracion_ac: {
                        f_inicial: 10,
                        f_final: 100000,
                        puntos: 50,
                        barrido: 'log',
                      },
                    })
                  }
                  disabled={isRunningAC}
                >
                  {isRunningAC ? '⏳ Simulando…' : '∿ Simular AC'}
                </button>
              </div>
            )}

            {/* Error de simulación */}
            {simError && (
              <div
                style={{
                  marginTop: 10,
                  padding: '8px 12px',
                  background: '#3a1a1a',
                  border: '1px solid #c0392b',
                  borderRadius: 6,
                  color: '#e74c3c',
                  fontSize: 13,
                }}
              >
                ⚠ {simError}
              </div>
            )}
          </div>

          {/* Descripción + métricas + análisis */}
          <div className="sim-panel p-5">
            <div className="desc-header">
              <span style={{ fontSize: 14 }}>ℹ</span>
              <span className="desc-header-text">Descripción</span>
            </div>
            <p className="circuit-desc">
              {norm.desc
                ? norm.desc
                : `Circuito ${(c.type ?? '').toLowerCase()} — ${norm.topic} · ${norm.unit}`}
            </p>

            <div className="metric-grid">
              {metrics.map((m) => (
                <div key={m.label} className="metric-card">
                  <div className="metric-val">{m.val}</div>
                  <div className="metric-lbl">{m.label}</div>
                </div>
              ))}
            </div>

            {/* Resultado DC */}
            {simResultadoDC && (
              <div
                style={{
                  margin: '12px 0',
                  padding: '12px 14px',
                  background: '#0a1f12',
                  border: '1px solid #16543a',
                  borderRadius: 8,
                }}
              >
                <p style={{ color: '#4ade80', fontWeight: 600, marginBottom: 8, fontSize: 13 }}>
                  ✓ Resultado DC
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                  {Object.entries(simResultadoDC.voltages ?? {}).map(([nodo, v]) => (
                    <p key={nodo} style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                      <span style={{ color: '#64748b' }}>V(nodo {nodo})</span>{' '}
                      <span style={{ color: '#a78bfa', fontFamily: 'monospace', fontWeight: 600 }}>
                        {Number(v).toFixed(4)} V
                      </span>
                    </p>
                  ))}
                  {Object.entries(simResultadoDC.currents ?? {}).map(([id, i]) => (
                    <p key={id} style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                      <span style={{ color: '#64748b' }}>I({id})</span>{' '}
                      <span style={{ color: '#4ade80', fontFamily: 'monospace', fontWeight: 600 }}>
                        {Number(i).toFixed(6)} A
                      </span>
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Resultado AC — resumen */}
            {simResultadoAC && Array.isArray(simResultadoAC) && (
              <div
                style={{
                  margin: '12px 0',
                  padding: '10px 14px',
                  background: '#0d1e2b',
                  border: '1px solid #2980b9',
                  borderRadius: 6,
                }}
              >
                <p style={{ color: '#3498db', fontWeight: 600, marginBottom: 4 }}>
                  Resultado AC — {simResultadoAC.length} puntos de frecuencia
                </p>
                <p style={{ fontSize: 12, color: '#aaa' }}>
                  f={simResultadoAC[0]?.frecuencia}Hz →{' '}
                  f={simResultadoAC[simResultadoAC.length - 1]?.frecuencia}Hz
                </p>
              </div>
            )}

            <div className="tabs-row">
              {[
                { id: 'calcs',   label: '⊞ Cálculos' },
                { id: 'graficas', label: '📊 Gráficas' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => dispatch('SET_TAB', tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'graficas' ? (
              <WaveformChart circuit={c} isActive={isActive} acData={simResultadoAC} />
            ) : (
              <div className="accordions">
                <AccordionSection id="nodal" title="Análisis Nodal/Mallas DC" icon="⚡" state={state} dispatch={dispatch}>
                  <div className="analysis-content">
                    <p>Nodo A: V_A = {voltage}V</p>
                    <p>Malla 1: {current}·R₁ + {current}·R₂ = {voltage}</p>
                    <p>Corriente total: I = V/R = {voltage}/{resistance} = {resistance > 0 ? (voltage / resistance).toFixed(3) : '—'}A</p>
                  </div>
                </AccordionSection>

                <AccordionSection id="transitorio" title="Análisis Transitorio" icon="∿" state={state} dispatch={dispatch}>
                  <div className="analysis-content">
                    <p>Tiempo de subida: {((c.R ?? 0) * 0.23).toFixed(1)}ms</p>
                    <p>Tiempo de establecimiento: {((c.R ?? 0) * 0.42).toFixed(1)}ms</p>
                    <p>Sobrepaso: {((c.C ?? 0) * 1.3 + 2).toFixed(1)}%</p>
                    <p>Constante de tiempo: τ = {((c.R ?? 0) * (c.C ?? 0) * 0.1).toFixed(3)}ms</p>
                  </div>
                </AccordionSection>

                <AccordionSection id="general" title="Cálculos Generales" icon="Σ" state={state} dispatch={dispatch}>
                  <div className="analysis-content">
                    <p>Potencia disipada: P = {power}W</p>
                    <p>Energía acumulada (1s): E = {power}J</p>
                    <p>Resistencia equivalente: R_eq = {resistance}Ω</p>
                  </div>
                </AccordionSection>

                <AccordionSection id="leyes" title="Leyes Fundamentales" icon="☰" state={state} dispatch={dispatch}>
                  <div className="analysis-content">
                    <p>Ley de Ohm: V = I·R → {voltage} = {current}·{current > 0 ? (voltage / current).toFixed(1) : '—'}</p>
                    <p>KVL: ΣV = 0 en cada malla cerrada</p>
                    <p>KCL: ΣI = 0 en cada nodo</p>
                    <p>Potencia: P = V·I = I²·R = V²/R</p>
                  </div>
                </AccordionSection>

                {/* Thévenin / Norton */}
                {netlist.length > 0 && (
                  <AccordionSection id="thevenin" title="Thévenin / Norton" icon="⊛" state={state} dispatch={dispatch}>
                    <TeoremasPanel
                      tipo="thevenin-norton"
                      resultado={teoremaResultado?.tipo === 'thevenin-norton' ? teoremaResultado : null}
                      loading={loading?.teorema}
                      error={simError}
                      onCalcular={(componenteCargaId) => api.calcularTheveninNorton({ componenteCargaId })}
                    />
                  </AccordionSection>
                )}

                {/* Superposición */}
                {netlist.length > 0 && (
                  <AccordionSection id="superposicion" title="Superposición" icon="∑" state={state} dispatch={dispatch}>
                    <TeoremasPanel
                      tipo="superposicion"
                      resultado={teoremaResultado?.tipo === 'superposicion' ? teoremaResultado : null}
                      loading={loading?.teorema}
                      error={simError}
                      onCalcular={(componenteObjetivoId, parametroAnalisis) =>
                        api.calcularSuperposicion({ componenteObjetivoId, parametroAnalisis })
                      }
                    />
                  </AccordionSection>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <SimulatorSidebar circuit={c} simStatus={simStatus} simTime={simTime} netlist={netlist} />
      </div>
    </div>
  );
}