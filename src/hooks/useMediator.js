import { useState, useEffect, useCallback } from 'react';
import mediator from '../core/Mediator';
import eventBus from '../core/EventBus';

/**
 * useMediator — Hook principal (Observer)
 * Se suscribe al EventBus y sincroniza el estado del Mediator
 * con el estado local de React. Cualquier componente que lo use
 * reacciona automáticamente a cambios globales.
 *
 * @returns {[object, Function]} [state, dispatch]
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

  return [state, dispatch];
}
