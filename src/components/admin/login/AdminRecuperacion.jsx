import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../../services/admin/authService';

/**
 * AdminRecuperacion — Formulario de recuperacion de contraseña.
 * Ruta: /admin/recuperacion
 */
export function AdminRecuperacion() {
  const [correo,  setCorreo]  = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.solicitarRecuperacion({ correo });
      setEnviado(true);
    } catch {
      setError('Ocurrió un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-auth-page">
      <div className="admin-auth-card">
        <Link to="/admin/login" className="admin-auth-back-btn">
          ← Volver al login
        </Link>

        <div className="admin-auth-card__heading-wrap">
          <h2 className="admin-auth-card__heading">Recuperar contraseña</h2>
          <p className="admin-auth-card__subtitle">
            Ingresa tu correo y recibirás un enlace de restablecimiento.
          </p>
        </div>

        {enviado ? (
          <div className="admin-auth-success-box">
            <span style={{ fontSize: 22 }}>✉️</span>
            <p style={{ fontSize: 14, color: 'var(--success)', fontWeight: 600 }}>¡Listo!</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
              Si el correo <strong style={{ color: 'var(--text)' }}>{correo}</strong> está registrado,
              recibirás un enlace para restablecer tu contraseña.
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 6 }}>
              El enlace expira en 30 minutos. Revisa también tu carpeta de spam.
            </p>
            <Link to="/admin/login" className="admin-btn admin-btn--primary admin-btn--block" style={{ textAlign: 'center', textDecoration: 'none' }}>
              Volver al login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label className="admin-form-label">Correo electrónico</label>
              <input
                type="email" className="admin-input"
                value={correo} onChange={(e) => setCorreo(e.target.value)}
                required placeholder="admin@ejemplo.mx"
              />
            </div>

            {error && <p className="admin-error-msg" style={{ marginBottom: 12 }}>{error}</p>}

            <button
              type="submit"
              className="admin-btn admin-btn--primary admin-btn--block"
              disabled={loading}
            >
              {loading ? 'Enviando…' : 'Enviar enlace de recuperación'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
