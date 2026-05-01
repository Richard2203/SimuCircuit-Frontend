import { useEffect } from 'react';

/**
 * ModalConfirmacion — Modal generico reutilizable para acciones destructivas.
 * Siempre pide confirmacion explicita antes de ejecutar la accion.
 *
 * @param {{
 *   abierto: boolean,
 *   titulo: string,
 *   mensaje: string,
 *   labelConfirmar?: string,
 *   labelCancelar?: string,
 *   peligro?: boolean,
 *   onConfirmar: () => void,
 *   onCancelar: () => void,
 * }} props
 */
export function ModalConfirmacion({
  abierto,
  titulo = '¿Confirmar acción?',
  mensaje,
  labelConfirmar = 'Confirmar',
  labelCancelar = 'Cancelar',
  peligro = true,
  onConfirmar,
  onCancelar,
}) {
  // Cerrar con Escape
  useEffect(() => {
    if (!abierto) return;
    const handler = (e) => { if (e.key === 'Escape') onCancelar(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [abierto, onCancelar]);

  if (!abierto) return null;

  return (
    <div style={overlay} onClick={onCancelar} role="dialog" aria-modal="true">
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={titleStyle}>{titulo}</h3>
        {mensaje && <p style={msgStyle}>{mensaje}</p>}
        <div style={btnRow}>
          <button style={btnCancel} onClick={onCancelar}>{labelCancelar}</button>
          <button
            style={peligro ? btnDanger : btnPrimary}
            onClick={onConfirmar}
          >
            {labelConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay = {
  position: 'fixed', inset: 0, zIndex: 500,
  background: 'rgba(13,13,13,0.8)',
  backdropFilter: 'blur(3px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 16,
};
const modal = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-lg)',
  padding: '28px 24px',
  maxWidth: 420, width: '100%',
};
const titleStyle = { fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 10 };
const msgStyle   = { fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 };
const btnRow     = { display: 'flex', justifyContent: 'flex-end', gap: 8 };
const btnBase    = { padding: '8px 18px', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none' };
const btnCancel  = { ...btnBase, background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' };
const btnDanger  = { ...btnBase, background: 'var(--danger)', color: '#fff' };
const btnPrimary = { ...btnBase, background: 'var(--accent)', color: '#fff' };
