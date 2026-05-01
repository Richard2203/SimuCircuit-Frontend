import { useEffect } from 'react';
import { ModalConfirmacion } from '../shared/ModalConfirmacion';
import { useState } from 'react';

/**
 * CardCircuito — Tarjeta individual de un circuito en el panel lateral.
 *
 * @param {{
 *   circuito: object,
 *   onEditar: (c) => void,
 *   onEliminar: (c) => void,
 * }} props
 */
export function CardCircuito({ circuito, onEditar, onEliminar }) {
  const badgeColor = {
    'Básico':      { bg: 'rgba(74,222,128,0.15)',  color: '#4ade80' },
    'Intermedio':  { bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24' },
    'Avanzado':    { bg: 'rgba(248,113,113,0.15)', color: '#f87171' },
  }[circuito.dificultad] ?? { bg: 'var(--border)', color: 'var(--text-muted)' };

  return (
    <div style={cardStyle}>
      {/* Miniatura SVG */}
      {circuito.miniatura_svg && (
        <div
          style={thumbWrap}
          dangerouslySetInnerHTML={{ __html: circuito.miniatura_svg }}
        />
      )}

      <div style={cardBody}>
        <div style={cardTop}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', flex: 1, marginRight: 8 }}>
            {circuito.nombre_circuito ?? circuito.nombre ?? '—'}
          </span>
          <span style={{ ...badge, background: badgeColor.bg, color: badgeColor.color }}>
            {circuito.dificultad}
          </span>
        </div>

        <p style={descStyle}>
          {(circuito.descripcion ?? '').slice(0, 120)}{(circuito.descripcion ?? '').length > 120 ? '…' : ''}
        </p>

        <div style={cardActions}>
          <button title="Editar" onClick={() => onEditar(circuito)} style={iconBtn}>
            <PencilIcon />
          </button>
          <button title="Eliminar" onClick={() => onEliminar(circuito)} style={{ ...iconBtn, color: 'var(--danger)' }}>
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * PanelListaCircuitos 
 *
 * @param {{
 *   abierto: boolean,
 *   circuitos: Array,
 *   onCerrar: () => void,
 *   onEditar: (c) => void,
 *   onEliminar: (c) => void,
 * }} props
 */
export function PanelListaCircuitos({ abierto, circuitos = [], onCerrar, onEditar, onEliminar }) {
  const [confirmEliminar, setConfirmEliminar] = useState(null);

  // Cerrar con Escape
  useEffect(() => {
    if (!abierto) return;
    const fn = (e) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [abierto, onCerrar]);

  // Bloquear scroll del body cuando está abierto
  useEffect(() => {
    document.body.style.overflow = abierto ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [abierto]);

  if (!abierto) return null;

  return (
    <>
      {/* ── Overlay que cierra al clic fuera ── */}
      <div style={overlay} onClick={onCerrar} />

      {/* ── Panel ── */}
      <div style={panel}>
        {/* Cabecera */}
        <div style={panelHeader}>
          <h3 style={panelTitle}>Circuitos guardados</h3>
          <button onClick={onCerrar} style={closeBtn} aria-label="Cerrar panel">✕</button>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: '0 20px 10px' }}>
          {circuitos.length} circuito{circuitos.length !== 1 ? 's' : ''} en la base de datos
        </p>

        {/* Lista de cards */}
        <div style={cardList}>
          {circuitos.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-hint)', textAlign: 'center', padding: 24 }}>
              No hay circuitos registrados.
            </p>
          ) : (
            circuitos.map((c) => (
              <CardCircuito
                key={c.id}
                circuito={c}
                onEditar={(circ) => { onEditar(circ); onCerrar(); }}
                onEliminar={(circ) => setConfirmEliminar(circ)}
              />
            ))
          )}
        </div>
      </div>

      {/* Modal de confirmacion para eliminar */}
      <ModalConfirmacion
        abierto={!!confirmEliminar}
        titulo="Eliminar circuito"
        mensaje={`¿Eliminar "${confirmEliminar?.nombre_circuito ?? confirmEliminar?.nombre}"? Esta acción no se puede deshacer.`}
        labelConfirmar="Eliminar"
        onConfirmar={() => { onEliminar(confirmEliminar); setConfirmEliminar(null); }}
        onCancelar={() => setConfirmEliminar(null)}
      />
    </>
  );
}

/* ── Iconos ────────────────────────────────────── */
function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
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

/* ── Estilos ─────────────────────────────────────
   Panel: 50% de ancho en desktop, 100% en mobile.
*/
const overlay = {
  position: 'fixed', inset: 0, zIndex: 300,
  background: 'rgba(13,13,13,0.55)',
  backdropFilter: 'blur(2px)',
};

const panel = {
  position: 'fixed',
  top: 0, right: 0, bottom: 0,
  width: 'min(50%, 600px)',
  zIndex: 301,
  background: 'var(--bg-elevated)',
  borderLeft: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'hidden',
};

const panelHeader = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '18px 20px 12px',
  borderBottom: '1px solid var(--border)',
  flexShrink: 0,
};

const panelTitle = { fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 };
const closeBtn   = { background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer', padding: '2px 6px', borderRadius: 4 };
const cardList   = { flex: 1, overflowY: 'auto', padding: '8px 16px 24px' };

const cardStyle  = {
  display: 'flex', gap: 12, alignItems: 'flex-start',
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)', padding: '12px',
  marginBottom: 10, transition: 'border-color .15s',
};
const thumbWrap  = { flexShrink: 0, width: 70, height: 50, overflow: 'hidden', borderRadius: 'var(--r-sm)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const cardBody   = { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 };
const cardTop    = { display: 'flex', alignItems: 'flex-start', gap: 6 };
const descStyle  = { fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' };
const cardActions = { display: 'flex', gap: 4, marginTop: 4 };
const iconBtn    = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '3px 6px', borderRadius: 4, display: 'inline-flex' };
const badge      = { padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' };
