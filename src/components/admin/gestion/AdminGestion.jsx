import { useState, useEffect } from 'react';
import { adminsService } from '../../../services/admin/adminsService';
import { InputContrasena } from '../shared/InputContrasena';
import { ModalConfirmacion } from '../shared/ModalConfirmacion';

const MAX_ADMINS = 2;

/**
 * AdminGestion — Pestania 1 del panel: gestion de administradores.
 * Contiene: tabla, formulario de nuevo admin, cambio de contraseña propio.
 *
 * @param {{ adminActual: { id: number, correo: string } }} props
 */
export function AdminGestion({ adminActual }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados modales
  const [modalEditar, setModalEditar]   = useState(null); // admin a editar
  const [modalEliminar, setModalEliminar] = useState(null); // admin a eliminar

  // Formulario nuevo admin
  const [nuevoCorreo, setNuevoCorreo]       = useState('');
  const [nuevaPwd,    setNuevaPwd]          = useState('');
  const [confirmPwd,  setConfirmPwd]        = useState('');
  const [errNuevo,    setErrNuevo]          = useState('');
  const [okNuevo,     setOkNuevo]           = useState('');

  // Cambio de contraseña propia
  const [pwdActual,     setPwdActual]     = useState('');
  const [pwdNueva,      setPwdNueva]      = useState('');
  const [pwdConfirm,    setPwdConfirm]    = useState('');
  const [errPwd,        setErrPwd]        = useState('');
  const [okPwd,         setOkPwd]         = useState('');

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    try {
      const data = await adminsService.obtenerAdmins();
      setAdmins(data);
    } finally {
      setLoading(false);
    }
  }

  /* ── Acciones ──────────────────────────────── */
  async function handleAgregar(e) {
    e.preventDefault();
    setErrNuevo(''); setOkNuevo('');
    if (nuevaPwd !== confirmPwd) { setErrNuevo('Las contraseñas no coinciden.'); return; }
    if (nuevaPwd.length < 8) { setErrNuevo('La contraseña debe tener al menos 8 caracteres.'); return; }
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
    if (pwdNueva.length < 8) { setErrPwd('La nueva contraseña debe tener al menos 8 caracteres.'); return; }
    try {
      await adminsService.cambiarContrasena({ id: adminActual.id, contrasena_actual: pwdActual, nueva_contrasena: pwdNueva });
      setPwdActual(''); setPwdNueva(''); setPwdConfirm('');
      setOkPwd('Contraseña actualizada correctamente.');
    } catch { setErrPwd('Error al cambiar la contraseña.'); }
  }

  const limitAlcanzado = admins.length >= MAX_ADMINS;

  return (
    <div style={container}>
      {/* ── Tabla de admins ── */}
      <section style={section}>
        <h3 style={sectionTitle}>Administradores del sistema</h3>
        <p style={sectionSub}>Máximo {MAX_ADMINS} administradores permitidos.</p>

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

      {/* ── Formulario nuevo admin ── */}
      <section style={section}>
        <h3 style={sectionTitle}>Agregar administrador</h3>

        {limitAlcanzado ? (
          <div style={warnBox}>
            <span style={{ fontSize: 14 }}>⚠️</span>
            <p style={{ fontSize: 13, color: 'var(--warning)' }}>
              Ya existen {MAX_ADMINS} administradores. Elimina uno antes de agregar otro.
            </p>
          </div>
        ) : (
          <form onSubmit={handleAgregar} style={formGrid}>
            <div>
              <label style={labelSt}>Correo</label>
              <input type="email" value={nuevoCorreo} onChange={(e) => setNuevoCorreo(e.target.value)} required style={inputSt} placeholder="nuevo@admin.mx" />
            </div>
            <div>
              <InputContrasena label="Contraseña" name="nueva_contrasena" value={nuevaPwd} onChange={setNuevaPwd} mostrarFortaleza />
            </div>
            <div>
              <InputContrasena label="Confirmar contraseña" name="confirmar_contrasena" value={confirmPwd} onChange={setConfirmPwd} />
            </div>
            {errNuevo && <p style={{ gridColumn: '1/-1', fontSize: 12, color: 'var(--danger)' }}>{errNuevo}</p>}
            {okNuevo  && <p style={{ gridColumn: '1/-1', fontSize: 12, color: 'var(--success)' }}>{okNuevo}</p>}
            <button type="submit" style={{ ...btnPrimary, gridColumn: '1/-1', maxWidth: 200 }}>Agregar</button>
          </form>
        )}
      </section>

      {/* ── Cambiar propia contraseña ── */}
      <section style={section}>
        <h3 style={sectionTitle}>Cambiar mi contraseña</h3>
        <form onSubmit={handleCambiarPwd} style={{ maxWidth: 360 }}>
          <InputContrasena label="Contraseña actual" name="contrasena_actual" value={pwdActual} onChange={setPwdActual} />
          <InputContrasena label="Nueva contraseña" name="nueva_contrasena" value={pwdNueva} onChange={setPwdNueva} mostrarFortaleza />
          <InputContrasena label="Confirmar nueva contraseña" name="confirmar_nueva_contrasena" value={pwdConfirm} onChange={setPwdConfirm} />
          {errPwd && <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 8 }}>{errPwd}</p>}
          {okPwd  && <p style={{ fontSize: 12, color: 'var(--success)', marginBottom: 8 }}>{okPwd}</p>}
          <button type="submit" style={btnPrimary}>Cambiar contraseña</button>
        </form>
      </section>

      {/* ── Modales ── */}
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

/* ── TablaAdmins ───────────────────────────────── */
function TablaAdmins({ admins, adminActualId, onEditar, onEliminar }) {
  if (admins.length === 0) return <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No hay administradores registrados.</p>;
  return (
    <table style={table}>
      <thead>
        <tr>
          <th style={th}>Correo</th>
          <th style={{ ...th, width: 80, textAlign: 'right' }}>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {admins.map((a) => (
          <tr key={a.id} style={tr}>
            <td style={td}>
              {a.correo}
              {a.id === adminActualId && (
                <span style={badge}>Tú</span>
              )}
            </td>
            <td style={{ ...td, textAlign: 'right' }}>
              <button title="Editar correo" onClick={() => onEditar(a)} style={iconBtn}><PencilIcon /></button>
              {a.id !== adminActualId && (
                <button title="Eliminar" onClick={() => onEliminar(a)} style={{ ...iconBtn, color: 'var(--danger)' }}><TrashIcon /></button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── ModalEditarAdmin ──────────────────────────── */
function ModalEditarAdmin({ admin, onGuardar, onCerrar }) {
  const [correo, setCorreo] = useState(admin.correo);
  return (
    <div style={overlay} onClick={onCerrar}>
      <div style={modalBox} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Editar correo</h3>
        <label style={labelSt}>Nuevo correo</label>
        <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} style={inputSt} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button onClick={onCerrar} style={btnCancel}>Cancelar</button>
          <button onClick={() => onGuardar(correo)} style={btnPrimary}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

/* ── Iconos ────────────────────────────────────── */
function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6m4-6v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  );
}

/* ── Estilos ───────────────────────────────────── */
const container    = { display: 'flex', flexDirection: 'column', gap: 28 };
const section      = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '22px 24px' };
const sectionTitle = { fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 };
const sectionSub   = { fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 };
const warnBox      = { display: 'flex', gap: 10, alignItems: 'flex-start', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 'var(--r-md)', padding: '12px 14px' };
const formGrid     = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, alignItems: 'start' };
const table        = { width: '100%', borderCollapse: 'collapse' };
const th           = { textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', padding: '6px 10px', borderBottom: '1px solid var(--border)', fontWeight: 600, textTransform: 'uppercase' };
const tr           = { borderBottom: '1px solid var(--border)' };
const td           = { padding: '10px 10px', fontSize: 13, color: 'var(--text)', verticalAlign: 'middle' };
const badge        = { marginLeft: 8, fontSize: 10, background: 'var(--accent)', color: '#fff', borderRadius: 10, padding: '1px 6px', fontWeight: 600 };
const iconBtn      = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '3px 5px', borderRadius: 4, display: 'inline-flex' };
const labelSt      = { display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 };
const inputSt      = { width: '100%', padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text)', fontSize: 13, outline: 'none' };
const btnPrimary   = { padding: '9px 18px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const btnCancel    = { padding: '9px 18px', background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 13, cursor: 'pointer' };
const overlay      = { position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(13,13,13,0.8)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 };
const modalBox     = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '24px', maxWidth: 380, width: '100%' };
