import { getDifficultyClass, getDifficultyLabel } from '../../utils/difficulty';
import { formatTime } from '../../hooks/useSimTime';
import { Circuit }    from '../../domain';

/**
 * SimulatorSidebar — Panel lateral de estado del simulador.
 *
 * @param {{
 *   circuit: Circuit,
 *   simStatus: string,
 *   simTime: number,
 *   netlist?: Array
 * }} props
 */
export function SimulatorSidebar({ circuit, simStatus, simTime, netlist }) {
  // Defensa contra JSON crudo
  const c = circuit instanceof Circuit ? circuit : Circuit.fromAny(circuit);

  const diffClass = getDifficultyClass(c.dificultad);
  const diffLabel = getDifficultyLabel(c.dificultad);

  const isActive = simStatus === 'activo';

  const statusClass = {
    activo:   'status-activo',
    pausado:  'status-pausado',
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
      value: diffLabel || '—',
      cls: diffClass,
    },
  ];

  // Conteos: si nos pasaron netlist explicita, recalcular sobre esa
  const counts = (() => {
    if (Array.isArray(netlist) && netlist.length > 0 && netlist !== c.netlist) {
      // Construir un Circuit "espejo" solo para reusar el getter componentCounts
      return c.withNetlist(netlist).componentCounts;
    }
    return c.componentCounts;
  })();

  const componentRows = [
    { label: 'Resistencias', value: counts.R || '—' },
    { label: 'Capacitores',  value: counts.C || '—' },
    { label: 'Bobinas',      value: counts.L || '—' },
    { label: 'Fuentes',      value: counts.F || '—' },
    { label: 'Diodos',       value: counts.D || '—' },
    { label: 'Transistores', value: (counts.Q + counts.J) || '—' },
  ].filter((r) => r.value !== '—' || ['Resistencias', 'Capacitores', 'Bobinas', 'Fuentes'].includes(r.label));

  return (
    <aside className="sim-sidebar sim-panel p-4">
      <h3 className="sidebar-title">Estado del Simulador</h3>

      {/* Materia y tema */}
      {c.materia && (
        <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: 10, color: 'var(--text-hint)', textTransform: 'uppercase',
            letterSpacing: '0.07em', fontWeight: 600, marginBottom: 4 }}>
            Materia
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{c.materia}</p>
          {c.unidad_tematica && (
            <>
              <p style={{ fontSize: 10, color: 'var(--text-hint)', textTransform: 'uppercase',
                letterSpacing: '0.07em', fontWeight: 600, margin: '8px 0 4px' }}>
                Tema
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-hint)', lineHeight: 1.4 }}>{c.unidad_tematica}</p>
            </>
          )}
        </div>
      )}

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
