import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useMediator }          from './hooks/useMediator';
import { Library }              from './components/Library/index';
import { Simulator }            from './components/Simulator/index';
import { AdminLogin }           from './components/admin/login/AdminLogin';
import { AdminRecuperacion }    from './components/admin/login/AdminRecuperacion';
import { AdminPanel }           from './components/admin/panel/AdminPanel';
import { authService }          from './services/admin/authService';
import { Footer }               from './components/Footer';

const SESSION_KEY = 'admin_session';

function getAdminSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setAdminSessionStorage(data) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

function clearAdminSession() {
  localStorage.removeItem(SESSION_KEY);
}

export default function App() {
  const [adminSession, setSession] = useState(getAdminSession);

  useEffect(() => {
    if (!adminSession) return;
    const token = localStorage.getItem('admin_auth_token');
    if (!token) {
      clearAdminSession();
      setSession(null);
      return;
    }
    const url_base = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}`;

    // Re-validar contra el backend
    fetch(`${url_base}/api/admin/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ idToken: token }),
    })
      .then((r) => { if (!r.ok) throw new Error('expired'); })
      .catch(() => {
        clearAdminSession();
        localStorage.removeItem('admin_auth_token');
        setSession(null);
      });
  }, []); // solo al montar

  function handleLogin(result) {
    const session = result?.admin ?? result;
    setAdminSessionStorage(session);
    setSession(session);
  }

  function handleLogout() {
    authService.logoutAdmin();
    clearAdminSession();
    setSession(null);
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/admin/login"
          element={
            <RedirectIfAuth session={adminSession}>
              <AdminLogin onLogin={handleLogin} />
            </RedirectIfAuth>
          }
        />
        <Route
          path="/admin/recuperacion"
          element={
            <RedirectIfAuth session={adminSession}>
              <AdminRecuperacion />
            </RedirectIfAuth>
          }
        />
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

/* Guard de autenticacion */

function RequireAuth({ session, children }) {
  if (!session) return <Navigate to="/admin/login" replace />;
  return children;
}

function RedirectIfAuth({ session, children }) {
  if (session) return <Navigate to="/admin/panel" replace />;
  return children;
}

/* Vista principal del simulador */

function MainSimulator() {
  const { state, dispatch, api } = useMediator();
  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1 }}>
        {state.selectedCircuit
          ? <Simulator state={state} dispatch={dispatch} api={api} />
          : <Library   state={state} dispatch={dispatch} api={api} />
        }
      </div>
      <Footer />
    </div>
  );
}