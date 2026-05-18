import { useState, useEffect } from 'react';
import { Component, labelForTipo, labelForPin, resolvePinKey } from '../../../domain';
import { DIRECCIONES } from './Circuitlayout';

/**
 * FilaComponente — Fila individual de un componente en la lista.
 */
export function FilaComponente({
  comp,
  hoveredId,
  selectedId,
  onHover,
  onEliminar,
  onMover,
  onRotar,
  onEditar,
  onChangeNodo,
}) {
  const view = toViewModel(comp);
  const isHovered  = hoveredId === view.id;
  const isSelected = selectedId === view.id;
  const supportsLayout = Boolean(onMover || onRotar);

  return (
    <div
      className={`admin-comp-row ${isHovered ? 'admin-comp-row--hover' : ''} ${isSelected ? 'admin-comp-row--selected' : ''}`}
      onMouseEnter={() => onHover?.(view.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="admin-comp-row__icon"><TypeIcon type={view.type} /></div>

      {/* ID + tipo + valor son clickables para editar (zona principal) */}
      <button
        type="button"
        className="admin-comp-row__main"
        onClick={() => onEditar?.(view.id)}
        title="Click para editar este componente"
      >
        <span className="admin-comp-row__id">{view.id}</span>
        <span className="admin-comp-row__type">{labelForTipo(view.type)}</span>
        <span className="admin-comp-row__value">{view.value || '—'}</span>
      </button>

      {/* Pines / nodos editables */}
      <span className="admin-comp-row__nodes">
        {view.pines.map(({ pinAdmin, pinCanonico, nodo }, i) => (
          <span key={pinAdmin} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            {i > 0 && <span className="admin-node-arrow">·</span>}
            <span className="admin-pin-label">{labelForPin(pinCanonico) ?? pinAdmin}</span>
            <span style={{ fontSize: 9, color: 'var(--text-hint)' }}>=</span>
            <NodoEditable
              valor={nodo}
              onChange={onChangeNodo
                ? (newVal) => onChangeNodo(view.id, pinAdmin, newVal)
                : null
              }
            />
          </span>
        ))}
      </span>

      {supportsLayout && (
        <div className="admin-comp-row__nudge" aria-label="Controles de posición">
          <NudgeBtn title="Mover izquierda" disabled={!onMover}
            onClick={() => onMover?.(view.id, DIRECCIONES.IZQUIERDA)}>‹</NudgeBtn>
          <NudgeBtn title="Mover arriba" disabled={!onMover}
            onClick={() => onMover?.(view.id, DIRECCIONES.ARRIBA)}>∧</NudgeBtn>
          <NudgeBtn title="Mover abajo" disabled={!onMover}
            onClick={() => onMover?.(view.id, DIRECCIONES.ABAJO)}>∨</NudgeBtn>
          <NudgeBtn title="Mover derecha" disabled={!onMover}
            onClick={() => onMover?.(view.id, DIRECCIONES.DERECHA)}>›</NudgeBtn>
          <NudgeBtn title="Rotar 90° (0→90→180→270)" disabled={!onRotar} variant="rotate"
            onClick={() => onRotar?.(view.id)}>↻</NudgeBtn>
        </div>
      )}

      <button
        type="button"
        className="admin-comp-row__del"
        title="Eliminar componente"
        onClick={() => onEliminar?.(view.id)}
      >
        <TrashIcon />
      </button>
    </div>
  );
}

/**
 * Badge de nodo que al hacer click se vuelve input editable.
 */
function NodoEditable({ valor, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(valor ?? '');

  useEffect(() => { setDraft(valor ?? ''); }, [valor]);

  if (!onChange) return <span className="admin-node-pill">{valor || '?'}</span>;

  if (!editing) {
    return (
      <button
        type="button"
        className="admin-node-pill admin-node-pill--clickable"
        title="Click para cambiar el nodo"
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
      >
        {valor || '?'}
      </button>
    );
  }

  function commit() {
    const trimmed = String(draft).trim();
    if (trimmed && trimmed !== valor) {
      onChange(trimmed);
    }
    setEditing(false);
  }

  return (
    <input
      autoFocus
      type="text"
      className="admin-node-pill-input"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
        if (e.key === 'Escape') { e.preventDefault(); setEditing(false); setDraft(valor ?? ''); }
      }}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

function NudgeBtn({ children, title, onClick, disabled, variant }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`admin-nudge-btn ${variant === 'rotate' ? 'admin-nudge-btn--rotate' : ''}`}
    >
      {children}
    </button>
  );
}

function toViewModel(comp) {
  if (comp instanceof Component) {
    const adminJson = comp.toAdminJSON();
    return {
      id:    comp.id,
      type:  comp.type,
      value: comp.value,
      pines: Object.entries(adminJson.nodos ?? {}).map(([pinAdmin, nodo]) => ({
        pinAdmin,
        pinCanonico: resolvePinKey(comp.type, pinAdmin),
        nodo,
      })),
    };
  }
  return {
    id:    comp.id,
    type:  comp.type,
    value: comp.value,
    pines: Object.entries(comp.nodos ?? comp.nodes ?? {}).map(([pinAdmin, nodo]) => ({
      pinAdmin,
      pinCanonico: resolvePinKey(comp.type, pinAdmin),
      nodo: typeof nodo === 'object' ? nodo.nodo : nodo,
    })),
  };
}

export function ListaComponentesAgrupada({
  componentes,
  hoveredId,
  selectedId,
  onHover,
  onEliminar,
  onMover,
  onRotar,
  onEditar,
  onChangeNodo,
}) {
  if (componentes.length === 0) {
    return <p style={{ fontSize: 12, color: 'var(--text-hint)', padding: '10px 0' }}>Sin componentes aún.</p>;
  }

  // Orden estable: por designador (R1, R2, ..., V1, V2, ...)
  const ordenados = [...componentes].sort((a, b) =>
    String(a.id).localeCompare(String(b.id), undefined, { numeric: true })
  );

  return (
    <div className="admin-comp-group">
      <div className="admin-comp-group__list">
        {ordenados.map((c) => (
          <FilaComponente
            key={c.id}
            comp={c}
            hoveredId={hoveredId}
            selectedId={selectedId}
            onHover={onHover}
            onEliminar={onEliminar}
            onMover={onMover}
            onRotar={onRotar}
            onEditar={onEditar}
            onChangeNodo={onChangeNodo}
          />
        ))}
      </div>
    </div>
  );
}

/* TypeIcon */
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

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6m4-6v6M9 6V4h6v2"/>
    </svg>
  );
}