import { useState, useEffect } from 'react';
import { authService } from '../../../services/admin/authService';

const LOCKOUT_KEY     = 'admin_lockout';
const ATTEMPTS_KEY    = 'admin_attempts';
const MAX_ATTEMPTS    = 5;
const LOCKOUT_SECONDS = 5 * 60; // 5 minutos

function getLockoutInfo() {
  try {
    const raw = localStorage.getItem(LOCKOUT_KEY);
    if (!raw) return null;
    return JSON.parse(raw); // { until: timestamp }
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
 *
 * @param {{ onLogin: (admin: object) => void, onRecuperacion: () => void }} props
 */
export function AdminLogin({ onLogin, onRecuperacion }) {
  const [correo,    setCorrilla]  = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Comprobar bloqueo al montar y cada segundo
  useEffect(() => {
    const tick = () => {
      const info = getLockoutInfo();
      if (!info) { setCountdown(0); return; }
      const remaining = Math.max(0, Math.ceil((info.until - Date.now()) / 1000));
      if (remaining === 0) { clearLockout(); }
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
    } catch (err) {
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
    <div style={page}>
      <div style={card}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={logoStyle}>SimuCircuit</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Panel de Administrador</p>
        </div>

        {bloqueado && (
          <div style={alertBox}>
            <span style={{ fontSize: 13 }}>🔒 Cuenta bloqueada temporalmente.</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--danger)' }}>
              Intenta de nuevo en {fmtCountdown(countdown)}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelSt}>Correo electrónico</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorrilla(e.target.value)}
              disabled={bloqueado}
              required
              placeholder="admin@ejemplo.mx"
              style={inputSt}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={labelSt}>Contraseña</label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              disabled={bloqueado}
              required
              placeholder="••••••••"
              style={inputSt}
            />
          </div>

          {error && !bloqueado && (
            <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 12, textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={bloqueado || loading}
            style={{ ...btnSt, opacity: (bloqueado || loading) ? 0.5 : 1 }}
          >
            {loading ? 'Verificando…' : 'Iniciar sesión'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            type="button"
            onClick={onRecuperacion}
            style={linkBtn}
          >
            Olvidé mi contraseña
          </button>
        </div>
      </div>
    </div>
  );
}

const page    = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'var(--bg)' };
const card    = { width: '100%', maxWidth: 380, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '36px 32px' };
const logoStyle = { fontSize: 26, fontWeight: 700, background: 'linear-gradient(135deg,#a78bfa,#6c63ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 };
const labelSt = { display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 };
const inputSt = { width: '100%', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text)', fontSize: 13, outline: 'none' };
const btnSt   = { width: '100%', padding: '11px 0', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 600, cursor: 'pointer' };
const linkBtn = { background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' };
const alertBox = { background: 'rgba(248,113,113,0.1)', border: '1px solid var(--danger)', borderRadius: 'var(--r-md)', padding: '10px 14px', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' };
