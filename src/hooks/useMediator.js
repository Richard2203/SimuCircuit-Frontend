import { useState, useEffect, useCallback } from 'react';
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
   */
  const api = {
    cargarFiltros:          useCallback((p)  => mediator.cargarFiltros(p),              []),
    buscarCircuitos:        useCallback((p)  => mediator.buscarCircuitos(p),             []),
    cargarCircuito:         useCallback((id) => mediator.cargarCircuito(id),             []),
    cargarComponentes:      useCallback(()   => mediator.cargarComponentes(),            []),
    simularDC:              useCallback((p)  => mediator.simularDC(p),                   []),
    simularAC:              useCallback((p)  => mediator.simularAC(p),                   []),
    calcularTheveninNorton: useCallback((p)  => mediator.calcularTheveninNorton(p),      []),
    calcularSuperposicion:  useCallback((p)  => mediator.calcularSuperposicion(p),       []),
  };

  return { state, dispatch, api };
}