import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../../services/admin/authService';

const LOCKOUT_KEY     = 'admin_lockout';
const ATTEMPTS_KEY    = 'admin_attempts';
const MAX_ATTEMPTS    = 5;
const LOCKOUT_SECONDS = 5 * 60; // 5 minutos

function getLockoutInfo() {
  try {
    const raw = localStorage.getItem(LOCKOUT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function setLockout() {
  const until = Date.now() + LOCKOUT_SECONDS * 1000;
  localStorage.setItem(LOCKOUT_KEY, JSON.stringify({ until }));
  localStorage.setItem(ATTEMPTS_KEY, '0');
}
function clearLockout() {
  localStorage.removeItem(LOCKOUT_KEY);
  localStorage.removeItem(ATTEMPTS_KEY);
}
function getAttempts() {
  return parseInt(localStorage.getItem(ATTEMPTS_KEY) ?? '0', 10);
}
function incrementAttempts() {
  const next = getAttempts() + 1;
  localStorage.setItem(ATTEMPTS_KEY, String(next));
  return next;
}

/**
 * AdminLogin — Pagina de inicio de sesion del administrador.
 * Ruta: /admin/login
 *
 * @param {{ onLogin: (admin: object) => void }} props
 */
export function AdminLogin({ onLogin }) {
  const [correo,     setCorreo]    = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error,      setError]     = useState('');
  const [loading,    setLoading]   = useState(false);
  const [countdown,  setCountdown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const tick = () => {
      const info = getLockoutInfo();
      if (!info) { setCountdown(0); return; }
      const remaining = Math.max(0, Math.ceil((info.until - Date.now()) / 1000));
      if (remaining === 0) clearLockout();
      setCountdown(remaining);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const bloqueado = countdown > 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (bloqueado || loading) return;
    setError('');
    setLoading(true);
    try {
      const result = await authService.loginAdmin({ correo, contrasena });
      clearLockout();
      onLogin(result);
      navigate('/admin/panel');
    } catch {
      const intentos = incrementAttempts();
      if (intentos >= MAX_ATTEMPTS) {
        setLockout();
        setError(`Demasiados intentos fallidos. Espera ${LOCKOUT_SECONDS / 60} minutos.`);
      } else {
        setError(`Credenciales incorrectas. Intento ${intentos} de ${MAX_ATTEMPTS}.`);
      }
    } finally {
      setLoading(false);
    }
  }

  const fmtCountdown = (s) => {
    const m = Math.floor(s / 60);
    const ss = String(s % 60).padStart(2, '0');
    return `${m}:${ss}`;
  };

  return (
    <div className="admin-auth-page">
      <div className="admin-auth-card">
        <div className="admin-auth-card__logo">
          <h1 className="admin-auth-card__title">SimuCircuit</h1>
          <p className="admin-auth-card__subtitle">Panel de Administrador</p>
        </div>

        {bloqueado && (
          <div className="admin-auth-alert">
            <span>🔒 Cuenta bloqueada temporalmente.</span>
            <span className="admin-auth-alert__counter">
              Intenta de nuevo en {fmtCountdown(countdown)}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label className="admin-form-label">Correo electrónico</label>
            <input
              type="email" className="admin-input"
              value={correo} onChange={(e) => setCorreo(e.target.value)}
              disabled={bloqueado} required placeholder="admin@ejemplo.mx"
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label className="admin-form-label">Contraseña</label>
            <input
              type="password" className="admin-input"
              value={contrasena} onChange={(e) => setContrasena(e.target.value)}
              disabled={bloqueado} required placeholder="••••••••"
            />
          </div>

          {error && !bloqueado && (
            <p className="admin-error-msg" style={{ textAlign: 'center', marginBottom: 12 }}>{error}</p>
          )}

          <button
            type="submit"
            className="admin-btn admin-btn--primary admin-btn--block"
            disabled={bloqueado || loading}
          >
            {loading ? 'Verificando…' : 'Iniciar sesión'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/admin/recuperacion" className="admin-auth-link">
            Olvidé mi contraseña
          </Link>
        </div>
      </div>
    </div>
  );
}
