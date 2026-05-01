import { useState } from 'react';
import { AdminGestion } from '../gestion/AdminGestion';
import { CRUDCircuitos } from '../circuitos/CRUDCircuitos';

const TABS = [
  { id: 'admins',    label: 'Gestión de Admins' },
  { id: 'circuitos', label: 'CRUD de Circuitos' },
];

/**
 * AdminPanel — Contenedor principal del panel de administrador.
 *
 * @param {{
 *   admin: { id: number, correo: string },
 *   onLogout: () => void,
 * }} props
 */
export function AdminPanel({ admin, onLogout }) {
  const [tabActiva, setTabActiva] = useState('admins');

  return (
    <div style={appShell}>
      {/* ── Navbar superior ── */}
      <header style={navbar}>
        <div style={navBrand}>
          <span style={logo}>SimuCircuit</span>
          <span style={panelLabel}>Panel de Administrador</span>
        </div>

        <div style={navRight}>
          <span style={adminEmail}>{admin?.correo}</span>
          <button onClick={onLogout} style={logoutBtn}>
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* ── Pestañas ── */}
      <div style={tabBar}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTabActiva(tab.id)}
            style={{
              ...tabBtn,
              color:       tabActiva === tab.id ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: tabActiva === tab.id
                ? '2px solid var(--accent)'
                : '2px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Contenido de pestaña ── */}
      <main style={mainContent}>
        {tabActiva === 'admins' && (
          <AdminGestion adminActual={admin} />
        )}
        {tabActiva === 'circuitos' && (
          <CRUDCircuitos />
        )}
      </main>
    </div>
  );
}

/* ── Estilos ───────────────────────────────────────────────
   Responsive:
   > 1000px  → navbar horizontal completo
   768-1000  → misma estructura, logo más pequeño
   < 768     → email oculto, solo boton logout
   < 480     → tabs con texto corto
*/
const appShell = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--bg)',
  color: 'var(--text)',
};

const navbar = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 24px',
  height: 56,
  background: 'var(--surface)',
  borderBottom: '1px solid var(--border)',
  flexShrink: 0,
  flexWrap: 'wrap',
  gap: 8,
};

const navBrand = { display: 'flex', alignItems: 'center', gap: 12 };

const logo = {
  fontSize: 18,
  fontWeight: 700,
  background: 'linear-gradient(135deg, #a78bfa 0%, #6c63ff 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

const panelLabel = {
  fontSize: 12,
  color: 'var(--text-muted)',
  borderLeft: '1px solid var(--border)',
  paddingLeft: 12,
};

const navRight = { display: 'flex', alignItems: 'center', gap: 14 };

const adminEmail = {
  fontSize: 12,
  color: 'var(--text-muted)',
  maxWidth: 200,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const logoutBtn = {
  padding: '6px 14px',
  background: 'transparent',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  color: 'var(--text-muted)',
  fontSize: 12,
  cursor: 'pointer',
  transition: 'border-color .15s, color .15s',
};

const tabBar = {
  display: 'flex',
  gap: 0,
  borderBottom: '1px solid var(--border)',
  background: 'var(--bg-elevated)',
  padding: '0 20px',
  flexShrink: 0,
};

const tabBtn = {
  background: 'none',
  border: 'none',
  padding: '14px 18px',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'color .15s, border-color .15s',
  whiteSpace: 'nowrap',
};

const mainContent = {
  flex: 1,
  padding: '20px 24px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
};
