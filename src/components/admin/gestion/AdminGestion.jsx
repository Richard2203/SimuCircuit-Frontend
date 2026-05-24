import { useState, useEffect } from 'react';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { adminsService }     from '../../../services/admin/adminsService';
import { InputContrasena }   from '../shared/InputContrasena';
import { ModalConfirmacion } from '../shared/ModalConfirmacion';

const MAX_ADMINS = 2;

/**
 * AdminGestion
 *
 * @param {{ adminActual: { uid: string, email: string, nombre: string } }} props
 */
export function AdminGestion({ adminActual, onLogout }) {
  const [admins,  setAdmins]  = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalEditar,   setModalEditar]   = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);

  // Formulario nuevo admin
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaPwd,    setNuevaPwd]    = useState('');
  const [confirmPwd,  setConfirmPwd]  = useState('');
  const [errNuevo,    setErrNuevo]    = useState('');
  const [okNuevo,     setOkNuevo]     = useState('');
  const [loadingNuevo, setLoadingNuevo] = useState(false);

  // Cambio de contrasena propia
  const [pwdActual,  setPwdActual]  = useState('');
  const [pwdNueva,   setPwdNueva]   = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [errPwd,     setErrPwd]     = useState('');
  const [okPwd,      setOkPwd]      = useState('');
  const [loadingPwd, setLoadingPwd] = useState(false);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    try {
      const data = await adminsService.obtenerAdmins();
      setAdmins(data);
    } catch {
      // Si falla, dejamos la lista vacia
    } finally {
      setLoading(false);
    }
  }

  /* Agregar admin */
  async function handleAgregar(e) {
    e.preventDefault();
    setErrNuevo(''); setOkNuevo('');

    if (nuevaPwd !== confirmPwd) { setErrNuevo('Las contraseñas no coinciden.'); return; }
    if (nuevaPwd.length < 8)     { setErrNuevo('La contraseña debe tener al menos 8 caracteres.'); return; }

    setLoadingNuevo(true);
    try {
      await adminsService.agregarAdmin({
        correo:    nuevoCorreo,
        contrasena: nuevaPwd,
        nombre:    nuevoNombre,
      });
      setNuevoCorreo(''); setNuevoNombre(''); setNuevaPwd(''); setConfirmPwd('');
      setOkNuevo('Administrador agregado correctamente.');
      cargar();
    } catch (err) {
      setErrNuevo(err.message || 'Error al agregar administrador.');
    } finally {
      setLoadingNuevo(false);
    }
  }

  /* Editar admin */
  async function handleEditar(uid, correo, nombre) {
    try {
      await adminsService.editarAdmin({ uid, correo, nombre });
      setModalEditar(null);
      cargar();
    } catch (err) {
      alert(err.message || 'Error al editar administrador.');
    }
  }

  /* Eliminar admin */
  async function handleEliminar(uid) {
    try {
      await adminsService.eliminarAdmin({ uid });
      setModalEliminar(null);
      cargar();
    } catch (err) {
      alert(err.message || 'Error al eliminar administrador.');
    }
  }

  /* Cambiar contrasena propia */
  async function handleCambiarPwd(e) {
    e.preventDefault();
    setErrPwd(''); setOkPwd('');

    if (pwdNueva !== pwdConfirm) { setErrPwd('Las contraseñas nuevas no coinciden.'); return; }
    if (pwdNueva.length < 8)     { setErrPwd('La nueva contraseña debe tener al menos 8 caracteres.'); return; }

    setLoadingPwd(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setErrPwd('No hay sesión activa. Vuelve a iniciar sesión.');
        return;
      }

      // Reautenticar antes de cambiar contrasena
      const credential = EmailAuthProvider.credential(user.email, pwdActual);
      await reauthenticateWithCredential(user, credential);

      // Cambiar la contrasena
      await updatePassword(user, pwdNueva);

      setPwdActual(''); setPwdNueva(''); setPwdConfirm('');
      setOkPwd('Contraseña actualizada. Cerrando sesión…');
      setTimeout(() => onLogout(), 2000);
    } catch (err) {
      const mensajes = {
        'auth/wrong-password':         'La contraseña actual es incorrecta.',
        'auth/invalid-credential':     'La contraseña actual es incorrecta.',
        'auth/weak-password':          'La nueva contraseña es demasiado débil.',
        'auth/requires-recent-login':  'Sesión expirada. Vuelve a iniciar sesión.',
        'auth/too-many-requests':      'Demasiados intentos. Intenta más tarde.',
      };
      setErrPwd(mensajes[err.code] || err.message || 'Error al cambiar la contraseña.');
    } finally {
      setLoadingPwd(false);
    }
  }

  const limitAlcanzado = admins.length >= MAX_ADMINS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Tabla de admins */}
      <section className="admin-section">
        <h3 className="admin-section__title">Administradores del sistema</h3>
        <p className="admin-section__subtitle">Máximo {MAX_ADMINS} administradores permitidos.</p>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Cargando…</p>
        ) : (
          <TablaAdmins
            admins={admins}
            adminActualUid={adminActual?.uid}
            onEditar={(a) => setModalEditar(a)}
            onEliminar={(a) => setModalEliminar(a)}
          />
        )}
      </section>

      {/* Agregar admin */}
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
              <label className="admin-form-label">Nombre</label>
              <input
                type="text" className="admin-input"
                value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)}
                required placeholder="Nombre completo"
              />
            </div>
            <div>
              <label className="admin-form-label">Correo</label>
              <input
                type="email" className="admin-input"
                value={nuevoCorreo} onChange={(e) => setNuevoCorreo(e.target.value)}
                required placeholder="nuevo@admin.mx"
              />
            </div>
            <InputContrasena label="Contraseña"           name="nueva_contrasena"     value={nuevaPwd}   onChange={setNuevaPwd}   mostrarFortaleza />
            <InputContrasena label="Confirmar contraseña" name="confirmar_contrasena" value={confirmPwd} onChange={setConfirmPwd} />

            {errNuevo && <p className="admin-error-msg"  style={{ gridColumn: '1/-1' }}>{errNuevo}</p>}
            {okNuevo  && <p className="admin-success-msg" style={{ gridColumn: '1/-1' }}>{okNuevo}</p>}

            <button
              type="submit"
              className="admin-btn admin-btn--primary"
              style={{ gridColumn: '1/-1', maxWidth: 200 }}
              disabled={loadingNuevo}
            >
              {loadingNuevo ? 'Agregando…' : 'Agregar'}
            </button>
          </form>
        )}
      </section>

      {/* Cambiar contraseña propia */}
      <section className="admin-section">
        <h3 className="admin-section__title">Cambiar mi contraseña</h3>
        <form onSubmit={handleCambiarPwd} style={{ maxWidth: 360 }}>
          <InputContrasena label="Contraseña actual"          name="contrasena_actual"          value={pwdActual}  onChange={setPwdActual} />
          <InputContrasena label="Nueva contraseña"           name="nueva_contrasena"           value={pwdNueva}   onChange={setPwdNueva}  mostrarFortaleza />
          <InputContrasena label="Confirmar nueva contraseña" name="confirmar_nueva_contrasena" value={pwdConfirm} onChange={setPwdConfirm} />

          {errPwd && <p className="admin-error-msg"  style={{ marginBottom: 8 }}>{errPwd}</p>}
          {okPwd  && <p className="admin-success-msg">{okPwd}</p>}

          <button
            type="submit"
            className="admin-btn admin-btn--primary"
            disabled={loadingPwd}
          >
            {loadingPwd ? 'Actualizando…' : 'Cambiar contraseña'}
          </button>
        </form>
      </section>

      {/* Modales*/}
      {modalEditar && (
        <ModalEditarAdmin
          admin={modalEditar}
          onGuardar={(correo, nombre) => handleEditar(modalEditar.uid, correo, nombre)}
          onCerrar={() => setModalEditar(null)}
        />
      )}

      <ModalConfirmacion
        abierto={!!modalEliminar}
        titulo="Eliminar administrador"
        mensaje={`¿Eliminar a ${modalEliminar?.email}? Esta acción no se puede deshacer.`}
        labelConfirmar="Eliminar"
        onConfirmar={() => handleEliminar(modalEliminar.uid)}
        onCancelar={() => setModalEliminar(null)}
      />
    </div>
  );
}

/* Sub-componentes */

function TablaAdmins({ admins, adminActualUid, onEditar, onEliminar }) {
  if (admins.length === 0) {
    return <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No hay administradores registrados.</p>;
  }
  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Correo</th>
          <th className="admin-table__actions">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {admins.map((a) => (
          <tr key={a.uid}>
            <td>{a.nombre ?? '—'}</td>
            <td>
              {a.email}
              {a.uid === adminActualUid && <span className="admin-table__badge">Tú</span>}
            </td>
            <td className="admin-table__actions">
              <button title="Editar" className="admin-icon-btn" onClick={() => onEditar(a)}>
                <PencilIcon />
              </button>
              {/* Cualquier admin puede eliminar a otro, pero no a sí mismo */}
              {a.uid !== adminActualUid && (
                <button title="Eliminar" className="admin-icon-btn admin-icon-btn--danger" onClick={() => onEliminar(a)}>
                  <TrashIcon />
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Modal para editar email y nombre de un admin.
 * Permite editar uno o ambos campos.
 */
function ModalEditarAdmin({ admin, onGuardar, onCerrar }) {
  const [correo, setCorreo] = useState(admin.email);
  const [nombre, setNombre] = useState(admin.nombre ?? '');

  return (
    <div className="admin-modal-overlay" onClick={onCerrar}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="admin-modal__title">Editar administrador</h3>

        <label className="admin-form-label">Nombre</label>
        <input
          type="text" className="admin-input"
          value={nombre} onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre completo"
          style={{ marginBottom: 12 }}
        />

        <label className="admin-form-label">Correo</label>
        <input
          type="email" className="admin-input"
          value={correo} onChange={(e) => setCorreo(e.target.value)}
        />

        <div className="admin-modal__btn-row" style={{ marginTop: 16 }}>
          <button className="admin-btn admin-btn--cancel"  onClick={onCerrar}>Cancelar</button>
          <button className="admin-btn admin-btn--primary" onClick={() => onGuardar(correo, nombre)}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

/* Iconos */

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