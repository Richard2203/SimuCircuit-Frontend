import { CircuitSVG } from '../../utils/circuitSVG';
import { getDifficultyClass } from '../../utils/difficulty';

/**
 * Normaliza un circuito independientemente de si viene del dataset local
 * o de la API (/api/circuitos). La API usa campos en español con distintos
 * nombres (nombre_circuito, dificultad, unidad_tematica, miniatura_svg).
 */
function normalizar(circuit) {
  return {
    id:         circuit.id,
    name:       circuit.name ?? circuit.nombre ?? circuit.nombre_circuito ?? '—',
    difficulty: circuit.difficulty ?? circuit.dificultad ?? '',
    unit:       circuit.unit ?? circuit.materia ?? '',
    topic:      circuit.topic ?? circuit.unidad_tematica ?? '',
    miniaturasvg: circuit.miniatura_svg ?? null,
    // Preservar el resto para SELECT_CIRCUIT / cargarCircuito
    _raw: circuit,
  };
}

/**
 * CircuitCard — Tarjeta de la biblioteca.
 * Soporta circuitos del dataset local y de la API REST.
 *
 * @param {{ circuit: object, onSelect: Function }} props
 */
export function CircuitCard({ circuit, onSelect }) {
  const c        = normalizar(circuit);
  const diffClass = getDifficultyClass(c.difficulty);

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
        {c.miniaturasvg ? (
          /* SVG inline proveniente de la API */
          <div
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            dangerouslySetInnerHTML={{ __html: c.miniaturasvg }}
          />
        ) : (
          /* Componente SVG local o placeholder */
          <CircuitSVG circuit={c._raw} preview={true} />
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