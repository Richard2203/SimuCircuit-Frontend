import { useEffect, useState, useRef } from 'react';
import { CircuitSVG } from '../../utils/circuitSVG';
import { getDifficultyClass } from '../../utils/difficulty';
import { CircuitosService } from '../../services';


//Cache en memoria de circuitos completos (con netlist).
const circuitDetailCache = new Map();

// Promesas en vuelo, para evitar disparar la misma peticion dos veces 
const inflightRequests = new Map();

async function fetchCircuitDetail(id) {
  if (circuitDetailCache.has(id)) return circuitDetailCache.get(id);
  if (inflightRequests.has(id))   return inflightRequests.get(id);

  const promise = (async () => {
    try {
      const data = await CircuitosService.getCircuitoById(id);
      const merged = { ...(data.circuito ?? {}), netlist: data.netlist ?? [] };
      circuitDetailCache.set(id, merged);
      return merged;
    } finally {
      inflightRequests.delete(id);
    }
  })();

  inflightRequests.set(id, promise);
  return promise;
}


 // Normaliza un circuito independientemente de si viene del dataset local
 // o de la API (/api/circuitos).
function normalizar(circuit) {
  return {
    id:         circuit.id,
    name:       circuit.name ?? circuit.nombre ?? circuit.nombre_circuito ?? '—',
    difficulty: circuit.difficulty ?? circuit.dificultad ?? '',
    unit:       circuit.unit ?? circuit.materia ?? '',
    topic:      circuit.topic ?? circuit.unidad_tematica ?? '',
    miniaturasvg: circuit.miniatura_svg ?? null,
    _raw: circuit,
  };
}

function isRealInlineSvg(svgString) {
  if (!svgString || typeof svgString !== 'string') return false;
  const trimmed = svgString.trim();
  if (trimmed === '<svg>...</svg>') return false;
  return trimmed.length > 30 && trimmed.includes('<svg');
}

export function CircuitCard({ circuit, onSelect }) {
  const c        = normalizar(circuit);
  const diffClass = getDifficultyClass(c.difficulty);

  const apiId       = typeof c.id === 'number' ? c.id : null;
  const hasInlineSvg = isRealInlineSvg(c.miniaturasvg);
  const hasNetlist   = Array.isArray(circuit.netlist) && circuit.netlist.length > 0;

  const initial = !hasInlineSvg && !hasNetlist && apiId && circuitDetailCache.has(apiId)
    ? circuitDetailCache.get(apiId)
    : null;

  const [detailed, setDetailed] = useState(initial);
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
  }, [apiId]);

  const circuitForRender = detailed ?? circuit;

  return (
    <div
      className="circuit-card sim-panel"
      onClick={() => onSelect(c._raw)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(c._raw)}
      aria-label={`Seleccionar ${c.name}`}
    >
      {/* Preview del circuito */}
      <div className="card-preview">
        {hasInlineSvg ? (
          /* SVG inline real proveniente de la API */
          <div
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            dangerouslySetInnerHTML={{ __html: c.miniaturasvg }}
          />
        ) : loadingThumb ? (
          /* Mini-spinner mientras llega la netlist */
          <div style={{
            width: 22, height: 22,
            border: '2px solid var(--border)',
            borderTopColor: 'var(--accent, #61dafb)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
        ) : (
          /* Componente SVG local, NetlistRenderer o placeholder */
          <CircuitSVG circuit={circuitForRender} preview={true} />
        )}
      </div>

      <div className="card-body">
        <div className="card-title">{c.name}</div>
        <div className="card-meta">
          {[c.topic, c.unit].filter(Boolean).join(' · ')}
        </div>
        {c.difficulty && (
          <span className={`status-pill ${diffClass}`}>{c.difficulty}</span>
        )}
      </div>
    </div>
  );
}
