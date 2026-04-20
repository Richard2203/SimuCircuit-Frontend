import { CircuitSVG }        from '../../utils/circuitSVG';
import { getDifficultyClass } from '../../utils/difficulty';
import { useSimTime }         from '../../hooks/useSimTime';
import { AccordionSection }   from './AccordionSection';
import { WaveformChart }      from './WaveformChart';
import { SimulatorSidebar }   from './SimulatorSidebar';
import { TeoremasPanel }       from './TeoremasPanel';

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

  const isActive   = simStatus === 'activo';
  const diffClass  = getDifficultyClass(c.difficulty);
  const voltage    = c.voltage ?? 0;
  const current    = c.current ?? 0;
  const resistance = c.resistance ?? 0;
  const power      = parseFloat((voltage * current).toFixed(2));

  const isRunningDC = loading?.simulacionDC;
  const isRunningAC = loading?.simulacionAC;

  const metrics = [
    { val: `${voltage}V`,      label: 'Voltaje' },
    { val: `${current}A`,      label: 'Corriente' },
    { val: `${resistance}Ω`,   label: 'Resistencia' },
    { val: `${power}W`,        label: 'Potencia' },
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
              <span className="circuit-name">{c.name ?? c.nombre_circuito}</span>
              <span className={`status-pill ${diffClass}`}>{c.difficulty ?? c.dificultad}</span>
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
              {c.descripcion
                ? c.descripcion
                : `Circuito ${(c.type ?? '').toLowerCase()} — ${c.topic ?? c.unidad_tematica ?? ''} · ${c.unit ?? c.materia ?? ''}`}
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
                  padding: '10px 14px',
                  background: '#0d2b1a',
                  border: '1px solid #27ae60',
                  borderRadius: 6,
                }}
              >
                <p style={{ color: '#2ecc71', fontWeight: 600, marginBottom: 6 }}>
                  Resultado DC
                </p>
                <p style={{ fontSize: 12, color: '#aaa' }}>
                  Voltajes:{' '}
                  {Object.entries(simResultadoDC.voltages ?? {})
                    .map(([n, v]) => `V${n}=${v}V`)
                    .join('  ')}
                </p>
                <p style={{ fontSize: 12, color: '#aaa' }}>
                  Corrientes:{' '}
                  {Object.entries(simResultadoDC.currents ?? {})
                    .map(([id, i]) => `I(${id})=${i}A`)
                    .join('  ')}
                </p>
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
        <SimulatorSidebar circuit={c} simStatus={simStatus} simTime={simTime} />
      </div>
    </div>
  );
}