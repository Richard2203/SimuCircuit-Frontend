import { useState, useEffect } from 'react';
import eventBus from '../core/EventBus';

/**
 * useSimTime — Hook Observer dedicado al timer
 * Se suscribe unicamente al evento SIM_TICK para actualizar
 * el tiempo de simulación sin re-renderizar toda la app.
 *
 * @returns {number} Segundos transcurridos
 */
export function useSimTime() {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const unsubscribe = eventBus.subscribe('SIM_TICK', (t) => setTime(t));
    return unsubscribe;
  }, []);

  // Reset cuando el mediator reinicia
  useEffect(() => {
    const unsubscribe = eventBus.subscribe('STATE_CHANGED', (state) => {
      if (state.simStatus === 'detenido') setTime(0);
    });
    return unsubscribe;
  }, []);

  return time;
}

/**
 * Formatea segundos a MM:SS
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
