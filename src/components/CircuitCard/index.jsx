import { CircuitSVG } from '../../utils/circuitSVG';
import { getDifficultyClass } from '../../utils/difficulty';

/**
 * CircuitCard — Tarjeta individual de circuito en la biblioteca.
 * Muestra preview SVG, metadatos y badge de dificultad.
 *
 * @param {{ circuit: object, onSelect: Function }} props
 */
export function CircuitCard({ circuit, onSelect }) {
  const diffClass = getDifficultyClass(circuit.difficulty);

  return (
    <div
      className="circuit-card sim-panel"
      onClick={() => onSelect(circuit)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(circuit)}
      aria-label={`Seleccionar ${circuit.name}`}
    >
      {/* Preview del circuito */}
      <div className="card-preview">
        <CircuitSVG circuit={circuit} />
      </div>

      {/* Información */}
      <div className="card-body">
        <div className="card-title">{circuit.name}</div>

        {/* Métricas compactas */}
        <div className="card-stats">
          <span>R: {circuit.R}</span>
          <span>F: {circuit.F}</span>
          <span>M: {circuit.M}</span>
          <span>C: {circuit.C}</span>
          <span>L: {circuit.L}</span>
        </div>

        <span className={`status-pill ${diffClass}`}>
          {circuit.difficulty}
        </span>
      </div>
    </div>
  );
}
