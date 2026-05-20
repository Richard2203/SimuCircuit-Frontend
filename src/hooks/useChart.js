/**
 * Hook que gestiona el ciclo de vida de una instancia Chart.js
 * Destruye el chart anterior antes de crear uno nuevo para evitar el
 * error "Canvas is already in use" en re-renders.
 * @param {React.RefObject<HTMLCanvasElement>} canvasRef
 * @param {object} config  - Configuracion completa de Chart
 * @param {any[]}  deps    - Dependencias que disparan la recreacion del chart
 */
import { useRef, useEffect } from 'react';
import { Chart } from 'chart.js';

export function useChart(canvasRef, config, deps) {
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    instanceRef.current?.destroy();
    instanceRef.current = new Chart(canvasRef.current, config);

    return () => { instanceRef.current?.destroy(); };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}