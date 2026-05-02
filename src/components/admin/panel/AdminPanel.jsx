import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminGestion }  from '../gestion/AdminGestion';
import { CRUDCircuitos } from '../circuitos/CRUDCircuitos';

const TABS = [
  { id: 'admins',    label: 'Gestión de Admins' },
  { id: 'circuitos', label: 'CRUD de Circuitos' },
];

/**
 * AdminPanel — Contenedor del panel de administrador (post-login)
 *
 * @param {{ admin: object, onLogout: () => void }} props
 */
export function AdminPanel({ admin, onLogout }) {
  const [tabActiva, setTabActiva] = useState('admins');
  const navigate = useNavigate();

  function handleLogout() {
    onLogout();
    navigate('/admin/login');
  }

  return (
    <div className="admin-shell">
      {/* Navbar */}
      <header className="admin-navbar">
        <div className="admin-navbar__brand">
          <span className="admin-navbar__logo">SimuCircuit</span>
          <span className="admin-navbar__sublabel">Panel de Administrador</span>
        </div>

        <div className="admin-navbar__right">
          <span className="admin-navbar__email">{admin?.correo}</span>
          <button className="admin-navbar__logout" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="admin-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`admin-tab ${tabActiva === tab.id ? 'admin-tab--active' : ''}`}
            onClick={() => setTabActiva(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <main className="admin-main">
        {tabActiva === 'admins'    && <AdminGestion adminActual={admin} />}
        {tabActiva === 'circuitos' && <CRUDCircuitos />}
      </main>
    </div>
  );
}
