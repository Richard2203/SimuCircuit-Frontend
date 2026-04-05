import { getDifficultyClass } from '../../utils/difficulty';
import { formatTime } from '../../hooks/useSimTime';

/**
 * SimulatorSidebar — Panel lateral de estado del simulador.
 * Muestra estado, alimentación, dificultad, tiempo y conteo de componentes.
 *
 * @param {{ circuit: object, simStatus: string, simTime: number }} props
 */
export function SimulatorSidebar({ circuit, simStatus, simTime }) {
  const isActive = simStatus === 'activo';
  const diffClass = getDifficultyClass(circuit.difficulty);

  const statusClass = {
    activo: 'status-activo',
    pausado: 'status-pausado',
    detenido: 'status-detenido',
  }[simStatus] ?? 'status-detenido';

  const statusRows = [
    {
      label: 'Estado',
      value: simStatus.charAt(0).toUpperCase() + simStatus.slice(1),
      cls: statusClass,
    },
    {
      label: 'Alimentación',
      value: isActive ? 'Activa' : 'Inactiva',
      cls: isActive ? 'status-activo' : 'status-detenido',
    },
    {
      label: 'Dificultad',
      value: circuit.difficulty,
      cls: diffClass,
    },
  ];

  const componentRows = [
    { label: 'Resistencias', value: circuit.R },
    { label: 'Capacitores', value: circuit.C },
    { label: 'Bobinas', value: circuit.L },
    { label: 'Fuentes', value: circuit.F },
    { label: 'Mallas', value: circuit.M },
  ];

  return (
    <aside className="sim-sidebar sim-panel p-4">
      <h3 className="sidebar-title">Estado del Simulador</h3>

      {/* Filas de estado */}
      {statusRows.map((r) => (
        <div key={r.label} className="sidebar-row">
          <span className="sidebar-label">{r.label}:</span>
          <span className={`status-pill ${r.cls}`}>{r.value}</span>
        </div>
      ))}

      {/* Timer */}
      <div className="sidebar-row">
        <span className="sidebar-label">Tiempo:</span>
        <span className="sidebar-timer">{formatTime(simTime)}</span>
      </div>

      {/* Componentes */}
      <div className="sidebar-components">
        <p className="sidebar-section-label">Componentes</p>
        {componentRows.map(({ label, value }) => (
          <div key={label} className="stat-badge">
            <span className="stat-label">{label}</span>
            <span className="stat-value">{value}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
