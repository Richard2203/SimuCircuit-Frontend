import { useEffect } from 'react';

/**
 * PanelListaCircuitos — Panel deslizante con la lista de circuitos existentes.
 *
 * @param {{
 *   abierto: boolean,
 *   circuitos: Array,
 *   loading: boolean,
 *   onCerrar: () => void,
 *   onEditar: (circuito) => void,
 *   onEliminar: (circuito) => void,
 * }} props
 */
export function PanelListaCircuitos({ abierto, circuitos = [], loading, onCerrar, onEditar, onEliminar }) {
  useEffect(() => {
    if (!abierto) return;
    const handler = (e) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <>
      <div className="admin-panel-overlay" onClick={onCerrar} />
      <aside className="admin-panel-list" role="dialog" aria-label="Lista de circuitos">
        <header className="admin-panel-list__header">
          <h3 className="admin-panel-list__title">Circuitos existentes</h3>
          <button className="admin-panel-list__close" onClick={onCerrar} aria-label="Cerrar panel">×</button>
        </header>

        <p className="admin-panel-list__count">
          {loading ? 'Cargando…' : `${circuitos.length} circuito${circuitos.length !== 1 ? 's' : ''} registrado${circuitos.length !== 1 ? 's' : ''}`}
        </p>

        <div className="admin-panel-list__body">
          {loading ? (
            <p className="admin-panel-list__empty">Cargando circuitos…</p>
          ) : circuitos.length === 0 ? (
            <p className="admin-panel-list__empty">No hay circuitos aún. Crea el primero con el botón "+ Nuevo".</p>
          ) : (
            circuitos.map((c) => (
              <CardCircuito
                key={c.id}
                circuito={c}
                onEditar={() => onEditar(c)}
                onEliminar={() => onEliminar(c)}
              />
            ))
          )}
        </div>
      </aside>
    </>
  );
}

/**
 * CardCircuito — Tarjeta individual con miniatura, nombre, descripcion y acciones.
 *
 * @param {{
 *   circuito: { id, nombre_circuito, descripcion, dificultad, miniatura_svg },
 *   onEditar: () => void,
 *   onEliminar: () => void,
 * }} props
 */
export function CardCircuito({ circuito, onEditar, onEliminar }) {
  const { nombre_circuito, descripcion, dificultad, miniatura_svg } = circuito;

  const badgeClass = (() => {
    switch (dificultad) {
      case 'Básico':     return 'admin-circuit-card__badge--basico';
      case 'Intermedio': return 'admin-circuit-card__badge--intermedio';
      case 'Avanzado':   return 'admin-circuit-card__badge--avanzado';
      default:           return 'admin-circuit-card__badge--default';
    }
  })();

  return (
    <article className="admin-circuit-card">
      <div className="admin-circuit-card__thumb">
        {miniatura_svg && miniatura_svg !== '<svg>...</svg>' ? (
          <div dangerouslySetInnerHTML={{ __html: miniatura_svg }} />
        ) : (
          <span style={{ fontSize: 9, color: 'var(--text-hint)' }}>SVG</span>
        )}
      </div>

      <div className="admin-circuit-card__body">
        <div className="admin-circuit-card__top">
          <h4 className="admin-circuit-card__name">{nombre_circuito}</h4>
          {dificultad && (
            <span className={`admin-circuit-card__badge ${badgeClass}`}>{dificultad}</span>
          )}
        </div>
        <p className="admin-circuit-card__desc">{descripcion}</p>
        <div className="admin-circuit-card__actions">
          <button className="admin-icon-btn"                          onClick={onEditar}   title="Editar"><PencilIcon /></button>
          <button className="admin-icon-btn admin-icon-btn--danger"   onClick={onEliminar} title="Eliminar"><TrashIcon /></button>
        </div>
      </div>
    </article>
  );
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6m4-6v6M9 6V4h6v2"/>
    </svg>
  );
}
