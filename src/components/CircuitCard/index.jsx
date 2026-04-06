import { CircuitSVG } from '../../utils/circuitSVG';
import { getDifficultyClass } from '../../utils/difficulty';

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
      {/* Preview del circuito — modo compacto */}
      <div className="card-preview">
        <CircuitSVG circuit={circuit} preview={true} />
      </div>

      <div className="card-body">
        <div className="card-title">{circuit.name}</div>
        <div className="card-meta">{circuit.topic} · {circuit.unit}</div>
        <span className={`status-pill ${diffClass}`}>
          {circuit.difficulty}
        </span>
      </div>
    </div>
  );
}
