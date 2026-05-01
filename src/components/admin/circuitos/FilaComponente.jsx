/**
 * FilaComponente — Fila individual de un componente en la lista de la netlist.
 * Muestra: ícono SVG del tipo, ID, tipo, valor, nodos, botón eliminar.
 *
 * Interacción bidireccional hover con PreviewSVG:
 *  - Hover aquí → onHover(id)
 *  - hoveredId === id → resaltado visual
 *
 * @param {{
 *   comp: { id, type, value, nodo_a, nodo_b },
 *   hoveredId: string|null,
 *   onHover: (id: string|null) => void,
 *   onEliminar: (id: string) => void,
 * }} props
 */
export function FilaComponente({ comp, hoveredId, onHover, onEliminar }) {
  const highlighted = hoveredId === comp.id;

  return (
    <div
      style={{
        ...rowStyle,
        background: highlighted ? 'rgba(108,99,255,0.12)' : 'transparent',
        borderColor: highlighted ? 'rgba(108,99,255,0.4)' : 'var(--border)',
      }}
      onMouseEnter={() => onHover(comp.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Icono del tipo */}
      <div style={iconCell}>
        <TypeIcon type={comp.type} />
      </div>

      {/* ID temporal */}
      <span style={idStyle}>{comp.id}</span>

      {/* Tipo */}
      <span style={typeStyle}>{labelFor(comp.type)}</span>

      {/* Valor */}
      <span style={valueStyle}>{comp.value || '—'}</span>

      {/* Nodos */}
      <span style={nodeStyle}>
        <NodeBadge>{comp.nodo_a ?? '?'}</NodeBadge>
        <span style={{ color: 'var(--text-hint)', fontSize: 10 }}>↔</span>
        <NodeBadge>{comp.nodo_b ?? '?'}</NodeBadge>
      </span>

      {/* Eliminar */}
      <button
        type="button"
        title="Eliminar componente"
        onClick={() => onEliminar(comp.id)}
        style={delBtn}
      >
        <TrashIcon />
      </button>
    </div>
  );
}

/**
 * ListaComponentesAgrupada — Lista de componentes agrupados por nodo compartido.
 *
 * @param {{ componentes, hoveredId, onHover, onEliminar }} props
 */
export function ListaComponentesAgrupada({ componentes, hoveredId, onHover, onEliminar }) {
  if (componentes.length === 0) {
    return <p style={{ fontSize: 12, color: 'var(--text-hint)', padding: '10px 0' }}>Sin componentes aún.</p>;
  }

  // Agrupar por nodos
  const nodoMap = {};
  componentes.forEach((c) => {
    [c.nodo_a, c.nodo_b].filter(Boolean).forEach((n) => {
      if (!nodoMap[n]) nodoMap[n] = [];
      if (!nodoMap[n].find((x) => x.id === c.id)) nodoMap[n].push(c);
    });
  });

  const nodos = Object.keys(nodoMap).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {nodos.map((nodo) => (
        <div key={nodo}>
          <p style={nodoLabel}>Nodo {nodo}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingLeft: 12, borderLeft: '2px solid var(--border)' }}>
            {nodoMap[nodo].map((c) => (
              <FilaComponente
                key={`${nodo}-${c.id}`}
                comp={c}
                hoveredId={hoveredId}
                onHover={onHover}
                onEliminar={onEliminar}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── TypeIcon ───────────────────────────────────── */
function TypeIcon({ type }) {
  const color = 'var(--accent)';
  switch (type) {
    case 'resistencia':
    case 'resistencia_variable':
      return (
        <svg width="28" height="16" viewBox="-18 -10 36 20">
          <rect x="-12" y="-6" width="24" height="12" rx="2" fill="none" stroke={color} strokeWidth="1.5"/>
          {type === 'resistencia_variable' && <line x1="-10" y1="-8" x2="10" y2="8" stroke={color} strokeWidth="1"/>}
        </svg>
      );
    case 'fuente_voltaje':
      return (
        <svg width="24" height="24" viewBox="-14 -14 28 28">
          <circle cx="0" cy="0" r="12" fill="none" stroke={color} strokeWidth="1.5"/>
          <line x1="-5" y1="0" x2="5" y2="0" stroke={color} strokeWidth="1.2"/>
          <line x1="0" y1="-5" x2="0" y2="5" stroke={color} strokeWidth="1.2"/>
        </svg>
      );
    case 'fuente_corriente':
      return (
        <svg width="24" height="24" viewBox="-14 -14 28 28">
          <circle cx="0" cy="0" r="12" fill="none" stroke={color} strokeWidth="1.5"/>
          <line x1="-6" y1="0" x2="3" y2="0" stroke={color} strokeWidth="1.2"/>
          <polygon points="3,0 -1,-3 -1,3" fill={color}/>
        </svg>
      );
    case 'capacitor':
      return (
        <svg width="24" height="24" viewBox="-14 -14 28 28">
          <line x1="-4" y1="-10" x2="-4" y2="10" stroke={color} strokeWidth="2"/>
          <line x1="4"  y1="-10" x2="4"  y2="10" stroke={color} strokeWidth="2"/>
        </svg>
      );
    case 'bobina':
      return (
        <svg width="28" height="16" viewBox="-18 -10 36 20">
          {[-12,-4,4,12].map((cx, i) => (
            <path key={i} d={`M ${cx-4} 0 A 4 4 0 0 1 ${cx+4} 0`} fill="none" stroke={color} strokeWidth="1.5"/>
          ))}
        </svg>
      );
    case 'diodo':
      return (
        <svg width="28" height="16" viewBox="-18 -10 36 20">
          <polygon points="-8,0 8,-8 8,8" fill="none" stroke={color} strokeWidth="1.5"/>
          <line x1="8" y1="-8" x2="8" y2="8" stroke={color} strokeWidth="1.8"/>
        </svg>
      );
    case 'transistor_bjt':
    case 'transistor_fet':
      return (
        <svg width="28" height="28" viewBox="-14 -14 28 28">
          <line x1="-12" y1="0" x2="-6" y2="0" stroke={color} strokeWidth="1.5"/>
          <line x1="-6" y1="-10" x2="-6" y2="10" stroke={color} strokeWidth="1.8"/>
          <line x1="-6" y1="-6" x2="6" y2="-12" stroke={color} strokeWidth="1.5"/>
          <line x1="-6" y1="6" x2="6" y2="12" stroke={color} strokeWidth="1.5"/>
        </svg>
      );
    default:
      return (
        <svg width="28" height="16" viewBox="-14 -8 28 16">
          <rect x="-10" y="-6" width="20" height="12" rx="2" fill="none" stroke={color} strokeWidth="1.5"/>
          <text textAnchor="middle" y="4" fill={color} fontSize="7">?</text>
        </svg>
      );
  }
}

function NodeBadge({ children }) {
  return (
    <span style={{ display: 'inline-block', padding: '1px 6px', background: 'rgba(108,99,255,0.12)', color: 'var(--accent)', borderRadius: 8, fontSize: 10, fontWeight: 700 }}>
      {children}
    </span>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6m4-6v6M9 6V4h6v2"/>
    </svg>
  );
}

const LABELS = {
  resistencia: 'Resistencia', resistencia_variable: 'Resistencia var.',
  fuente_voltaje: 'Fuente V', fuente_corriente: 'Fuente I',
  capacitor: 'Capacitor', bobina: 'Bobina', diodo: 'Diodo',
  transistor_bjt: 'BJT', transistor_fet: 'FET', regulador_voltaje: 'Regulador',
};
const labelFor = (t) => LABELS[t] ?? t;

/* ── Estilos ────────────────────────────────────── */
const rowStyle  = { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 'var(--r-sm)', border: '1px solid transparent', transition: 'background .15s, border-color .15s', cursor: 'default' };
const iconCell  = { flexShrink: 0, width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const idStyle   = { fontSize: 11, fontWeight: 700, color: 'var(--accent)', minWidth: 24 };
const typeStyle = { fontSize: 11, color: 'var(--text-muted)', minWidth: 80, flexShrink: 0 };
const valueStyle = { fontSize: 11, color: 'var(--text)', minWidth: 40 };
const nodeStyle  = { display: 'flex', alignItems: 'center', gap: 3, flex: 1 };
const delBtn     = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '2px 4px', borderRadius: 4, display: 'flex', flexShrink: 0 };
const nodoLabel  = { fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' };
