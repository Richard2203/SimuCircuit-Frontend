/**
 * useComponentValue — Observer hook
 *
 * Manages the local state of a circuit component's numeric value.
 * Subscribes to COMPONENT_VALUE_CHANGED on the EventBus so external
 * changes (e.g. from a sidebar or other panel) are reflected here.
 *
 * Returns [value, setValue] in SI units.
 */

import { useState, useEffect, useCallback } from 'react';
import eventBus from '../core/EventBus';

/**
 * @param {string} componentId - unique id for this component
 * @param {number} initialValue - initial value in SI units
 * @returns {[number, (v: number) => void]}
 */
export function useComponentValue(componentId, initialValue) {
  const [value, setValueInternal] = useState(initialValue);

  // Listen for changes from other parts of the app (Observer)
  useEffect(() => {
    const unsub = eventBus.subscribe('COMPONENT_VALUE_CHANGED', ({ id, value: v }) => {
      if (id === componentId) {
        setValueInternal(v);
      }
    });
    return unsub;
  }, [componentId]);

  const setValue = useCallback((v) => {
    setValueInternal(v);
  }, []);

  return [value, setValue];
}
