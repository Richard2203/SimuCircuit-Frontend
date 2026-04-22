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
 *   - state   → estado actual del Mediator
 *   - dispatch → acciones síncronas
 *   - api     → operaciones asíncronas que van al servidor
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
   * Métodos asíncronos que pasan por el Mediator (nunca directamente a los servicios).
   * Los componentes llaman a api.simularDC() en lugar de SimulacionService.simularDC().
   *
   * IMPORTANTE: cada función se memoiza con useCallback (dependencias vacías porque
   * mediator es un singleton estable), y luego el objeto api completo se envuelve
   * en useMemo. Esto garantiza que la referencia del objeto sea estable entre renders,
   * evitando que useEffect([api]) se dispare en bucle infinito.
   */
  const cargarFiltros          = useCallback((p)  => mediator.cargarFiltros(p),             []);
  const buscarCircuitos        = useCallback((p)  => mediator.buscarCircuitos(p),            []);
  const cargarCircuito         = useCallback((id) => mediator.cargarCircuito(id),            []);
  const cargarComponentes      = useCallback(()   => mediator.cargarComponentes(),           []);
  const simularDC              = useCallback((p)  => mediator.simularDC(p),                  []);
  const simularAC              = useCallback((p)  => mediator.simularAC(p),                  []);
  const calcularTheveninNorton = useCallback((p)  => mediator.calcularTheveninNorton(p),     []);
  const calcularSuperposicion  = useCallback((p)  => mediator.calcularSuperposicion(p),      []);

  const api = useMemo(() => ({
    cargarFiltros,
    buscarCircuitos,
    cargarCircuito,
    cargarComponentes,
    simularDC,
    simularAC,
    calcularTheveninNorton,
    calcularSuperposicion,
  }), [
    cargarFiltros,
    buscarCircuitos,
    cargarCircuito,
    cargarComponentes,
    simularDC,
    simularAC,
    calcularTheveninNorton,
    calcularSuperposicion,
  ]);

  return { state, dispatch, api };
}
