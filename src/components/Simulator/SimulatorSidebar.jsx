import { getDifficultyClass, getDifficultyLabel } from '../../utils/difficulty';
import { formatTime } from '../../hooks/useSimTime';
import { Circuit }    from '../../domain';

/**
 * SimulatorSidebar — Panel de estado del simulador.
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

  // Conteos: si nos pasaron una netlist explicita distinta a la del circuito,
  // recalculamos sobre ella (caso tipico: el usuario esta editando en vivo).
  const counts = (() => {
    if (Array.isArray(netlist) && netlist.length > 0 && netlist !== c.netlist) {
      return c.withNetlist(netlist).componentCounts;
    }
    return c.componentCounts;
  })();

  // Lista de componentes: mostramos siempre los lineales basicos.
  const componentRows = [
    { label: 'Resistencias', value: counts.R, mostrarSiempre: true },
    { label: 'Capacitores',  value: counts.C, mostrarSiempre: true },
    { label: 'Bobinas',      value: counts.L, mostrarSiempre: true },
    { label: 'Fuentes',      value: counts.F, mostrarSiempre: true },
    { label: 'Diodos',       value: counts.D, mostrarSiempre: false },
    { label: 'Transistores', value: counts.Q + counts.J, mostrarSiempre: false },
    { label: 'Reguladores',  value: counts.U, mostrarSiempre: false },
  ].filter(r => r.mostrarSiempre || r.value > 0);

  // Estilos compartidos

  const seccionTitulo = {
    fontSize: 10,
    color: 'var(--text-hint)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 600,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottom: '1px solid var(--border)',
  };

  const filaMetadato = { display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 8 };
  const filaLabel = { fontSize: 10, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 };
  const filaValor = { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 };

  const filaEstado = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid var(--border)',
  };
  const filaEstadoLabel = { fontSize: 12, color: 'var(--text-hint)' };

  // Render

  return (
    <div className="sim-panel p-4" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: 20,
      alignItems: 'start',
    }}>

      {/* Columna 1: Contexto academico */}
      <div>
        <p style={seccionTitulo}>Contexto</p>

        {c.materia && (
          <div style={filaMetadato}>
            <span style={filaLabel}>Materia</span>
            <span style={filaValor}>{c.materia}</span>
          </div>
        )}

        {c.unidad_tematica && (
          <div style={filaMetadato}>
            <span style={filaLabel}>Unidad temática</span>
            <span style={filaValor}>{c.unidad_tematica}</span>
          </div>
        )}

        {c.tema && (
          <div style={filaMetadato}>
            <span style={filaLabel}>Tema</span>
            <span style={filaValor}>{c.tema}</span>
          </div>
        )}

        {!c.materia && !c.unidad_tematica && !c.tema && (
          <p style={{ ...filaValor, fontStyle: 'italic', opacity: 0.6 }}>
            Sin metadatos académicos
          </p>
        )}
      </div>

      {/* Columna 2: Estado en tiempo real */}
      <div>
        <p style={seccionTitulo}>Estado actual</p>

        <div style={filaEstado}>
          <span style={filaEstadoLabel}>Estado</span>
          <span className={`status-pill ${statusClass}`}>
            {simStatus.charAt(0).toUpperCase() + simStatus.slice(1)}
          </span>
        </div>

        <div style={filaEstado}>
          <span style={filaEstadoLabel}>Alimentación</span>
          <span className={`status-pill ${isActive ? 'status-activo' : 'status-detenido'}`}>
            {isActive ? 'Activa' : 'Inactiva'}
          </span>
        </div>

        <div style={filaEstado}>
          <span style={filaEstadoLabel}>Dificultad</span>
          <span className={`status-pill ${diffClass}`}>{diffLabel || '—'}</span>
        </div>

        <div style={{ ...filaEstado, borderBottom: 'none', paddingTop: 10 }}>
          <span style={filaEstadoLabel}>Tiempo</span>
          <span style={{
            fontSize: 15,
            fontFamily: "'SF Mono', 'Consolas', monospace",
            color: 'var(--accent-soft)',
            fontWeight: 600,
            letterSpacing: '0.05em',
          }}>{formatTime(simTime)}</span>
        </div>
      </div>

      {/* Columna 3: Componentes */}
      <div>
        <p style={seccionTitulo}>Componentes</p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 6,
        }}>
          {componentRows.map(({ label, value }) => (
            <div key={label} className="stat-badge" style={{ marginBottom: 0 }}>
              <span className="stat-label">{label}</span>
              <span className="stat-value">{value || '—'}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}