import { useEffect } from 'react';

/**
 * ModalConfirmacion — Modal generico reutilizable.
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
  useEffect(() => {
    if (!abierto) return;
    const handler = (e) => { if (e.key === 'Escape') onCancelar(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [abierto, onCancelar]);

  if (!abierto) return null;

  return (
    <div className="admin-modal-overlay" onClick={onCancelar} role="dialog" aria-modal="true">
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="admin-modal__title">{titulo}</h3>
        {mensaje && <p className="admin-modal__msg">{mensaje}</p>}
        <div className="admin-modal__btn-row">
          <button className="admin-btn admin-btn--cancel" onClick={onCancelar}>
            {labelCancelar}
          </button>
          <button
            className={`admin-btn ${peligro ? 'admin-btn--danger' : 'admin-btn--primary'}`}
            onClick={onConfirmar}
          >
            {labelConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
