/**
 * useComponentValue — Observer hook
 *
 * Gestiona el valor numérico local de un componente del canvas SVG.
 * Se suscribe a COMPONENT_VALUE_CHANGED en el EventBus para que cambios
 * externos (ej. sidebar, otro panel) se reflejen aquí (Observer).
 *
 * Al confirmar un nuevo valor, además de publicar COMPONENT_VALUE_CHANGED,
 * despacha SET_NETLIST al Mediator para mantener la netlist del estado
 * global sincronizada con lo que el usuario ve en el canvas.
 *
 * @param {string} componentId  - ID único del componente (ej. "R1")
 * @param {number} initialValue - Valor inicial en unidades SI
 * @returns {[number, (v: number) => void]}
 */

import { useState, useEffect, useCallback } from 'react';
import eventBus from '../core/EventBus';
import mediator  from '../core/Mediator';

export function useComponentValue(componentId, initialValue) {
  const [value, setValueInternal] = useState(initialValue);

  // Observer: escuchar cambios externos al valor de este componente
  useEffect(() => {
    const unsub = eventBus.subscribe('COMPONENT_VALUE_CHANGED', ({ id, value: v }) => {
      if (id === componentId) {
        setValueInternal(v);
      }
    });
    return unsub;
  }, [componentId]);

  /**
   * Actualiza el valor local y sincroniza la netlist en el Mediator.
   * Llamado tras confirmar la edición inline en el canvas.
   */
  const setValue = useCallback((newVal) => {
    setValueInternal(newVal);

    // Actualizar la netlist del estado global en el Mediator
    const { netlist } = mediator.getState();
    if (Array.isArray(netlist) && netlist.length > 0) {
      const netlistActualizada = netlist.map((comp) =>
        comp.id === componentId
          ? { ...comp, value: String(newVal) }
          : comp
      );
      mediator.dispatch('SET_NETLIST', netlistActualizada);
    }
  }, [componentId]);

  return [value, setValue];
}