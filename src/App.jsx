import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useMediator }          from './hooks/useMediator';
import { Library }              from './components/Library/index';
import { Simulator }            from './components/Simulator/index';
import { AdminLogin }           from './components/admin/login/AdminLogin';
import { AdminRecuperacion }    from './components/admin/login/AdminRecuperacion';
import { AdminPanel }           from './components/admin/panel/AdminPanel';
import { authService }          from './services/admin/authService';

/* ── Sesion del administrador (persistida en sessionStorage) ── */

const SESSION_KEY = 'admin_session';

function getAdminSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function setAdminSessionStorage(data) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}
function clearAdminSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

/* ── App principal ──────────────────────────────────────────── */

/**
 * App — Raiz de la aplicacion.
 *
 * Routing con react-router-dom:
 *   /admin/login         → AdminLogin
 *   /admin/recuperacion  → AdminRecuperacion
 *   /admin/panel         → AdminPanel (requiere sesión, sino → /admin/login)
 *   /*                   → Simulador / Biblioteca (flujo principal)
 *
 */
export default function App() {
  const [adminSession, setSession] = useState(getAdminSession);

  function handleLogin(result) {
    const session = result?.admin ?? result;
    setAdminSessionStorage(session);
    setSession(session);
  }

  function handleLogout() {
    authService.logoutAdmin();   // limpia el token JWT del localStorage
    clearAdminSession();
    setSession(null);
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login"        element={<AdminLogin onLogin={handleLogin} />} />
        <Route path="/admin/recuperacion" element={<AdminRecuperacion />} />
        <Route
          path="/admin/panel"
          element={
            <RequireAuth session={adminSession}>
              <AdminPanel admin={adminSession} onLogout={handleLogout} />
            </RequireAuth>
          }
        />
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="*"      element={<MainSimulator />} />
      </Routes>
    </BrowserRouter>
  );
}

/* ── Guard de autenticacion ─────────────────────────────────── */

function RequireAuth({ session, children }) {
  if (!session) return <Navigate to="/admin/login" replace />;
  return children;
}

/* ── Vista principal del simulador ──────────────────────────── */

function MainSimulator() {
  const { state, dispatch, api } = useMediator();
  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d' }}>
      {state.selectedCircuit
        ? <Simulator state={state} dispatch={dispatch} api={api} />
        : <Library   state={state} dispatch={dispatch} api={api} />
      }
    </div>
  );
}
