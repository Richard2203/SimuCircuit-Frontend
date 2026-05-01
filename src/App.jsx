import { useState, useEffect } from 'react';
import { useMediator }  from './hooks/useMediator';
import { Library }      from './components/Library/index';
import { Simulator }    from './components/Simulator/index';
import { AdminLogin }      from './components/admin/login/AdminLogin';
import { AdminRecuperacion } from './components/admin/login/AdminRecuperacion';
import { AdminPanel }   from './components/admin/panel/AdminPanel';

/**
 * Enrutador hash-based para el panel de administrador.
 * Rutas reconocidas:
 *   #/admin/login       → AdminLogin
 *   #/admin/recuperacion → AdminRecuperacion
 *   #/admin/panel       → AdminPanel  (requiere sesión)
 *   (cualquier otra)    → flujo normal del simulador
 */
function getHashRoute() {
  const hash = window.location.hash;
  if (hash.startsWith('#/admin/recuperacion')) return 'admin-recuperacion';
  if (hash.startsWith('#/admin/panel'))        return 'admin-panel';
  if (hash.startsWith('#/admin'))              return 'admin-login';
  return 'app';
}

function getAdminSession() {
  try {
    const raw = sessionStorage.getItem('admin_session');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setAdminSession(data) {
  sessionStorage.setItem('admin_session', JSON.stringify(data));
}

function clearAdminSession() {
  sessionStorage.removeItem('admin_session');
}

/**
 * App — Raiz de la aplicacion.
 * Usa useMediator para conectar con el Mediator (patron Mediator)
 * y el EventBus (patron Observer). Toda la logica de estado y API
 * fluye a traves del Mediator; los componentes solo reciben state,
 * dispatch y api.
 *
 * Extiende el enrutamiento con soporte de rutas /admin/* sin
 * modificar ningún componente existente del simulador.
 */
export default function App() {
  const { state, dispatch, api } = useMediator();
  const [route,       setRoute]   = useState(getHashRoute);
  const [adminSession, setSession] = useState(getAdminSession);

  // Escuchar cambios de hash para navegacion
  useEffect(() => {
    const onHash = () => setRoute(getHashRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // ── Helpers de navegacion ──────────────────────────
  function goTo(hash) {
    window.location.hash = hash;
  }

  function handleLogin(result) {
    const session = result.admin ?? result;
    setAdminSession(session);
    setSession(session);
    goTo('#/admin/panel');
  }

  function handleLogout() {
    clearAdminSession();
    setSession(null);
    goTo('#/admin/login');
  }

  // ── Rutas del panel admin ─────────────────────────
  if (route === 'admin-login') {
    return (
      <AdminLogin
        onLogin={handleLogin}
        onRecuperacion={() => goTo('#/admin/recuperacion')}
      />
    );
  }

  if (route === 'admin-recuperacion') {
    return (
      <AdminRecuperacion
        onVolver={() => goTo('#/admin/login')}
      />
    );
  }

  if (route === 'admin-panel') {
    // Redirigir a login si no hay sesion
    if (!adminSession) {
      goTo('#/admin/login');
      return null;
    }
    return (
      <AdminPanel
        admin={adminSession}
        onLogout={handleLogout}
      />
    );
  }

  // ── Ruta principal: simulador/biblioteca (sin cambios) ──
  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d' }}>
      {state.selectedCircuit
        ? <Simulator state={state} dispatch={dispatch} api={api} />
        : <Library   state={state} dispatch={dispatch} api={api} />
      }
    </div>
  );
}