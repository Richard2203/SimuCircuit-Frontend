import { getDifficultyClass, getDifficultyLabel } from '../../utils/difficulty';
import { formatTime } from '../../hooks/useSimTime';

/**
 * Cuenta componentes de una netlist por tipo.
 * @param {Array} netlist
 * @returns {{ R, C, L, F, M }}
 */
function contarDesdeNetlist(netlist) {
  if (!Array.isArray(netlist) || netlist.length === 0) return null;
  const counts = { R: 0, C: 0, L: 0, F: 0 };
  netlist.forEach(({ type }) => {
    if (type === 'resistencia')                          counts.R++;
    else if (type === 'capacitor')                       counts.C++;
    else if (type === 'bobina')                          counts.L++;
    else if (type === 'fuente_voltaje' || type === 'fuente_corriente') counts.F++;
  });
  return counts;
}

/**
 * SimulatorSidebar — Panel lateral de estado del simulador.
 * Soporta circuitos del dataset local (campos en inglés) y de la API
 * (campos en español: dificultad, materia, unidad_tematica).
 *
 * @param {{ circuit: object, simStatus: string, simTime: number, netlist?: Array }} props
 */
export function SimulatorSidebar({ circuit, simStatus, simTime, netlist }) {
  // ── Normalización de campos ─────────────────────────────────
  const difficulty = circuit.difficulty ?? circuit.dificultad ?? '';
  const unit       = circuit.unit ?? circuit.materia ?? '';
  const topic      = circuit.topic ?? circuit.unidad_tematica ?? '';
  const diffClass  = getDifficultyClass(difficulty);
  const diffLabel  = getDifficultyLabel(difficulty);

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

  // ── Conteo de componentes: netlist API > campos locales ─────
  const netlistCounts = contarDesdeNetlist(netlist ?? circuit.netlist);

  const componentRows = netlistCounts
    ? [
        { label: 'Resistencias',  value: netlistCounts.R || '—' },
        { label: 'Capacitores',   value: netlistCounts.C || '—' },
        { label: 'Bobinas',       value: netlistCounts.L || '—' },
        { label: 'Fuentes',       value: netlistCounts.F || '—' },
      ]
    : [
        { label: 'Resistencias',  value: circuit.R ?? '—' },
        { label: 'Capacitores',   value: circuit.C ?? '—' },
        { label: 'Bobinas',       value: circuit.L ?? '—' },
        { label: 'Fuentes',       value: circuit.F ?? '—' },
        { label: 'Mallas',        value: circuit.M ?? '—' },
      ];

  return (
    <aside className="sim-sidebar sim-panel p-4">
      <h3 className="sidebar-title">Estado del Simulador</h3>

      {/* Materia y tema (circuitos API) */}
      {unit && (
        <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: 10, color: 'var(--text-hint)', textTransform: 'uppercase',
            letterSpacing: '0.07em', fontWeight: 600, marginBottom: 4 }}>
            Materia
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{unit}</p>
          {topic && (
            <>
              <p style={{ fontSize: 10, color: 'var(--text-hint)', textTransform: 'uppercase',
                letterSpacing: '0.07em', fontWeight: 600, margin: '8px 0 4px' }}>
                Tema
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-hint)', lineHeight: 1.4 }}>{topic}</p>
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
