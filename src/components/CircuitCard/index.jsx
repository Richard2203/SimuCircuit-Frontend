import { useEffect, useState, useRef } from 'react';
import { CircuitSVG }         from '../../utils/circuitSVG';
import { getDifficultyClass } from '../../utils/difficulty';
import { CircuitosService }   from '../../services';
import { Circuit }            from '../../domain';

/**
 * Cache de circuitos completos (con netlist) en memoria.
 * Clave: id numerico del circuito.
 * @type {Map<number, Circuit>}
 */
const circuitDetailCache = new Map();

/**
 * Promesas en vuelo para evitar disparar la misma peticion dos veces.
 * @type {Map<number, Promise<Circuit>>}
 */
const inflightRequests = new Map();

/**
 * Pide el detalle de un circuito al backend (con cache + de-duplicacion).
 * @param {number} id
 * @returns {Promise<Circuit>}
 */
async function fetchCircuitDetail(id) {
  if (circuitDetailCache.has(id)) return circuitDetailCache.get(id);
  if (inflightRequests.has(id))   return inflightRequests.get(id);

  const promise = (async () => {
    try {
      const circuit = await CircuitosService.getCircuitoById(id);
      circuitDetailCache.set(id, circuit);
      return circuit;
    } finally {
      inflightRequests.delete(id);
    }
  })();

  inflightRequests.set(id, promise);
  return promise;
}

/**
 * CircuitCard — Tarjeta visual de un circuito en la biblioteca.
 *
 * @param {{ circuit: Circuit, onSelect: (c: Circuit) => void }} props
 */
export function CircuitCard({ circuit, onSelect }) {
  // Defensa por si llega JSON crudo
  const c = circuit instanceof Circuit ? circuit : Circuit.fromAny(circuit);

  const diffClass    = getDifficultyClass(c.dificultad);
  const apiId        = typeof c.id === 'number' ? c.id : null;
  const hasInlineSvg = c.tieneMiniaturaSvgReal;
  const hasNetlist   = c.netlist.length > 0;

  // Detalle ya cacheado al montar (si existe)
  const initial = !hasInlineSvg && !hasNetlist && apiId && circuitDetailCache.has(apiId)
    ? circuitDetailCache.get(apiId)
    : null;

  const [detailed,     setDetailed]     = useState(initial);
  const [loadingThumb, setLoadingThumb] = useState(false);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    if (!apiId || hasInlineSvg || hasNetlist || detailed) return;

    setLoadingThumb(true);
    fetchCircuitDetail(apiId)
      .then((full) => {
        if (cancelled.current) return;
        setDetailed(full);
      })
      .catch((err) => {
        console.warn(`[CircuitCard] No se pudo cargar miniatura del circuito ${apiId}:`, err);
      })
      .finally(() => {
        if (cancelled.current) return;
        setLoadingThumb(false);
      });

    return () => { cancelled.current = true; };
  }, [apiId, hasInlineSvg, hasNetlist, detailed]);

  const circuitForRender = detailed ?? c;

  return (
    <div
      className="circuit-card sim-panel"
      onClick={() => onSelect(c)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(c)}
      aria-label={`Seleccionar ${c.nombre}`}
    >
      {/* Preview del circuito */}
      <div className="card-preview">
        {hasInlineSvg ? (
          <div
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            dangerouslySetInnerHTML={{ __html: c.miniatura_svg }}
          />
        ) : loadingThumb ? (
          <div style={{
            width: 22, height: 22,
            border: '2px solid var(--border)',
            borderTopColor: 'var(--accent, #61dafb)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
        ) : (
          <CircuitSVG circuit={circuitForRender} preview={true} />
        )}
      </div>

      <div className="card-body">
        <div className="card-title">{c.nombre}</div>
        <div className="card-meta">
          {[c.unidad_tematica, c.materia].filter(Boolean).join(' · ')}
        </div>
        {c.dificultad && (
          <span className={`status-pill ${diffClass}`}>{c.dificultad}</span>
        )}
      </div>
    </div>
  );
}
