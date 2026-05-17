import { useState, useEffect, useCallback, useMemo } from 'react';
import mediator from '../core/Mediator';
import eventBus from '../core/EventBus';

/**
 * useMediator — Hook principal (Observer + Mediator)
 * Se suscribe al EventBus y sincroniza el estado del Mediator
 * con el estado local de React. Cualquier componente que lo use
 * reacciona automáticamente a cambios globales.
 *
 * Expone:
 *   - state   -> estado actual del Mediator
 *   - dispatch -> acciones sincronas
 *   - api     -> operaciones asincronas que van al servidor
 *
 * @returns {{ state: object, dispatch: Function, api: object }}
 */
export function useMediator() {
  const [state, setState] = useState(() => mediator.getState());

  useEffect(() => {
    // Observer: suscribirse al bus de eventos
    const unsubscribe = eventBus.subscribe('STATE_CHANGED', (newState) => {
      setState({ ...newState });
    });

    // Limpieza al desmontar
    return unsubscribe;
  }, []);

  const dispatch = useCallback((action, payload) => {
    mediator.dispatch(action, payload);
  }, []);

  /**
   * Metodos asincronos que pasan por el Mediator (nunca directamente a los servicios).
   * Los componentes llaman a api.simularDC() en lugar de SimulacionService.simularDC().
   *
   * IMPORTANTE: cada funcion se memoiza con useCallback (dependencias vacias porque
   * mediator es un singleton estable), y luego el objeto api completo se envuelve
   * en useMemo. Esto garantiza que la referencia del objeto sea estable entre renders,
   * evitando que useEffect([api]) se dispare en bucle infinito.
   */
  const cargarFiltros          = useCallback((p)  => mediator.cargarFiltros(p),                          []);
  const buscarCircuitos        = useCallback((p)  => mediator.buscarCircuitos(p),                         []);
  const cargarCircuito         = useCallback((id) => mediator.cargarCircuito(id),                         []);
  const cargarComponentes      = useCallback(()   => mediator.cargarComponentes(),                        []);
  const simularDC              = useCallback((p)  => mediator.simularDC(p),                               []);
  const simularAC              = useCallback((p)  => mediator.simularAC(p),                               []);
  const simularTransitorio     = useCallback((p)  => mediator.simularTransitorio(p),                      []);
  const calcularTheveninNorton       = useCallback((p)  => mediator.calcularTheveninNorton(p),                  []);
  const calcularSuperposicion        = useCallback((p)  => mediator.calcularSuperposicion(p),                   []);
  const calcularTransformacionFuente = useCallback((p)  => mediator.calcularTransformacionFuente(p),            []);
  const calcularNodal                = useCallback(()   => mediator.calcularNodal(),                            []);
  const calcularTransitorio          = useCallback((p)  => mediator.calcularTransitorio(p),                     []);
  const calcularResistenciaEq        = useCallback((p)  => mediator.calcularResistenciaEquivalente(p),          []);
  const calcularDivisorVoltaje       = useCallback((p)  => mediator.calcularDivisorVoltaje(p),                  []);
  const calcularDivisorCorriente     = useCallback((p)  => mediator.calcularDivisorCorriente(p),               []);

  const api = useMemo(() => ({
    cargarFiltros,
    buscarCircuitos,
    cargarCircuito,
    cargarComponentes,
    simularDC,
    simularAC,
    simularTransitorio,
    calcularTheveninNorton,
    calcularSuperposicion,
    calcularTransformacionFuente,
    calcularNodal,
    calcularTransitorio,
    calcularResistenciaEq,
    calcularDivisorVoltaje,
    calcularDivisorCorriente,
  }), [
    cargarFiltros,
    buscarCircuitos,
    cargarCircuito,
    cargarComponentes,
    simularDC,
    simularAC,
    simularTransitorio,
    calcularTheveninNorton,
    calcularSuperposicion,
    calcularTransformacionFuente,
    calcularNodal,
    calcularTransitorio,
    calcularResistenciaEq,
    calcularDivisorVoltaje,
    calcularDivisorCorriente,
  ]);

  return { state, dispatch, api };
}