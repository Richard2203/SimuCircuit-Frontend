/**
 * Orquestacion de Accorditions con sus respectivaas props
 */
import { useCircuitFlags }       from '../hooks/useCircuitFlags.js';
import { AccordionSection }      from './Simulator/AccordionSection.jsx';
import { TeoremasPanel }         from './Simulator/TeoremasPanel.jsx';
import {
  NodalPanel, TransientPanel, GeneralPanel,
  LawsPanel, ProcedurePanel, SourceTransformPanel,
} from './Panels/Index.jsx';

/**
 * @param {{
 *   circuit            : Circuit,
 *   state              : object,
 *   dispatch           : Function,
 *   api                : object,
 *   netlist            : object[],
 *   analisisResultado  : object | null,
 *   teoremaResultado   : object | null,
 *   simResultadoDC     : object | null,
 *   procedimientoDC    : object | null,
 *   procedimientoAC    : object | null,
 *   procedimientoTRAN  : object | null,
 *   loading            : object,
 *   simError           : string | null,
 *   analisisError      : string | null,
 * }} props
 */
export function AnalysisAccordions({
  circuit, state, dispatch, api,
  netlist, analisisResultado, teoremaResultado,
  simResultadoDC, procedimientoDC, procedimientoAC, procedimientoTRAN,
  loading, simError, analisisError, teoremaErrorTipo,
}) {
  const flags = useCircuitFlags(circuit, netlist);
  const cc    = circuit.componentCounts;

  const teoremaError = (tipo) => (teoremaErrorTipo === tipo ? simError : null);

  // Resultado de divisor (voltaje o corriente)
  const divResult =
    analisisResultado?.tipo === 'divisor-voltaje' ||
    analisisResultado?.tipo === 'divisor-corriente'
      ? analisisResultado
      : null;

  // Helper para construir un accordion con menos repeticion
  const accordion = (id, title, icon, panel) => (
    <AccordionSection key={id} id={id} title={title} icon={icon} state={state} dispatch={dispatch}>
      {panel}
    </AccordionSection>
  );

  const activeProcedure = procedimientoDC ?? procedimientoAC ?? procedimientoTRAN;
  const noAccordionsApply =
    !flags.showNodal && !flags.showTransientPanel &&
    !flags.showThevenin && !flags.showSuperposition;

  return (
    <div className="accordions">

      {flags.showNodal && accordion('nodal', 'Análisis Nodal/Mallas DC', '⚡',
        <NodalPanel
          resultado={analisisResultado?.tipo === 'nodal' ? analisisResultado : simResultadoDC}
          netlist={netlist}
          loading={loading?.analisisNodal}
          onCalculate={() => api.calcularNodal()}
        />
      )}

      {/* {flags.showTransientPanel && accordion('transitorio', 'Análisis Transitorio', '∿',
        <TransientPanel
          resultado={analisisResultado?.tipo === 'transitorio' ? analisisResultado : null}
          loading={loading?.analisisTransitorio}
          hasReactives
          onCalculate={(cfg) => api.calcularTransitorio(cfg)}
        />
      )} */}

      {flags.showGeneral && accordion('general', 'Cálculos Generales', 'Σ',
        <GeneralPanel
          resultado={analisisResultado?.tipo === 'resistencia-equivalente' ? analisisResultado : null}
          loading={loading?.analisisReq}
          netlist={netlist}
          error={analisisError}
          onCalculate={(nodoA, nodoB) => api.calcularResistenciaEq({ nodoA, nodoB })}
        />
      )}

      {flags.showLaws && accordion('leyes', 'Leyes Fundamentales', '☰',
        <LawsPanel
          resultado={divResult}
          loading={loading?.analisisDivisor}
          netlist={netlist}
          hasDCVoltageSrc={flags.hasDCVoltageSrc}
          hasDCCurrentSrc={flags.hasDCCurrentSrc}
          error={analisisError}
          onCalculateVDiv={(id) => api.calcularDivisorVoltaje({ componenteObjetivoId: id })}
          onCalculateIDiv={(id) => api.calcularDivisorCorriente({ componenteObjetivoId: id })}
        />
      )}

      {flags.showThevenin && accordion('thevenin', 'Thévenin / Norton', '⊛',
        <TeoremasPanel
          tipo="thevenin-norton"
          resultado={teoremaResultado?.tipo === 'thevenin-norton' ? teoremaResultado : null}
          loading={loading?.teorema}
          error={teoremaError('thevenin-norton')}
          onCalcular={(componenteCargaId) => api.calcularTheveninNorton({ componenteCargaId })}
        />
      )}

      {flags.showSuperposition && accordion('superposicion', 'Superposición', '∑',
        <TeoremasPanel
          tipo="superposicion"
          resultado={teoremaResultado?.tipo === 'superposicion' ? teoremaResultado : null}
          loading={loading?.teorema}
          error={teoremaError('superposicion')}
          onCalcular={(componenteObjetivoId, parametroAnalisis) =>
            api.calcularSuperposicion({ componenteObjetivoId, parametroAnalisis })
          }
        />
      )}

      {flags.showSourceTransform && accordion('transformacion-fuente', 'Transformación de Fuente', '⇄',
        <SourceTransformPanel
          resultado={teoremaResultado?.tipo === 'transformacion-fuente' ? teoremaResultado : null}
          loading={loading?.teorema}
          error={teoremaError('transformacion-fuente')}
          netlist={netlist}
          onCalculate={(fuenteId) => api.calcularTransformacionFuente({ fuenteId })}
        />
      )}

      {activeProcedure && accordion('procedimiento', 'Procedimiento de Cálculos', '📋',
        <ProcedurePanel procedimiento={activeProcedure} />
      )}

      {noAccordionsApply && (
        <p style={{ fontSize: 12, color: '#3a3f4e', padding: '12px 4px' }}>
          Los cálculos avanzados no aplican para este tipo de circuito.
          Usa la pestaña 📊 Gráficas para analizar la respuesta en frecuencia.
        </p>
      )}
    </div>
  );
}