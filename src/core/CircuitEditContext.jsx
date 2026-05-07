/**
 * CircuitEditContext — Contexto global de edición del circuito.
 *
 * Provee un flag locked que indica si los componentes del SVG
 * estan bloqueados para edicion.
 */

import { createContext, useContext } from 'react';

export const CircuitEditContext = createContext({ locked: false });

export function CircuitEditProvider({ locked, children }) {
  return (
    <CircuitEditContext.Provider value={{ locked }}>
      {children}
    </CircuitEditContext.Provider>
  );
}

export function useCircuitEdit() {
  return useContext(CircuitEditContext);
}