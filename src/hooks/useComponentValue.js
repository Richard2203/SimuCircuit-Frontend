/**
 * useComponentValue — Observer hook
 *
 * Gestiona el valor numerico local de un componente del canvas SVG.
 * Se suscribe a COMPONENT_VALUE_CHANGED en el EventBus para que cambios
 * externos se reflejen aqui (Observer).
 *
 * Al confirmar un nuevo valor, ademas de publicar COMPONENT_VALUE_CHANGED,
 * despacha SET_NETLIST al Mediator para mantener la netlist del estado
 * global sincronizada con lo que el usuario ve en el canvas.
 *
 * @param {string} componentId  - ID unico del componente
 * @param {number} initialValue - Valor inicial en unidades SI
 * @returns {[number, (v: number, paramsOverride?: object) => void]}
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
   *
   * @param {number} newVal           - Nuevo valor en unidades SI.
   * @param {object} [paramsOverride] - Campos adicionales de "params" a actualizar
   *                                    junto con el valor, util para componentes 
   *                                    cuyo comportamiento en el backend depende de 
   *                                    params ademas de value
   */
  const setValue = useCallback((newVal, paramsOverride = null) => {
    setValueInternal(newVal);

    const { netlist } = mediator.getState();
    if (Array.isArray(netlist) && netlist.length > 0) {
      const netlistActualizada = netlist.map((comp) => {
        if (comp.id !== componentId) return comp;

        const updated = { ...comp, value: String(newVal) };

        // Aplicar overrides de params si se proporcionaron
        if (paramsOverride && typeof paramsOverride === 'object') {
          updated.params = { ...(comp.params ?? {}), ...paramsOverride };
        }

        return updated;
      });
      mediator.dispatch('SET_NETLIST', netlistActualizada);
    }
  }, [componentId]);

  return [value, setValue];
}
