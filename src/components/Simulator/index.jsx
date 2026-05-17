import { toPng } from 'html-to-image';
import { useRef, useState } from 'react';
import { CircuitSVG }         from '../../utils/circuitSVG';
import { getDifficultyClass } from '../../utils/difficulty';
import { useSimTime }         from '../../hooks/useSimTime';
import { AccordionSection }   from './AccordionSection';
import { WaveformChart }      from './WaveformChart';
import { SimulatorSidebar }   from './SimulatorSidebar';
import { TeoremasPanel }      from './TeoremasPanel';
import { Circuit }            from '../../domain';
import { CircuitEditProvider } from '../../core/CircuitEditContext';
import { formatValue }        from './models/ComponentValueLabel.jsx';

/* Helpers de formato: notacion de ingenieria
 */
const fmtV    = (v)         => formatValue(Number(v), 'V');
const fmtA    = (v)         => formatValue(Number(v), 'A');
const fmtOhm  = (v)         => formatValue(Number(v), 'Ω');
const fmtAuto = (v, unit='') => formatValue(Number(v), unit);

/**
 * Simulator — Vista del simulador para un circuito seleccionado.
 *
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
  const simTime = useSimTime();

  // Estado local de la animacion transitoria.
  const [tranSpeed, setTranSpeed] = useState(0.05);
  const [tranPaused, setTranPaused] = useState(false);

  if (!selectedCircuit) return null;

  /** @type {Circuit} */
  const c = selectedCircuit instanceof Circuit
    ? selectedCircuit
    : Circuit.fromAny(selectedCircuit);

  const exportToPNG = async () => {
    if (!svgContainerRef.current) return;
    const svgElement = svgContainerRef.current.querySelector('svg');
    if (!svgElement) {
      console.warn('No se encontró el SVG para exportar');
      return;
    }
    try {
      const dataUrl = await toPng(svgElement, {
        backgroundColor: '#16181d',
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `circuito_${c.id || 'export'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error al generar PNG:', error);
    }
  };

  const isActive  = simStatus === 'activo';
  const diffClass = getDifficultyClass(c.dificultad);

  const isRunningDC = loading?.simulacionDC;
  const isRunningAC = loading?.simulacionAC;
  const isRunningTRAN = loading?.simulacionTRAN;

  // Deteccion de dispositivos no lineales: BJT (Q), FET (J), diodos/LED (D),
  // reguladores (U). 
  const _cc = c.componentCounts;
  const _hayNoLineales = _cc.D > 0 || _cc.Q > 0 || _cc.J > 0 || _cc.U > 0;

  // Botones visibles segun las fuentes y los componentes presentes en la netlist:
  //   - DC siempre que haya fuente DC: punto de operación estable, válido siempre.
  //   - AC solo en circuitos lineales (RC/RL/RLC). 
  //   - TRAN cuando hay AC + no lineales (BJT/FET como interruptor, rectificadores,
  //     LED controlado, etc): analisis correcto para gran señal y switching.
  const mostrarDC   = c.tieneDC;
  const mostrarAC   = c.tieneAC && !_hayNoLineales;
  const mostrarTRAN = c.tieneAC &&  _hayNoLineales;

  return (
    <div className="page-container">
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
        <div className="sim-main">

          {/* Diagrama */}
          <div className="sim-panel p-5">
            <div className="circuit-header">
              <span className="circuit-icon">⚡</span>
              <span className="circuit-name">{c.nombre}</span>
              {c.dificultad && (
                <span className={`status-pill ${diffClass}`}>{c.dificultad}</span>
              )}
            </div>

            <div className="circuit-svg-wrap" ref={svgContainerRef}>
              <button className="export-btn" onClick={exportToPNG}>↓ Exportar PNG</button>
              <span className="caption-text">
                Usa los nombres de los pines que aparecen en el simulador como referencia para entender la conexión lógica. No tomes la disposición gráfica como una guía literal para el armado físico.
              </span>
              <CircuitEditProvider locked={isActive}>
                <CircuitSVG
                  circuit={c}
                  energized={isActive}
                  dcResults={simResultadoDC}
                  tranResults={simResultadoTRAN}
                  tranSpeed={tranSpeed}
                  tranPaused={tranPaused}
                />
              </CircuitEditProvider>
            </div>

            {/* Controles visuales (timer local) */}
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

            {/* Controles de simulacion via API */}
            {netlist.length > 0 && (mostrarDC || mostrarAC || mostrarTRAN) && (
              <div style={{ marginTop: 8 }}>
                <div className="sim-controls">
                  {mostrarDC && (
                    <button
                      className="control-btn primary"
                      onClick={() => api.simularDC()}
                      disabled={!isActive || isRunningDC}
                      title="Análisis DC: calcula el punto de operación del circuito en régimen estable (fuentes constantes). Capacitores → circuito abierto, bobinas → cortocircuito. Devuelve un único valor de voltaje y corriente por nodo/componente."
                    >
                      {isRunningDC ? '⏳ Simulando…' : '⚡ Simular DC'}
                    </button>
                  )}
                  {mostrarAC && (
                    <ACSimularBtn isActive={isActive} isRunning={isRunningAC} onSimular={api.simularAC} />
                  )}
                  {mostrarTRAN && (
                    <TRANSimularBtn isActive={isActive} isRunning={isRunningTRAN} onSimular={api.simularTransitorio} />
                  )}
                </div>
                {!isActive && (
                  <p style={{ marginTop: 8, fontSize: 12, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>⚠</span> Primero debes energizar el circuito presionando <strong>▶ Iniciar</strong>
                  </p>
                )}
              </div>
            )}

            {/* Slider de velocidad de la animacion transitoria.*/}
            {simResultadoTRAN && Array.isArray(simResultadoTRAN) && simResultadoTRAN.length > 0 && (
              <TRANControlPanel
                tranResults={simResultadoTRAN}
                speed={tranSpeed}
                onSpeedChange={setTranSpeed}
                paused={tranPaused}
                onTogglePause={() => setTranPaused(p => !p)}
              />
            )}

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

          {/* Panel de estado del simulador (contexto + estado + componentes). */}
          <SimulatorSidebar circuit={c} simStatus={simStatus} simTime={simTime} netlist={netlist} />

          {/* Descripcion + metricas + analisis */}
          <div className="sim-panel p-5">
            <div className="desc-header">
              <span style={{ fontSize: 14 }}>ℹ</span>
              <span className="desc-header-text">Descripción</span>
            </div>
            <p className="circuit-desc">
              {c.descripcion
                ? c.descripcion
                : `Circuito — ${c.unidad_tematica} · ${c.materia}`}
            </p>

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
                        {fmtV(v)}
                      </span>
                    </p>
                  ))}
                  {Object.entries(simResultadoDC.currents ?? {}).map(([id, i]) => (
                    <p key={id} style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                      <span style={{ color: '#64748b' }}>I({id})</span>{' '}
                      <span style={{ color: '#4ade80', fontFamily: 'monospace', fontWeight: 600 }}>
                        {fmtA(i)}
                      </span>
                    </p>
                  ))}
                </div>
              </div>
            )}

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
                  f={formatValue(simResultadoAC[0]?.frecuencia, 'Hz')} →{' '}
                  f={formatValue(simResultadoAC[simResultadoAC.length - 1]?.frecuencia, 'Hz')}
                </p>
              </div>
            )}

            {simResultadoTRAN && Array.isArray(simResultadoTRAN) && simResultadoTRAN.length > 0 && (
              <div
                style={{
                  margin: '12px 0',
                  padding: '10px 14px',
                  background: '#1e2613',
                  border: '1px solid #5fb338',
                  borderRadius: 6,
                }}
              >
                <p style={{ color: '#7fcc4b', fontWeight: 600, marginBottom: 4 }}>
                  Resultado Transitorio — {simResultadoTRAN.length} snapshots
                </p>
                <p style={{ fontSize: 12, color: '#aaa', marginBottom: 6 }}>
                  t = {formatValue(simResultadoTRAN[0]?.tiempo, 's')} →{' '}
                  t = {formatValue(simResultadoTRAN[simResultadoTRAN.length - 1]?.tiempo, 's')}
                  {' · '}Δt = {formatValue(
                    (simResultadoTRAN[1]?.tiempo - simResultadoTRAN[0]?.tiempo) || 0,
                    's'
                  )}
                </p>
               
                {(() => {
                  const findSnapshotPico = () => {
                    let mejorIdx = Math.floor(simResultadoTRAN.length / 2);
                    let mejorMag = -1;
                    for (let i = 0; i < simResultadoTRAN.length; i++) {
                      const corrs = simResultadoTRAN[i]?.corrientes ?? {};
                      let magMax = 0;
                      for (const v of Object.values(corrs)) {
                        let val;
                        if (typeof v === 'number') val = Math.abs(v);
                        else if (v && typeof v === 'object') val = Math.abs(Number(v.Ic ?? v.Ib ?? v.Ie ?? 0));
                        else val = 0;
                        if (val > magMax) magMax = val;
                      }
                      if (magMax > mejorMag) { mejorMag = magMax; mejorIdx = i; }
                    }
                    return mejorIdx;
                  };
                  const idx = findSnapshotPico();
                  const snap = simResultadoTRAN[idx];
                  if (!snap?.voltajes) return null;
                  const nodos = Object.keys(snap.voltajes).filter(n => n !== '0').sort();
                  return (
                    <details>
                      <summary style={{ fontSize: 11, color: '#888', cursor: 'pointer' }}>
                        Snapshot en el pico de actividad (t = {formatValue(snap.tiempo, 's')})
                      </summary>
                      <div style={{ marginTop: 6, fontSize: 11, fontFamily: 'monospace', color: '#bbb' }}>
                        {nodos.map(n => (
                          <span key={n} style={{ display: 'inline-block', marginRight: 12 }}>
                            V({n}) = {formatValue(Number(snap.voltajes[n]) || 0, 'V')}
                          </span>
                        ))}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 10, color: '#666', fontStyle: 'italic' }}>
                        Para ver toda la evolución temporal, abrí la pestaña 📊 Gráficas.
                      </div>
                    </details>
                  );
                })()}
              </div>
            )}

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
                circuit={c}
                isActive={isActive}
                acData={simResultadoAC}
                dcData={simResultadoDC}
                tranData={simResultadoTRAN}
                netlist={netlist}
              />
            ) : (
              <AccordionsCondicionales
                c={c} state={state} dispatch={dispatch} api={api}
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

// Logica condicional de accordions
//
// Reglas derivadas de los JSONs del backend y las rutas disponibles:
//
//  Analisis Nodal DC     -> circuito tiene fuente DC (tieneDC)
//  Analisis Transitorio  -> tiene capacitor o bobina + fuente DC
//  Calculos Generales    -> tiene resistencias (R > 0)
//  Leyes Fundamentales   -> siempre (KVL/KCL) + divisor V si solo fuente_voltaje DC
//                          + divisor I si tiene fuente_corriente
//  Thevenin / Norton     -> DC + >=2 resistencias + sin transistores/reguladores
//  Superposicion         -> DC + >=2 fuentes independientes
//  Transformacion Fuente -> DC + exactamente 1 fuente + >=1 resistencia adyacente

function AccordionsCondicionales({
  c, state, dispatch, api,
  netlist, analisisResultado, teoremaResultado,
  simResultadoDC, procedimientoDC, procedimientoAC, procedimientoTRAN,
  loading, simError, analisisError,
}) {
  const cc = c.componentCounts; // { R, C, L, F, D, Q, J, U }

  // Fuentes DC y AC por separado
  const fuentesDC = (netlist ?? []).filter(
    (n) => (n.type === 'fuente_voltaje' || n.type === 'fuente_corriente') &&
            (n.params?.dcOrAc ?? 'dc').toLowerCase() === 'dc'
  );
  const tieneFuenteVoltajeDC  = fuentesDC.some((n) => n.type === 'fuente_voltaje');
  const tieneFuenteCorrienteDC = fuentesDC.some((n) => n.type === 'fuente_corriente');
  const numFuentesDC          = fuentesDC.length;

  // Componentes activos no-lineales: transistores y reguladores complican Thevenin
  const tieneNoLineales = cc.Q > 0 || cc.J > 0 || cc.U > 0;

  // Flags de visibilidad por accordion
  const mostrarNodal       = c.tieneDC;
  const mostrarTransitorio = c.tieneDC && (cc.C > 0 || cc.L > 0);
  // Req es un escalar real: solo aplica si (a) no hay reactivos, o (b) hay regimen DC
  // en estado estable (C abierto, L corto). En AC puro con C o L lo correcto es Zeq(ω),
  // no R_eq
  const mostrarGeneral     = cc.R > 0 && (c.tieneDC || (cc.C === 0 && cc.L === 0));
  const mostrarLeyes       = true; // KVL/KCL siempre; divisores condicionados internamente
  const mostrarThevenin    = c.tieneDC && cc.R >= 2 && !tieneNoLineales;
  const mostrarSuper       = c.tieneDC && numFuentesDC >= 2;
  const mostrarTransfFuente = c.tieneDC && numFuentesDC === 1 && cc.R >= 1 && !tieneNoLineales;

  const A = (id, title, icon, children) => (
    <AccordionSection key={id} id={id} title={title} icon={icon} state={state} dispatch={dispatch}>
      {children}
    </AccordionSection>
  );

  const divResult = analisisResultado?.tipo === 'divisor-voltaje' || analisisResultado?.tipo === 'divisor-corriente'
    ? analisisResultado : null;

  return (
    <div className="accordions">

      {mostrarNodal && A('nodal', 'Análisis Nodal/Mallas DC', '⚡',
        <NodalPanel
          resultado={analisisResultado?.tipo === 'nodal' ? analisisResultado : simResultadoDC}
          loading={loading?.analisisNodal}
          onCalcular={() => api.calcularNodal()}
        />
      )}

      {mostrarTransitorio && A('transitorio', 'Análisis Transitorio', '∿',
        <TransitorioPanel
          resultado={analisisResultado?.tipo === 'transitorio' ? analisisResultado : null}
          loading={loading?.analisisTransitorio}
          tieneReactivos
          onCalcular={(cfg) => api.calcularTransitorio(cfg)}
        />
      )}

      {mostrarGeneral && A('general', 'Cálculos Generales', 'Σ',
        <GeneralPanel
          resultado={analisisResultado?.tipo === 'resistencia-equivalente' ? analisisResultado : null}
          loading={loading?.analisisReq}
          netlist={netlist}
          analisisError={analisisError}
          onCalcularReq={(nodoA, nodoB) => api.calcularResistenciaEq({ nodoA, nodoB })}
        />
      )}

      {mostrarLeyes && A('leyes', 'Leyes Fundamentales', '☰',
        <LeyesPanel
          resultado={divResult}
          loading={loading?.analisisDivisor}
          netlist={netlist}
          tieneFuenteVoltajeDC={tieneFuenteVoltajeDC}
          tieneFuenteCorrienteDC={tieneFuenteCorrienteDC}
          analisisError={analisisError}
          onCalcularDivisorV={(id) => api.calcularDivisorVoltaje({ componenteObjetivoId: id })}
          onCalcularDivisorI={(id) => api.calcularDivisorCorriente({ componenteObjetivoId: id })}
        />
      )}

      {mostrarThevenin && A('thevenin', 'Thévenin / Norton', '⊛',
        <TeoremasPanel
          tipo="thevenin-norton"
          resultado={teoremaResultado?.tipo === 'thevenin-norton' ? teoremaResultado : null}
          loading={loading?.teorema}
          error={simError}
          onCalcular={(componenteCargaId) => api.calcularTheveninNorton({ componenteCargaId })}
        />
      )}

      {mostrarSuper && A('superposicion', 'Superposición', '∑',
        <TeoremasPanel
          tipo="superposicion"
          resultado={teoremaResultado?.tipo === 'superposicion' ? teoremaResultado : null}
          loading={loading?.teorema}
          error={simError}
          onCalcular={(componenteObjetivoId, parametroAnalisis) =>
            api.calcularSuperposicion({ componenteObjetivoId, parametroAnalisis })
          }
        />
      )}

      {mostrarTransfFuente && A('transformacion-fuente', 'Transformación de Fuente', '⇄',
        <TransformacionFuentePanel
          resultado={teoremaResultado?.tipo === 'transformacion-fuente' ? teoremaResultado : null}
          loading={loading?.teorema}
          error={simError}
          netlist={netlist}
          onCalcular={(fuenteId) => api.calcularTransformacionFuente({ fuenteId })}
        />
      )}

      {(procedimientoDC || procedimientoAC || procedimientoTRAN) && A('procedimiento', 'Procedimiento de Cálculos', '📋',
        <ProcedimientoPanel procedimiento={procedimientoDC || procedimientoAC || procedimientoTRAN} />
      )}


      {/* Mensaje cuando ningun accordion aplica (circuito AC puro, solo diodos, etc.) */}
      {!mostrarNodal && !mostrarTransitorio && !mostrarThevenin && !mostrarSuper && (
        <p style={{ fontSize: 12, color: '#3a3f4e', padding: '12px 4px' }}>
          Los cálculos avanzados no aplican para este tipo de circuito.
          Usa la pestaña 📊 Gráficas para analizar la respuesta en frecuencia.
        </p>
      )}

    </div>
  );
}

// Sub-paneles de los accordions

// Helpers de formato LaTeX -> texto legible

function latexToText(str) {
  if (!str) return '';
  return str
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1) / ($2)')
    .replace(/\_\{([^}]+)\}/g, (_, s) => s)
    .replace(/\_([a-zA-Z0-9])/g, (_, s) => s)
    .replace(/\^\{([^}]+)\}/g, '^$1')
    .replace(/\^([a-zA-Z0-9])/g, '^$1')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^}]+)\}/g, '$1')
    .replace(/\\Omega/g, 'Ω').replace(/\\omega/g, 'ω')
    .replace(/\\alpha/g, 'α').replace(/\\beta/g, 'β')
    .replace(/\\pi/g, 'π').replace(/\\infty/g, '∞')
    .replace(/\\cdot/g, '·').replace(/\\times/g, '×')
    .replace(/\\approx/g, '≈').replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥').replace(/\\neq/g, '≠')
    .replace(/[{}]/g, '').replace(/\\/g, '').trim();
}

function formatNums(str) {
  return str.replace(/(-?\d+\.\d+)/g, (match) => {
    const n = parseFloat(match);
    if (Number.isInteger(n)) return String(n);

    return parseFloat(n.toPrecision(5)).toString();
  });
}

function PasoFormula({ paso }) {
  const texto = formatNums(latexToText(paso.eq ?? ''));
  return (
    <div style={{
      padding: '6px 10px', background: '#1a1b22', borderRadius: 6,
      borderLeft: '2px solid #6c63ff', display: 'flex', gap: 10, alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: 10, color: '#5a6278', minWidth: 16, paddingTop: 2 }}>{paso.paso}.</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {paso.titulo && <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{paso.titulo}</span>}
        <span style={{ fontSize: 13, color: '#e2e8f0', fontFamily: 'monospace', letterSpacing: '0.02em' }}>{texto}</span>
      </div>
    </div>
  );
}

const ROW = ({ label, value, color = '#94a3b8', mono = true }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
    <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
    <span style={{ fontSize: 12, color, fontFamily: mono ? 'monospace' : 'inherit', fontWeight: 600 }}>{value}</span>
  </div>
);

const CalcBtn = ({ onClick, loading, children, style = {} }) => (
  <button
    className="control-btn primary"
    onClick={onClick}
    disabled={loading}
    style={{ fontSize: 12, padding: '4px 12px', ...style }}
  >
    {loading ? '⏳ Calculando…' : children}
  </button>
);

const Placeholder = ({ text }) => (
  <p style={{ fontSize: 12, color: '#3a3f4e', margin: 0 }}>{text}</p>
);

// Analisis Nodal

function NodalPanel({ resultado, loading, onCalcular }) {
  const voltages = resultado?.voltages ?? {};
  const currents = resultado?.currents ?? {};
  const tieneData = Object.keys(voltages).length > 0;

  return (
    <div className="analysis-content" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <CalcBtn onClick={onCalcular} loading={loading}>⚡ Calcular análisis nodal</CalcBtn>

      {tieneData && (
        <>
          <p style={{ fontSize: 11, color: '#5a6278', margin: '4px 0 0', fontWeight: 500 }}>Voltajes nodales</p>
          {Object.entries(voltages).map(([nodo, v]) => (
            <ROW key={nodo} label={`V(nodo ${nodo})`} value={`${fmtV(v)}`} color="#a78bfa" />
          ))}
          {Object.keys(currents).length > 0 && (
            <>
              <p style={{ fontSize: 11, color: '#5a6278', margin: '4px 0 0', fontWeight: 500 }}>Corrientes de rama</p>
              {Object.entries(currents).map(([id, i]) => (
                <ROW key={id} label={`I(${id})`} value={`${fmtA(i)}`} color="#4ade80" />
              ))}
            </>
          )}
        </>
      )}

      {!tieneData && !loading && <Placeholder text="Presiona el botón para ejecutar el análisis nodal DC." />}
    </div>
  );
}

// Analisis Transitorio

function TransitorioPanel({ resultado, loading, tieneReactivos, onCalcular }) {
  const [tStop,  setTStop]  = useState('0.05');
  const [deltaT, setDeltaT] = useState('0.0005');

  const puntos = resultado?.puntos ?? [];
  const tieneData = puntos.length > 0;

  const inputStyle = {
    background: '#1e1e2e', border: '1px solid #444', borderRadius: 4,
    padding: '3px 7px', color: '#ccc', fontFamily: 'monospace',
    fontSize: 12, width: 90,
  };

  return (
    <div className="analysis-content" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {!tieneReactivos && (
        <p style={{ fontSize: 12, color: '#fbbf24', margin: 0 }}>
          ⚠ El análisis transitorio es útil cuando el circuito tiene capacitores o bobinas.
        </p>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 10, color: '#5a6278' }}>t_stop (s)</label>
          <input style={inputStyle} value={tStop} onChange={(e) => setTStop(e.target.value)} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 10, color: '#5a6278' }}>delta_t (s)</label>
          <input style={inputStyle} value={deltaT} onChange={(e) => setDeltaT(e.target.value)} />
        </div>
        <CalcBtn
          onClick={() => onCalcular({ t_stop: parseFloat(tStop), delta_t: parseFloat(deltaT) })}
          loading={loading}
        >
          ∿ Ejecutar
        </CalcBtn>
      </div>

      {tieneData && (
        <>
          <p style={{ fontSize: 11, color: '#5a6278', margin: '4px 0 0', fontWeight: 500 }}>
            {puntos.length} pasos — t = {puntos[0]?.tiempo}s → {puntos[puntos.length - 1]?.tiempo}s
          </p>
          {/* Muestra primer + ultimo instante */}
          {[puntos[0], puntos[puntos.length - 1]].map((p, idx) => p && (
            <div key={idx} style={{ background: '#1a1b1e', borderRadius: 6, padding: '6px 10px' }}>
              <p style={{ fontSize: 11, color: '#5a6278', margin: '0 0 4px' }}>
                t = {p.tiempo} s ({idx === 0 ? 'inicio' : 'fin'})
              </p>
              {Object.entries(p.voltajes ?? {}).map(([n, v]) => (
                <ROW key={n} label={`V(${n})`} value={`${fmtV(v)}`} color="#a78bfa" />
              ))}
              {Object.entries(p.corrientes ?? {}).map(([id, i]) => (
                <ROW key={id} label={`I(${id})`} value={`${fmtA(i)}`} color="#4ade80" />
              ))}
            </div>
          ))}
          <p style={{ fontSize: 11, color: '#3a3f4e', margin: 0 }}>
            Ve a la pestaña 📊 Gráficas → Simular AC para ver la evolución completa.
          </p>
        </>
      )}

      {!tieneData && !loading && <Placeholder text="Configura el intervalo de tiempo y presiona Ejecutar." />}
    </div>
  );
}

// Calculos Generales (Req)

function GeneralPanel({ resultado, loading, netlist, analisisError, onCalcularReq }) {
  const [nodoA, setNodoA] = useState('1');
  const [nodoB, setNodoB] = useState('0');

  // Extraer nodos disponibles de la netlist
  // Los nodos pueden venir como string "1" o como objeto {nodo, x, y}
  const nodosDisponibles = [...new Set(
    (netlist ?? []).flatMap((c) =>
      Object.values(c?.nodes ?? {}).map((v) =>
        typeof v === 'object' ? String(v?.nodo ?? '') : String(v)
      )
    ).filter(Boolean)
  )].sort((a, b) => {
    const na = Number(a), nb = Number(b);
    return !isNaN(na) && !isNaN(nb) ? na - nb : a.localeCompare(b);
  });

  const tieneReq = resultado?.tipo === 'resistencia-equivalente';

  const selectStyle = {
    background: '#1e1e2e', border: '1px solid #444', borderRadius: 4,
    padding: '3px 7px', color: '#ccc', fontFamily: 'monospace', fontSize: 12, width: 70,
  };

  return (
    <div className="analysis-content" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Req */}
      <p style={{ fontSize: 11, color: '#5a6278', margin: 0, fontWeight: 500 }}>Resistencia equivalente entre nodos</p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 10, color: '#5a6278' }}>Nodo A</label>
          <select style={selectStyle} value={nodoA} onChange={(e) => setNodoA(e.target.value)}>
            {nodosDisponibles.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 10, color: '#5a6278' }}>Nodo B</label>
          <select style={selectStyle} value={nodoB} onChange={(e) => setNodoB(e.target.value)}>
            {nodosDisponibles.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <CalcBtn onClick={() => onCalcularReq(nodoA, nodoB)} loading={loading} style={{ opacity: nodoA === nodoB ? 0.5 : 1 }} disabled={loading || nodoA === nodoB}>Calcular R_eq</CalcBtn>
      </div>

      {analisisError && analisisError.toLowerCase().includes('nodo') && (
        <p style={{ fontSize: 12, color: '#fbbf24', margin: '4px 0', display: 'flex', gap: 6, alignItems: 'center' }}>
          <span>⚠</span> {analisisError}
        </p>
      )}

      {tieneReq && (
        <ROW label={`R_eq (nodo ${resultado.nodos?.inicio} → ${resultado.nodos?.fin})`}
             value={fmtAuto(resultado.valor, resultado.unidad)}
             color="#fbbf24" />
      )}

      {!tieneReq && !loading && (
        <Placeholder text="Selecciona dos nodos distintos y presiona Calcular R_eq." />
      )}
    </div>
  );
}

// Leyes Fundamentales + Divisores

function LeyesPanel({ resultado, loading, netlist, tieneFuenteVoltajeDC, tieneFuenteCorrienteDC, analisisError, onCalcularDivisorV, onCalcularDivisorI }) {
  const [compId, setCompId] = useState('');

  const tienesFuenteVoltaje   = tieneFuenteVoltajeDC  ?? false;
  const tienesFuenteCorriente = tieneFuenteCorrienteDC ?? false;

  const tipoDivisor = resultado?.tipo; // 'divisor-voltaje' | 'divisor-corriente'

  const inputStyle = {
    background: '#1e1e2e', border: '1px solid #444', borderRadius: 4,
    padding: '3px 7px', color: '#ccc', fontFamily: 'monospace', fontSize: 12, width: 100,
  };

  return (
    <div className="analysis-content" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Leyes universales */}
      <div style={{ background: '#1a1b1e', borderRadius: 6, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <ROW label="Ley de Ohm" value="V = I · R" color="#6c63ff" mono={false} />
        <ROW label="KVL" value="ΣV = 0 (malla)" color="#6c63ff" mono={false} />
        <ROW label="KCL" value="ΣI = 0 (nodo)" color="#6c63ff" mono={false} />
        <ROW label="Potencia" value="P = V·I = I²R = V²/R" color="#6c63ff" mono={false} />
      </div>

      {/* Divisor de voltaje */}
      {tienesFuenteVoltaje && (
        <>
          <p style={{ fontSize: 11, color: '#5a6278', margin: '4px 0 0', fontWeight: 500 }}>Divisor de voltaje</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 10, color: '#5a6278' }}>ID componente objetivo</label>
              <input style={inputStyle} value={compId} onChange={(e) => setCompId(e.target.value)} placeholder="ej. R2" />
            </div>
            <CalcBtn onClick={() => onCalcularDivisorV(compId)} loading={loading && tipoDivisor === 'divisor-voltaje'}>
              Calcular V_x
            </CalcBtn>
          </div>
        </>
      )}

      {/* Divisor de corriente */}
      {tienesFuenteCorriente && (
        <>
          <p style={{ fontSize: 11, color: '#5a6278', margin: '4px 0 0', fontWeight: 500 }}>Divisor de corriente</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 10, color: '#5a6278' }}>ID componente objetivo</label>
              <input style={inputStyle} value={compId} onChange={(e) => setCompId(e.target.value)} placeholder="ej. R1" />
            </div>
            <CalcBtn onClick={() => onCalcularDivisorI(compId)} loading={loading && tipoDivisor === 'divisor-corriente'}>
              Calcular I_x
            </CalcBtn>
          </div>
        </>
      )}

      {/* Mensaje de validacion del backend */}
      {analisisError && (
        <p style={{ fontSize: 12, color: '#fbbf24', margin: '4px 0', display: 'flex', gap: 6, alignItems: 'center' }}>
          <span>⚠</span> {analisisError}
        </p>
      )}

      {/* Resultado divisor */}
      {tipoDivisor === 'divisor-voltaje' && resultado && (
        <ROW label={`Caída de voltaje en ${compId}`}
             value={fmtAuto(resultado.voltajeCaida ?? 0, resultado.unidad)}
             color="#4ade80" />
      )}
      {tipoDivisor === 'divisor-corriente' && resultado && (
        <ROW label={`Corriente en ${compId}`}
             value={fmtAuto(resultado.corrienteCaida ?? 0, resultado.unidad)}
             color="#4ade80" />
      )}

      {!resultado && !loading && !tienesFuenteVoltaje && !tienesFuenteCorriente && (
        <Placeholder text="Este circuito no tiene fuentes identificadas para aplicar divisores." />
      )}
    </div>
  );
}

// Boton Simular AC con selector de barrido

function ACSimularBtn({ isActive, isRunning, onSimular }) {
  const [barrido,  setBarrido]  = useState('log');
  const [fInicial, setFInicial] = useState('10');
  const [fFinal,   setFFinal]   = useState('100000');
  const [puntos,   setPuntos]   = useState('50');

  const selectStyle = {
    background: '#1e1e2e', border: '1px solid #444', borderRadius: 4,
    padding: '3px 7px', color: '#ccc', fontSize: 11, fontFamily: 'monospace',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <select style={selectStyle} value={barrido} onChange={(e) => setBarrido(e.target.value)}>
          <option value="log">Logarítmico</option>
          <option value="lineal">Lineal</option>
          <option value="decada">Década</option>
          <option value="octava">Octava</option>
        </select>
        <input style={{ ...selectStyle, width: 70 }} value={fInicial}
          onChange={(e) => setFInicial(e.target.value)} placeholder="f ini (Hz)" />
        <input style={{ ...selectStyle, width: 70 }} value={fFinal}
          onChange={(e) => setFFinal(e.target.value)} placeholder="f fin (Hz)" />
        <input style={{ ...selectStyle, width: 45 }} value={puntos}
          onChange={(e) => setPuntos(e.target.value)} placeholder="pts" />
        <button
          className="control-btn"
          disabled={!isActive || isRunning}
          title="Análisis AC: barrido en frecuencia. Linealiza los componentes alrededor del punto de operación DC y resuelve fasores complejos para cada frecuencia. Útil para filtros, ganancia y fase de circuitos lineales (RC, RL, RLC). NO es adecuado para gran señal (BJT como interruptor, rectificadores), porque la linealización deja de ser válida fuera del entorno del punto de operación — para esos casos usa Transitorio."
          onClick={() => onSimular({
            configuracion_ac: {
              f_inicial: Number(fInicial),
              f_final:   Number(fFinal),
              puntos:    Number(puntos),
              barrido,
            },
          })}
        >
          {isRunning ? '⏳ Simulando…' : '∿ Simular AC'}
        </button>
      </div>
    </div>
  );
}

// Boton de Simulacion Transitoria (dominio del tiempo)
//
// Inputs en milisegundos (t_stop) y microsegundos (delta_t) 

function TRANSimularBtn({ isActive, isRunning, onSimular }) {
  // Defaults pensados para una fuente AC de 60 Hz (periodo 16.67 ms):
  //   t_stop = 50 ms  -> 3 ciclos completos para ver el on/off del LED claramente
  //   delta_t = 100 µs -> 167 muestras por ciclo, suficiente para resolver el cruce
  const [tStopMs,    setTStopMs]    = useState('50');   // ms
  const [deltaTUs,   setDeltaTUs]   = useState('100');  // µs

  const inputStyle = {
    background: '#1e1e2e', border: '1px solid #444', borderRadius: 4,
    padding: '3px 7px', color: '#ccc', fontSize: 11, fontFamily: 'monospace',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          style={{ ...inputStyle, width: 60 }}
          value={tStopMs}
          onChange={(e) => setTStopMs(e.target.value)}
          placeholder="t_stop"
          title="Tiempo total de simulación en milisegundos. Para 60 Hz, 50 ms da ~3 ciclos."
        />
        <span style={{ fontSize: 11, color: '#888', fontFamily: 'monospace' }}>ms</span>
        <input
          style={{ ...inputStyle, width: 60 }}
          value={deltaTUs}
          onChange={(e) => setDeltaTUs(e.target.value)}
          placeholder="Δt"
          title="Paso de integración en microsegundos. Menor = más preciso pero más lento. 100 µs suele bastar para 60 Hz."
        />
        <span style={{ fontSize: 11, color: '#888', fontFamily: 'monospace' }}>µs</span>
        <button
          className="control-btn"
          disabled={!isActive || isRunning}
          title="Análisis Transitorio: resuelve el circuito en el dominio del tiempo (paso a paso con Newton-Raphson + MNA). Captura comportamiento no lineal en gran señal: BJT entrando/saliendo de saturación, rectificación de diodos, LEDs prendiendo/apagando con la onda AC. Es el análisis correcto para circuitos de switching donde el AC sweep falla."
          onClick={() => onSimular({
            configuracion_transitorio: {
              t_stop:  Number(tStopMs) / 1000,    // ms -> s
              delta_t: Number(deltaTUs) / 1e6,    // µs -> s
            },
          })}
        >
          {isRunning ? '⏳ Simulando…' : '⏱ Simular Transitorio'}
        </button>
      </div>
    </div>
  );
}

function TRANControlPanel({ tranResults, speed, onSpeedChange, paused, onTogglePause }) {
  // Slider lineal de 0...100 que mapea a speed logaritmico entre 0.001 y 1
  // (3 decadas). speedLog = 10 ** (slider/100 * 3 - 3)
  const sliderValue = Math.round((Math.log10(speed) + 3) / 3 * 100);
  const handleSlider = (e) => {
    const v = Number(e.target.value);
    const newSpeed = Math.pow(10, v / 100 * 3 - 3);
    onSpeedChange(newSpeed);
  };

  // Calculamos info derivada para mostrar al usuario
  const tMax = tranResults[tranResults.length - 1]?.tiempo ?? 0;
  const tMin = tranResults[0]?.tiempo ?? 0;
  const duracionSim = tMax - tMin;
  const duracionReproduccion = duracionSim / speed;
  // Factor humano-legible: cuantas veces mas lento que tiempo real
  const factor = 1 / speed;

  // Etiqueta descriptiva del nivel de velocidad
  let etiqueta;
  if (speed >= 0.5)      etiqueta = `Tiempo real (×${speed.toFixed(2)})`;
  else if (speed >= 0.1) etiqueta = `Lento (${factor.toFixed(0)}× más lento)`;
  else if (speed >= 0.01) etiqueta = `Muy lento (${factor.toFixed(0)}× más lento)`;
  else                   etiqueta = `Cámara lenta (${factor.toFixed(0)}× más lento)`;

  return (
    <div style={{
      marginTop: 10,
      padding: '10px 12px',
      background: '#1a1f2e',
      border: '1px solid #2d3748',
      borderRadius: 6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>
          ⏱ Animación transitoria — {tranResults.length} muestras · {(duracionSim * 1000).toFixed(2)} ms simulados
        </span>
        <button
          onClick={onTogglePause}
          className="control-btn"
          style={{ fontSize: 11, padding: '3px 10px' }}
          title={paused ? 'Reanudar animación' : 'Pausar animación'}
        >
          {paused ? '▶ Reanudar' : '⏸ Pausar'}
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, color: '#888', minWidth: 80 }}>Velocidad:</span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={sliderValue}
          onChange={handleSlider}
          style={{ flex: 1, accentColor: '#5fb3ff' }}
          title="Mueve el slider para ajustar la velocidad de reproducción. Más a la izquierda = más lento (cámara lenta para ver el cruce del umbral); más a la derecha = tiempo real."
        />
        <span style={{ fontSize: 11, color: '#5fb3ff', fontFamily: 'monospace', minWidth: 100, textAlign: 'right' }}>
          {etiqueta}
        </span>
      </div>
      <div style={{ marginTop: 4, fontSize: 10, color: '#666', fontFamily: 'monospace', textAlign: 'right' }}>
        Un ciclo completo en pantalla: {duracionReproduccion >= 1 ? `${duracionReproduccion.toFixed(2)} s` : `${(duracionReproduccion * 1000).toFixed(0)} ms`}
      </div>
    </div>
  );
}

// Procedimiento de Calculo 
// El shape { titulo, pasos: [{ paso, calculos: [] }] } que devuelve el backend
// es identico para ambos tipos, por eso un solo componente sirve para los dos.

function ProcedimientoPanel({ procedimiento }) {
  const [pasoAbierto, setPasoAbierto] = useState(null);

  if (!procedimiento) return null;

  const { titulo, pasos = [] } = procedimiento;

  return (
    <div className="analysis-content" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {titulo && (
        <p style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600, margin: 0 }}>
          {titulo}
        </p>
      )}

      {pasos.map((paso, idx) => {
        const abierto = pasoAbierto === idx;
        return (
          <div key={idx} style={{ borderRadius: 6, overflow: 'hidden', border: '1px solid #2a2a3a' }}>
            {/* Cabecera del paso */}
            <button
              onClick={() => setPasoAbierto(abierto ? null : idx)}
              style={{
                width: '100%', textAlign: 'left', background: abierto ? '#1e1a2e' : '#16161e',
                border: 'none', cursor: 'pointer', padding: '8px 12px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
              }}
            >
              <span style={{ fontSize: 12, color: abierto ? '#c4b5fd' : '#94a3b8', fontWeight: 500 }}>
                {paso.paso}
              </span>
              <span style={{ fontSize: 10, color: '#5a6278' }}>{abierto ? '▲' : '▼'}</span>
            </button>

            {/* Calculos del paso */}
            {abierto && (
              <div style={{ background: '#0f0f16', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(paso.calculos ?? []).map((calc, ci) => (
                  <div
                    key={ci}
                    style={{
                      padding: '5px 10px', background: '#1a1b22', borderRadius: 5,
                      borderLeft: '2px solid #6c63ff',
                    }}
                  >
                    <span style={{
                      fontSize: 12, color: '#e2e8f0',
                      fontFamily: 'monospace', letterSpacing: '0.02em',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>
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

// Transformacion de Fuente

function TransformacionFuentePanel({ resultado, loading, error, netlist, onCalcular }) {
  const [fuenteId, setFuenteId] = useState('');

  // Extraer fuentes disponibles de la netlist para mostrarlas como opciones
  const fuentes = (netlist ?? []).filter(
    (c) => c?.type === 'fuente_voltaje' || c?.type === 'fuente_corriente'
  );

  const selectStyle = {
    background: '#1e1e2e', border: '1px solid #444', borderRadius: 4,
    padding: '4px 8px', color: '#ccc', fontFamily: 'monospace', fontSize: 12,
  };

  return (
    <div className="analysis-content" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: '#888' }}>Fuente a transformar</label>
          {fuentes.length > 0 ? (
            <select style={selectStyle} value={fuenteId} onChange={(e) => setFuenteId(e.target.value)}>
              <option value="">Seleccionar…</option>
              {fuentes.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.id} ({f.type === 'fuente_voltaje' ? 'Voltaje' : 'Corriente'})
                </option>
              ))}
            </select>
          ) : (
            <input
              style={{ ...selectStyle, width: 100 }}
              value={fuenteId}
              onChange={(e) => setFuenteId(e.target.value)}
              placeholder="ej. V1"
            />
          )}
        </div>
        <button
          className="control-btn primary"
          style={{ padding: '5px 14px', fontSize: 12 }}
          disabled={loading || !fuenteId.trim()}
          onClick={() => onCalcular(fuenteId.trim())}
        >
          {loading ? '⏳…' : '⇄ Transformar'}
        </button>
      </div>

      {error && <p style={{ color: '#e74c3c', fontSize: 12, margin: 0 }}>⚠ {error}</p>}

      {resultado && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <ROW label="Fuente original"        value={resultado.fuenteOriginal}                  color="#94a3b8" mono={false} />
          <ROW label="Resistencia asociada"   value={resultado.resistenciaInvolucrada}           color="#94a3b8" mono={false} />
          <ROW label="Tipo resultante"        value={resultado.transformacion?.tipo}             color="#a78bfa" mono={false} />
          <ROW label="Nuevo valor de fuente"  value={fmtAuto(resultado.transformacion?.nuevoValorFuente ?? 0, resultado.transformacion?.unidad ?? '')} color="#4ade80" />
          <ROW label="Resistencia"            value={`${resultado.transformacion?.valorResistencia} Ω`} color="#fbbf24" />

          {resultado.procedimiento?.length > 0 && (
            <div style={{ marginTop: 4, borderTop: '1px solid #2a2a3a', paddingTop: 6 }}>
              <p style={{ fontSize: 11, color: '#555', margin: '0 0 4px' }}>Procedimiento:</p>
              {resultado.procedimiento.map((paso) => (
                <PasoFormula key={paso.paso} paso={paso} />
              ))}
            </div>
          )}
        </div>
      )}

      {!resultado && !loading && !error && (
        <p style={{ color: '#555', fontSize: 12, margin: 0 }}>
          {fuentes.length === 0
            ? 'No se detectaron fuentes en la netlist de este circuito.'
            : 'Selecciona una fuente y presiona Transformar.'}
        </p>
      )}
    </div>
  );
}