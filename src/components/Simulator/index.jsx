import { CircuitSVG } from '../../utils/circuitSVG';
import { getDifficultyClass } from '../../utils/difficulty';
import { useSimTime } from '../../hooks/useSimTime';
import { AccordionSection } from './AccordionSection';
import { WaveformChart } from './WaveformChart';
import { SimulatorSidebar } from './SimulatorSidebar';

export function Simulator({ state, dispatch }) {
  const { selectedCircuit: c, simStatus, activeTab } = state;
  const simTime = useSimTime();

  if (!c) return null;

  const isActive = simStatus === 'activo';
  const power    = parseFloat((c.voltage * c.current).toFixed(2));
  const diffClass = getDifficultyClass(c.difficulty);

  const metrics = [
    { val: `${c.voltage}V`,      label: 'Voltaje' },
    { val: `${c.current}A`,      label: 'Corriente' },
    { val: `${c.resistance}Ω`,   label: 'Resistencia' },
    { val: `${power}W`,          label: 'Potencia' },
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
              <span className="circuit-name">{c.name}</span>
              <span className={`status-pill ${diffClass}`}>{c.difficulty}</span>
            </div>

            <div className="circuit-svg-wrap">
              <button className="export-btn">↓ Exportar PNG</button>
              <CircuitSVG circuit={c} />
            </div>

            <div className="sim-controls">
              <button className="control-btn primary" onClick={() => dispatch('SIM_INICIAR')} disabled={isActive}>
                ▶ Iniciar
              </button>
              <button className="control-btn" onClick={() => dispatch('SIM_PAUSAR')} disabled={simStatus !== 'activo'}>
                ⏸ Pausar
              </button>
              <button className="control-btn" onClick={() => dispatch('SIM_REINICIAR')}>
                ↺ Reiniciar
              </button>
            </div>
          </div>

          {/* Descripción + métricas + análisis */}
          <div className="sim-panel p-5">
            <div className="desc-header">
              <span style={{fontSize:14}}>ℹ</span>
              <span className="desc-header-text">Descripción</span>
            </div>
            <p className="circuit-desc">
              Circuito {c.type.toLowerCase()} — {c.topic} · {c.unit}
            </p>

            <div className="metric-grid">
              {metrics.map((m) => (
                <div key={m.label} className="metric-card">
                  <div className="metric-val">{m.val}</div>
                  <div className="metric-lbl">{m.label}</div>
                </div>
              ))}
            </div>

            <div className="tabs-row">
              {[{ id: 'calcs', label: '⊞ Cálculos' }, { id: 'graficas', label: '📊 Gráficas' }].map((tab) => (
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
              <WaveformChart circuit={c} isActive={isActive} />
            ) : (
              <div className="accordions">
                <AccordionSection id="nodal" title="Análisis Nodal/Mallas DC" icon="⚡" state={state} dispatch={dispatch}>
                  <div className="analysis-content">
                    <p>Nodo A: V_A = {c.voltage}V</p>
                    <p>Malla 1: {c.current}·R₁ + {c.current}·R₂ = {c.voltage}</p>
                    <p>Corriente total: I = V/R = {c.voltage}/{c.resistance} = {(c.voltage / c.resistance).toFixed(3)}A</p>
                  </div>
                </AccordionSection>

                <AccordionSection id="transitorio" title="Análisis Transitorio" icon="∿" state={state} dispatch={dispatch}>
                  <div className="analysis-content">
                    <p>Tiempo de subida: {(c.R * 0.23).toFixed(1)}ms</p>
                    <p>Tiempo de establecimiento: {(c.R * 0.42).toFixed(1)}ms</p>
                    <p>Sobrepaso: {(c.C * 1.3 + 2).toFixed(1)}%</p>
                    <p>Constante de tiempo: τ = {(c.R * c.C * 0.1).toFixed(3)}ms</p>
                  </div>
                </AccordionSection>

                <AccordionSection id="general" title="Cálculos Generales" icon="Σ" state={state} dispatch={dispatch}>
                  <div className="analysis-content">
                    <p>Potencia disipada: P = {power}W</p>
                    <p>Energía acumulada (1s): E = {power}J</p>
                    <p>Resistencia equivalente: R_eq = {c.resistance}Ω</p>
                  </div>
                </AccordionSection>

                <AccordionSection id="leyes" title="Leyes Fundamentales" icon="☰" state={state} dispatch={dispatch}>
                  <div className="analysis-content">
                    <p>Ley de Ohm: V = I·R → {c.voltage} = {c.current}·{(c.voltage / c.current).toFixed(1)}</p>
                    <p>KVL: ΣV = 0 en cada malla cerrada</p>
                    <p>KCL: ΣI = 0 en cada nodo</p>
                    <p>Potencia: P = V·I = I²·R = V²/R</p>
                  </div>
                </AccordionSection>
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
