/**
 * useSimulacionEvents — Hook Observer para eventos semánticos de simulación.
 *
 * Permite que cualquier componente reaccione a los eventos que publica
 * el Mediator sin necesidad de leer el estado completo.
 *
 * Eventos disponibles:
 *   - 'simulacion:iniciada'    { tipo, netlist }
 *   - 'simulacion:completada'  { tipo, resultado }
 *   - 'simulacion:error'       { tipo, error }
 *   - 'circuito:cargado'       circuitoConNetlist
 *   - 'filtros:actualizados'   filtrosApi
 *
 * @param {object} handlers - Mapa de evento → callback
 * @example
 *   useSimulacionEvents({
 *     'simulacion:completada': ({ tipo, resultado }) => console.log(tipo, resultado),
 *     'simulacion:error':      ({ error }) => toast.error(error),
 *   });
 */

import { useEffect } from 'react';
import eventBus from '../core/EventBus';

export function useSimulacionEvents(handlers = {}) {
  useEffect(() => {
    const unsubs = Object.entries(handlers).map(([evento, cb]) =>
      eventBus.subscribe(evento, cb)
    );
    return () => unsubs.forEach((fn) => fn());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}