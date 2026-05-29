/**
 * AnimatedLED — Envuelve <LED /> y anima su estado on/off recorriendo el array
 * de snapshots devuelto por el analisis transitorio del backend.
 */

import { useEffect, useRef, useState } from 'react';
import { LED } from './led.jsx';

/**
 * @param {object[]} tranResults   - Snapshots del analisis transitorio.
 * @param {string}   nAnodo        - id del nodo conectado al naodo del LED.
 * @param {string}   nCatodo       - id del nodo conectado al catodo del LED.
 * @param {number}   vf            - Voltaje de umbral del LED (segun color).
 * @param {number}   speed         - Multiplicador de velocidad de reproduccion (0.001 .. 1).
 * @param {boolean}  paused        - Si true, congela el frame actual.
 * @param {object}   ledProps      - Resto de props que se pasan a <LED /> (x, y, scale, etc.)
 */
export function AnimatedLED({
  tranResults,
  nAnodo,
  nCatodo,
  vf = 2.0,
  speed = 0.05,
  paused = false,
  ...ledProps
}) {
  const [ledOn, setLedOn] = useState(false);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);
  // Acumula tiempo simulado cuando se pausa, para reanudar sin saltos.
  const pausedAtSimTimeRef = useRef(0);

  // Pre-computamos el rango temporal de los snapshots: arranque y duracion.
  // Si los snapshots vienen vacios o malformados, dejamos el LED apagado.
  const tMin = tranResults?.[0]?.tiempo ?? 0;
  const tMax = tranResults?.[tranResults.length - 1]?.tiempo ?? 0;
  const duracion = Math.max(0, tMax - tMin);

  useEffect(() => {
    if (!Array.isArray(tranResults) || tranResults.length === 0 || duracion === 0) {
      setLedOn(false);
      return;
    }

    // Busqueda lineal cacheando el ultimo indice consultado 
    let lastIdx = 0;
    function snapshotEn(tSim) {
      // Avanzamos lastIdx mientras el siguiente snapshot tambien sea <= tSim
      while (lastIdx + 1 < tranResults.length && tranResults[lastIdx + 1].tiempo <= tSim) {
        lastIdx++;
      }
      // Si vamos hacia atras (al hacer loop), reiniciamos
      if (tranResults[lastIdx].tiempo > tSim) lastIdx = 0;
      return tranResults[lastIdx];
    }

    function loop() {
      if (paused) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      if (startTimeRef.current === null) {
        startTimeRef.current = performance.now();
      }
      const elapsedReal = (performance.now() - startTimeRef.current) / 1000; // segundos reales
      const elapsedSim  = elapsedReal * speed;                                // segundos simulados
      // Loop continuo: cuando llegamos al final, volvemos al inicio
      const tSim = tMin + (elapsedSim % duracion);

      const snap = snapshotEn(tSim);
      const vA = readVoltage(snap?.voltajes, nAnodo);
      const vC = readVoltage(snap?.voltajes, nCatodo);
      const nuevoEstado = (vA - vC) >= vf;

      // Solo llamamos setLedOn cuando el estado realmente cambia, para
      // evitar re-renders innecesarios de React en cada frame.
      setLedOn(prev => (prev === nuevoEstado ? prev : nuevoEstado));

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // Reseteamos al desmontar para que la proxima animacion arranque limpia
      startTimeRef.current = null;
      pausedAtSimTimeRef.current = 0;
    };
  }, [tranResults, nAnodo, nCatodo, vf, speed, duracion, tMin, paused]);

  return <LED {...ledProps} energized={ledOn} />;
}


function readVoltage(voltajes, nodoId) {
  if (!voltajes || nodoId == null) return 0;
  const v = voltajes[nodoId];
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && 're' in v) return v.re;
  return Number(v) || 0;
}