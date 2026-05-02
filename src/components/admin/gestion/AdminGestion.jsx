import { useState, useEffect } from 'react';
import { adminsService }     from '../../../services/admin/adminsService';
import { InputContrasena }   from '../shared/InputContrasena';
import { ModalConfirmacion } from '../shared/ModalConfirmacion';

const MAX_ADMINS = 2;

/**
 * AdminGestion — Pestaña 1: gestion de administradores.
 * Tabla, formulario "nuevo admin" y cambio de contraseña propio.
 *
 * @param {{ adminActual: { id: number, correo: string } }} props
 */
export function AdminGestion({ adminActual }) {
  const [admins,  setAdmins]  = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalEditar,   setModalEditar]   = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);

  // Formulario nuevo admin
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [nuevaPwd,    setNuevaPwd]    = useState('');
  const [confirmPwd,  setConfirmPwd]  = useState('');
  const [errNuevo,    setErrNuevo]    = useState('');
  const [okNuevo,     setOkNuevo]     = useState('');

  // Cambio de contraseña propia
  const [pwdActual,  setPwdActual]  = useState('');
  const [pwdNueva,   setPwdNueva]   = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [errPwd,     setErrPwd]     = useState('');
  const [okPwd,      setOkPwd]      = useState('');

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    try {
      const data = await adminsService.obtenerAdmins();
      setAdmins(data);
    } finally { setLoading(false); }
  }

  /* ── Acciones ──────────────────────────────── */
  async function handleAgregar(e) {
    e.preventDefault();
    setErrNuevo(''); setOkNuevo('');
    if (nuevaPwd !== confirmPwd) { setErrNuevo('Las contraseñas no coinciden.'); return; }
    if (nuevaPwd.length < 8)     { setErrNuevo('La contraseña debe tener al menos 8 caracteres.'); return; }
    try {
      await adminsService.agregarAdmin({ correo: nuevoCorreo, contrasena: nuevaPwd });
      setNuevoCorreo(''); setNuevaPwd(''); setConfirmPwd('');
      setOkNuevo('Administrador agregado correctamente.');
      cargar();
    } catch { setErrNuevo('Error al agregar administrador.'); }
  }

  async function handleEditar(id, correo) {
    try {
      await adminsService.editarCorreoAdmin({ id, correo });
      setModalEditar(null);
      cargar();
    } catch { alert('Error al editar correo.'); }
  }

  async function handleEliminar(id) {
    try {
      await adminsService.eliminarAdmin({ id });
      setModalEliminar(null);
      cargar();
    } catch { alert('Error al eliminar administrador.'); }
  }

  async function handleCambiarPwd(e) {
    e.preventDefault();
    setErrPwd(''); setOkPwd('');
    if (pwdNueva !== pwdConfirm) { setErrPwd('Las contraseñas nuevas no coinciden.'); return; }
    if (pwdNueva.length < 8)     { setErrPwd('La nueva contraseña debe tener al menos 8 caracteres.'); return; }
    try {
      await adminsService.cambiarContrasena({
        id: adminActual.id, contrasena_actual: pwdActual, nueva_contrasena: pwdNueva,
      });
      setPwdActual(''); setPwdNueva(''); setPwdConfirm('');
      setOkPwd('Contraseña actualizada correctamente.');
    } catch { setErrPwd('Error al cambiar la contraseña.'); }
  }

  const limitAlcanzado = admins.length >= MAX_ADMINS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Tabla */}
      <section className="admin-section">
        <h3 className="admin-section__title">Administradores del sistema</h3>
        <p className="admin-section__subtitle">Máximo {MAX_ADMINS} administradores permitidos.</p>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Cargando…</p>
        ) : (
          <TablaAdmins
            admins={admins}
            adminActualId={adminActual.id}
            onEditar={(a) => setModalEditar(a)}
            onEliminar={(a) => setModalEliminar(a)}
          />
        )}
      </section>

      {/* Nuevo admin */}
      <section className="admin-section">
        <h3 className="admin-section__title">Agregar administrador</h3>

        {limitAlcanzado ? (
          <div className="admin-warn-box">
            <span>⚠️</span>
            <p>Ya existen {MAX_ADMINS} administradores. Elimina uno antes de agregar otro.</p>
          </div>
        ) : (
          <form onSubmit={handleAgregar} className="admin-form-grid">
            <div>
              <label className="admin-form-label">Correo</label>
              <input
                type="email" className="admin-input"
                value={nuevoCorreo} onChange={(e) => setNuevoCorreo(e.target.value)}
                required placeholder="nuevo@admin.mx"
              />
            </div>
            <InputContrasena label="Contraseña"            name="nueva_contrasena"     value={nuevaPwd}   onChange={setNuevaPwd}   mostrarFortaleza />
            <InputContrasena label="Confirmar contraseña"  name="confirmar_contrasena" value={confirmPwd} onChange={setConfirmPwd} />

            {errNuevo && <p className="admin-error-msg" style={{ gridColumn: '1/-1' }}>{errNuevo}</p>}
            {okNuevo  && <p className="admin-success-msg" style={{ gridColumn: '1/-1' }}>{okNuevo}</p>}
            <button type="submit" className="admin-btn admin-btn--primary" style={{ gridColumn: '1/-1', maxWidth: 200 }}>
              Agregar
            </button>
          </form>
        )}
      </section>

      {/* Cambiar pwd propia */}
      <section className="admin-section">
        <h3 className="admin-section__title">Cambiar mi contraseña</h3>
        <form onSubmit={handleCambiarPwd} style={{ maxWidth: 360 }}>
          <InputContrasena label="Contraseña actual"           name="contrasena_actual"     value={pwdActual}  onChange={setPwdActual} />
          <InputContrasena label="Nueva contraseña"            name="nueva_contrasena"      value={pwdNueva}   onChange={setPwdNueva}  mostrarFortaleza />
          <InputContrasena label="Confirmar nueva contraseña"  name="confirmar_nueva_contrasena" value={pwdConfirm} onChange={setPwdConfirm} />
          {errPwd && <p className="admin-error-msg" style={{ marginBottom: 8 }}>{errPwd}</p>}
          {okPwd  && <p className="admin-success-msg">{okPwd}</p>}
          <button type="submit" className="admin-btn admin-btn--primary">Cambiar contraseña</button>
        </form>
      </section>

      {modalEditar && (
        <ModalEditarAdmin
          admin={modalEditar}
          onGuardar={(correo) => handleEditar(modalEditar.id, correo)}
          onCerrar={() => setModalEditar(null)}
        />
      )}

      <ModalConfirmacion
        abierto={!!modalEliminar}
        titulo="Eliminar administrador"
        mensaje={`¿Eliminar a ${modalEliminar?.correo}? Esta acción no se puede deshacer.`}
        labelConfirmar="Eliminar"
        onConfirmar={() => handleEliminar(modalEliminar.id)}
        onCancelar={() => setModalEliminar(null)}
      />
    </div>
  );
}

/* ── Sub-componentes ─────────────────────────── */

function TablaAdmins({ admins, adminActualId, onEditar, onEliminar }) {
  if (admins.length === 0) {
    return <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No hay administradores registrados.</p>;
  }
  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Correo</th>
          <th className="admin-table__actions">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {admins.map((a) => (
          <tr key={a.id}>
            <td>
              {a.correo}
              {a.id === adminActualId && <span className="admin-table__badge">Tú</span>}
            </td>
            <td className="admin-table__actions">
              <button title="Editar correo" className="admin-icon-btn" onClick={() => onEditar(a)}><PencilIcon /></button>
              {a.id !== adminActualId && (
                <button title="Eliminar" className="admin-icon-btn admin-icon-btn--danger" onClick={() => onEliminar(a)}><TrashIcon /></button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ModalEditarAdmin({ admin, onGuardar, onCerrar }) {
  const [correo, setCorreo] = useState(admin.correo);
  return (
    <div className="admin-modal-overlay" onClick={onCerrar}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="admin-modal__title">Editar correo</h3>
        <label className="admin-form-label">Nuevo correo</label>
        <input type="email" className="admin-input" value={correo} onChange={(e) => setCorreo(e.target.value)} />
        <div className="admin-modal__btn-row" style={{ marginTop: 16 }}>
          <button className="admin-btn admin-btn--cancel"  onClick={onCerrar}>Cancelar</button>
          <button className="admin-btn admin-btn--primary" onClick={() => onGuardar(correo)}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6m4-6v6M9 6V4h6v2" />
    </svg>
  );
}
