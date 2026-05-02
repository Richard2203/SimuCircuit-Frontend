/**
 * Etiqueta corta y compacta del nombre del pin (para mostrarla junto al nodo).
 */
const PIN_ABBR = {
  a: 'A', b: 'B', w: 'W',
  anodo: 'A', catodo: 'K',
  base: 'B', colector: 'C', emisor: 'E',
  gate: 'G', drain: 'D', source: 'S',
  vin: 'IN', vout: 'OUT', ref: 'REF',
};

/**
 * FilaComponente — Fila individual de un componente en la lista de la netlist.
 *
 * @param {{
 *   comp: { id, type, value, nodos: Record<string,string> },
 *   hoveredId: string|null,
 *   onHover: (id: string|null) => void,
 *   onEliminar: (id: string) => void,
 * }} props
 */
export function FilaComponente({ comp, hoveredId, onHover, onEliminar }) {
  const highlighted = hoveredId === comp.id;
  const pinEntries  = Object.entries(comp.nodos ?? {});

  return (
    <div
      className={`admin-comp-row ${highlighted ? 'admin-comp-row--hover' : ''}`}
      onMouseEnter={() => onHover(comp.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="admin-comp-row__icon"><TypeIcon type={comp.type} /></div>
      <span className="admin-comp-row__id">{comp.id}</span>
      <span className="admin-comp-row__type">{labelFor(comp.type)}</span>
      <span className="admin-comp-row__value">{comp.value || '—'}</span>
      <span className="admin-comp-row__nodes">
        {pinEntries.map(([pinKey, nodo], i) => (
          <span key={pinKey} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            {i > 0 && <span className="admin-node-arrow">·</span>}
            <span className="admin-pin-label">{PIN_ABBR[pinKey] ?? pinKey}</span>
            <span style={{ fontSize: 9, color: 'var(--text-hint)' }}>=</span>
            <NodeBadge>{nodo || '?'}</NodeBadge>
          </span>
        ))}
      </span>
      <button
        type="button"
        className="admin-comp-row__del"
        title="Eliminar componente"
        onClick={() => onEliminar(comp.id)}
      >
        <TrashIcon />
      </button>
    </div>
  );
}

/**
 * ListaComponentesAgrupada — Componentes agrupados por nodo compartido.
 * Para componentes multi-pin, aparecen bajo cada nodo al que se conecten.
 */
export function ListaComponentesAgrupada({ componentes, hoveredId, onHover, onEliminar }) {
  if (componentes.length === 0) {
    return <p style={{ fontSize: 12, color: 'var(--text-hint)', padding: '10px 0' }}>Sin componentes aún.</p>;
  }

  const nodoMap = {};
  componentes.forEach((c) => {
    const valoresNodos = Object.values(c.nodos ?? {}).filter(Boolean);
    valoresNodos.forEach((n) => {
      if (!nodoMap[n]) nodoMap[n] = [];
      if (!nodoMap[n].find((x) => x.id === c.id)) nodoMap[n].push(c);
    });
  });

  const nodos = Object.keys(nodoMap).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  return (
    <div className="admin-comp-group">
      {nodos.map((nodo) => (
        <div key={nodo}>
          <p className="admin-comp-group__node">Nodo {nodo}</p>
          <div className="admin-comp-group__list">
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

/* ── TypeIcon ─────────────────────────────────── */
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
          {[-12, -4, 4, 12].map((cx, i) => (
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
    case 'regulador_voltaje':
      return (
        <svg width="28" height="20" viewBox="-14 -10 28 20">
          <rect x="-10" y="-7" width="20" height="14" rx="2" fill="none" stroke={color} strokeWidth="1.5"/>
          <text x="0" y="3" textAnchor="middle" fill={color} fontSize="6" fontWeight="700">REG</text>
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
  return <span className="admin-node-pill">{children}</span>;
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
