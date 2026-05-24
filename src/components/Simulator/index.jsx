/**
 * Vista principal del simulador - Compone los sub-componentes y 
 * conecta el estado del Mediator con la UI.
 *
 *   useCircuitFlags      -> que analisis/botones aplican
 *   SimActionButtons     -> estado de configuracion de simulaciones
 *   TRANControlPanel     -> estado de la animacion transitoria
 *   AnalysisAccordions   -> paneles de analisis condicionales
 *   format.js            -> formato de magnitudes fisicas
 */
import { useRef, useState, useEffect }       from 'react';
import { toPng }                  from 'html-to-image';

import { CircuitSVG }             from '../../utils/circuitSVG';
import { getDifficultyClass }     from '../../utils/difficulty';
import { useSimTime }             from '../../hooks/useSimTime';
import { AccordionSection }       from './AccordionSection';
import { WaveformChart }          from './WaveformChart';
import { SimulatorSidebar }       from './SimulatorSidebar';
import { Circuit }                from '../../domain';
import { CircuitEditProvider }    from '../../core/CircuitEditContext';

import { useCircuitFlags }        from '../../hooks/useCircuitFlags.js';
import { DCButton, ACButton, TRANButton } from '../SimActionButtons.jsx';
import { TRANControlPanel }       from '../TransControlPanel.jsx';
import { AnalysisAccordions }     from '../AnalysisAccordions.jsx';
import { formatValue }            from './models/ComponentValueLabel.jsx';
import { fmtV, fmtA, fmtAuto, findPeakSnapshotIndex, expandirCorrientes } from '../../utils/format.js';

// Constantes
const TRAN_SPEED_DEFAULT = 0.05;

// Componente principal

/**
 * @param {{ state: object, dispatch: Function, api: object }} props
 */
export function Simulator({ state, dispatch, api }) {
  const {
    selectedCircuit,
    simStatus,
    activeTab,
    simResultadoDC,
    simResultadoAC,
    simResultadoTRAN,
    simError,
    loading,
    netlist,
    teoremaResultado,
    analisisResultado,
    analisisError,
    procedimientoDC,
    procedimientoAC,
    procedimientoTRAN,
  } = state;

  const svgContainerRef = useRef(null);
  const simTime         = useSimTime();

  // Estado local de animacion
  const [tranSpeed,  setTranSpeed]  = useState(TRAN_SPEED_DEFAULT);
  const [tranPaused, setTranPaused] = useState(false);

  if (!selectedCircuit) return null;

  const circuit = selectedCircuit instanceof Circuit
    ? selectedCircuit
    : Circuit.fromAny(selectedCircuit);

  const flags    = useCircuitFlags(circuit, netlist);
  const isActive = simStatus === 'activo';

  const isRunningDC   = loading?.simulacionDC;
  const isRunningAC   = loading?.simulacionAC;
  const isRunningTRAN = loading?.simulacionTRAN;

  const hasTranResults =
    simResultadoTRAN && Array.isArray(simResultadoTRAN) && simResultadoTRAN.length > 0;
  const hasSimButtons  =
    netlist.length > 0 && (flags.showDC || flags.showAC || flags.showTRAN);

  const [mostrarInterpretacion, setMostrarInterpretacion] = useState(false);

  return (
    <div className="page-container">
      <SimNav onBack={() => dispatch('GO_LIBRARY')} />

      <div className="sim-layout">
        <div className="sim-main">

          {/* Diagrama */}
          <div className="sim-panel p-5">
            <CircuitHeader circuit={circuit} />

            <div className="circuit-svg-wrap" ref={svgContainerRef}>
              <button className="export-btn" onClick={() => exportToPNG(svgContainerRef, circuit.id)}>
                ↓ Exportar PNG
              </button>
              <span className="caption-text">
                Usa los nombres de los pines que aparecen en el simulador como referencia para entender la conexión lógica. No tomes la disposición gráfica como una guía literal para el armado físico.
              </span>
              <CircuitEditProvider locked={isActive}>
                <CircuitSVG
                  circuit={circuit}
                  energized={isActive}
                  dcResults={simResultadoDC}
                  tranResults={simResultadoTRAN}
                  tranSpeed={tranSpeed}
                  tranPaused={tranPaused}
                />
              </CircuitEditProvider>
            </div>

            {/* Controles del simulador visual */}
            <div className="sim-controls">
              <button className="control-btn primary" onClick={() => dispatch('SIM_INICIAR')}  disabled={isActive}>▶ Iniciar</button>
              <button className="control-btn"         onClick={() => dispatch('SIM_PAUSAR')}   disabled={simStatus !== 'activo'}>⏸ Pausar</button>
              <button className="control-btn"         onClick={() => dispatch('SIM_REINICIAR')}>↺ Reiniciar</button>
            </div>

            {/* Botones de simulacion via API */}
            {hasSimButtons && (
              <div style={{ marginTop: 8 }}>
                <div className="sim-controls">
                  {flags.showDC   && <DCButton   isActive={isActive} isRunning={isRunningDC}   onSimulate={api.simularDC} />}
                  {flags.showAC   && <ACButton   isActive={isActive} isRunning={isRunningAC}   onSimulate={api.simularAC} />}
                  {flags.showTRAN && <TRANButton isActive={isActive} isRunning={isRunningTRAN} onSimulate={api.simularTransitorio} />}
                </div>
                {!isActive && <EnergizeWarning />}
              </div>
            )}

            {/* Control de animacion transitoria */}
            {hasTranResults && (
              <TRANControlPanel
                tranResults={simResultadoTRAN}
                speed={tranSpeed}
                paused={tranPaused}
                onSpeedChange={setTranSpeed}
                onTogglePause={() => setTranPaused((p) => !p)}
              />
            )}

            {simError && <SimErrorBanner message={simError} />}
          </div>

          {/* Estado del simulador */}
          <SimulatorSidebar
            circuit={circuit}
            simStatus={simStatus}
            simTime={simTime}
            netlist={netlist}
          />

          {/* Descripcion + resultados + analisis */}
          <div className="sim-panel p-5">
            <div className="desc-header">
                <span style={{ fontSize: 14 }}>ℹ</span>
                <span className="desc-header-text">Descripción</span>

              {/* Botón para mostrar/ocultar la interpretación */}
              <button 
                className="control-btn primary" 
                style={{ padding: '4px 12px', fontSize: '0.85rem' }}
                onClick={() => setMostrarInterpretacion(!mostrarInterpretacion)}
              >
                {mostrarInterpretacion ? 'Ocultar interpretación' : 'Interpretación de valores en los cálculos'}
              </button>
            </div>

            <p className="circuit-desc">
              {circuit.descripcion ?? `Circuito — ${circuit.unidad_tematica} · ${circuit.materia}`}
            </p>

            {/* Recuadro informativo que se despliega */}
            {mostrarInterpretacion && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)', // Fondo sutil adaptado al modo oscuro
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '12px 16px',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                lineHeight: '1.5'
              }}>
                <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '8px' }}>
                  💡 Guía de signos numéricos:
                </strong>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li style={{ marginBottom: '6px' }}>
                    <strong>Corriente:</strong> El signo en la corriente indica el sentido del flujo. Si el signo es positivo (+), significa que la corriente fluye desde el Pin 1 hacia el Pin 2. Si el signo es negativo (-), la corriente fluye desde el Pin 2 hacia el Pin 1.
                  </li>
                  <ul>
                    <li>
                      <strong>Para componentes de 3 pines</strong> la regla es parecida. Si el signo es positivo (+) la corriente fluye desde el pin hacia afuera. Si el signo es negativo (-), la corriente fluye desde el pin hacia adentro.
                    </li>
                  </ul>
                  <li style={{ marginBottom: '6px' }}>
                    <strong>Voltaje:</strong> Si el signo es negativo (-), indica una inversión en la polaridad respecto al nodo de referencia (Tierra), lo cual es común en mediciones inversas o fuentes de voltaje negativo.
                  </li>
                </ul>
              </div>
            )}

            {/* Resultados de simulacion */}
            {simResultadoDC && <DCResultBlock resultado={simResultadoDC} netlist={netlist} />}
            {simResultadoAC && Array.isArray(simResultadoAC) && <ACResultBlock resultado={simResultadoAC} />}
            {hasTranResults && <TRANResultBlock resultado={simResultadoTRAN} />}

            {/* Pestañas */}
            <div className="tabs-row">
              {[
                { id: 'calcs',    label: '⊞ Cálculos' },
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
              <WaveformChart
                circuit={circuit}
                isActive={isActive}
                acData={simResultadoAC}
                dcData={simResultadoDC}
                tranData={simResultadoTRAN}
                netlist={netlist}
              />
            ) : (
              <AnalysisAccordions
                circuit={circuit}
                state={state}
                dispatch={dispatch}
                api={api}
                netlist={netlist}
                analisisResultado={analisisResultado}
                teoremaResultado={teoremaResultado}
                simResultadoDC={simResultadoDC}
                procedimientoDC={procedimientoDC}
                procedimientoAC={procedimientoAC}
                procedimientoTRAN={procedimientoTRAN}
                loading={loading}
                simError={simError}
                analisisError={analisisError}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-componentes de presentacion

function SimNav({ onBack }) {
  return (
    <nav className="sim-nav">
      <button className="nav-back" onClick={onBack}>← Volver a Circuitos</button>
      <div>
        <h1 className="sim-title">Simulador</h1>
        <p className="sim-subtitle">Experimenta con el circuito seleccionado</p>
      </div>
    </nav>
  );
}

function CircuitHeader({ circuit }) {
  const diffClass = getDifficultyClass(circuit.dificultad);
  return (
    <div className="circuit-header">
      <span className="circuit-icon">⚡</span>
      <span className="circuit-name">{circuit.nombre}</span>
      {circuit.dificultad && (
        <span className={`status-pill ${diffClass}`}>{circuit.dificultad}</span>
      )}
    </div>
  );
}

function EnergizeWarning() {
  return (
    <p style={{ marginTop: 8, fontSize: 12, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 6 }}>
      <span>⚠</span> Primero debes energizar el circuito presionando <strong>▶ Iniciar</strong>
    </p>
  );
}

function SimErrorBanner({ message }) {
  return (
    <div style={{
      marginTop: 10, padding: '8px 12px',
      background: '#3a1a1a', border: '1px solid #c0392b',
      borderRadius: 6, color: '#e74c3c', fontSize: 13,
    }}>
      ⚠ {message}
    </div>
  );
}

// Bloques de resultado

function DCResultBlock({ resultado, netlist }) {
  return (
    <div style={{ margin: '12px 0', padding: '12px 14px', background: '#0a1f12', border: '1px solid #16543a', borderRadius: 8 }}>
      <p style={{ color: '#4ade80', fontWeight: 600, marginBottom: 8, fontSize: 13 }}>✓ Resultado DC</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
        {Object.entries(resultado.voltages ?? {}).map(([node, v]) => (
          <p key={node} style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
            <span style={{ color: '#64748b' }}>V(nodo {node})</span>{' '}
            <span style={{ color: '#a78bfa', fontFamily: 'monospace', fontWeight: 600 }}>{fmtV(v)}</span>
          </p>
        ))}
        {expandirCorrientes(resultado.currents, netlist).map(({ label, value }) => (
          <p key={label} style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
            <span style={{ color: '#64748b' }}>{label}</span>{' '}
            <span style={{ color: '#4ade80', fontFamily: 'monospace', fontWeight: 600 }}>{fmtA(value)}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

function ACResultBlock({ resultado }) {
  return (
    <div style={{ margin: '12px 0', padding: '10px 14px', background: '#0d1e2b', border: '1px solid #2980b9', borderRadius: 6 }}>
      <p style={{ color: '#3498db', fontWeight: 600, marginBottom: 4 }}>
        Resultado AC — {resultado.length} puntos de frecuencia
      </p>
      <p style={{ fontSize: 12, color: '#aaa' }}>
        f={formatValue(resultado[0]?.frecuencia, 'Hz')} → f={formatValue(resultado[resultado.length - 1]?.frecuencia, 'Hz')}
      </p>
    </div>
  );
}

function TRANResultBlock({ resultado }) {
  const peakIdx = findPeakSnapshotIndex(resultado);
  const snap    = resultado[peakIdx];
  const nodes   = Object.keys(snap?.voltajes ?? {}).filter((n) => n !== '0').sort();

  return (
    <div style={{ margin: '12px 0', padding: '10px 14px', background: '#1e2613', border: '1px solid #5fb338', borderRadius: 6 }}>
      <p style={{ color: '#7fcc4b', fontWeight: 600, marginBottom: 4 }}>
        Resultado Transitorio — {resultado.length} snapshots
      </p>
      <p style={{ fontSize: 12, color: '#aaa', marginBottom: 6 }}>
        t = {formatValue(resultado[0]?.tiempo, 's')} → t = {formatValue(resultado[resultado.length - 1]?.tiempo, 's')}
        {' · '}Δt = {formatValue((resultado[1]?.tiempo - resultado[0]?.tiempo) || 0, 's')}
      </p>
      {snap?.voltajes && (
        <details>
          <summary style={{ fontSize: 11, color: '#888', cursor: 'pointer' }}>
            Snapshot en el pico de actividad (t = {formatValue(snap.tiempo, 's')})
          </summary>
          <div style={{ marginTop: 6, fontSize: 11, fontFamily: 'monospace', color: '#bbb' }}>
            {nodes.map((n) => (
              <span key={n} style={{ display: 'inline-block', marginRight: 12 }}>
                V({n}) = {formatValue(Number(snap.voltajes[n]) || 0, 'V')}
              </span>
            ))}
          </div>
          <div style={{ marginTop: 4, fontSize: 10, color: '#666', fontStyle: 'italic' }}>
            Para ver toda la evolución temporal, abrí la pestaña 📊 Gráficas.
          </div>
        </details>
      )}
    </div>
  );
}

// Utilidades

async function exportToPNG(containerRef, circuitId) {
  if (!containerRef.current) return;
  const svgElement = containerRef.current.querySelector('svg');
  if (!svgElement) { console.warn('No se encontró el SVG para exportar'); return; }

  try {
    const dataUrl = await toPng(svgElement, { backgroundColor: '#16181d', pixelRatio: 2, cacheBust: true });
    const link    = document.createElement('a');
    link.download = `circuito_${circuitId || 'export'}.png`;
    link.href     = dataUrl;
    link.click();
  } catch (error) {
    console.error('Error al generar PNG:', error);
  }
}