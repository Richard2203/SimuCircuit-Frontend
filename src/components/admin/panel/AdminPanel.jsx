import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminGestion }  from '../gestion/AdminGestion';
import { CRUDCircuitos } from '../circuitos/CRUDCircuitos';
import { CatalogoComponentesProvider } from '../circuitos/CatalogoComponentesContext';

const TABS = [
  { id: 'admins',    label: 'Gestión de Admins' },
  { id: 'circuitos', label: 'CRUD de Circuitos' },
];

/**
 * AdminPanel — Contenedor del panel de administrador (post-login).
 *
 * Se envuelve con CatalogoComponentesProvider para que el catalogo
 * de componentes (BJTs, FETs, diodos, reguladores, categorias) se
 * cargue UNA sola vez desde
 *
 * @param {{ admin: { uid: string, email: string, nombre: string }, onLogout: () => void }} props
 */
export function AdminPanel({ admin, onLogout }) {
  const [tabActiva, setTabActiva] = useState('admins');
  const navigate = useNavigate();

  function handleLogout() {
    onLogout();
    navigate('/admin/login');
  }

  return (
    <CatalogoComponentesProvider>
      <div className="admin-shell">

        {/* Navbar */}
        <header className="admin-navbar">
          <div className="admin-navbar__brand">
            <span className="admin-navbar__logo">SimuCircuit</span>
            <span className="admin-navbar__sublabel">Panel de Administrador</span>
          </div>

          <div className="admin-navbar__right">
            {/* Mostrar nombre si existe, sino el email */}
            <span className="admin-navbar__email">
              {admin?.nombre ?? admin?.email}
            </span>
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
          {tabActiva === 'admins'    && <AdminGestion adminActual={admin} onLogout={handleLogout} />}
          {tabActiva === 'circuitos' && <CRUDCircuitos />}
        </main>

      </div>
    </CatalogoComponentesProvider>
  );
}