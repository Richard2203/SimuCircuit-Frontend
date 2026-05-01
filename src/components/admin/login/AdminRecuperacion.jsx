import { useState } from 'react';
import { authService } from '../../../services/admin/authService';

/**
 * AdminRecuperacion — Formulario de recuperacion de contraseña
 *
 * @param {{ onVolver: () => void }} props
 */
export function AdminRecuperacion({ onVolver }) {
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
    <div style={page}>
      <div style={card}>
        <button onClick={onVolver} style={backBtn}>
          ← Volver al login
        </button>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={titleSt}>Recuperar contraseña</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Ingresa tu correo y recibirás un enlace de restablecimiento.
          </p>
        </div>

        {enviado ? (
          <div style={successBox}>
            <span style={{ fontSize: 22 }}>✉️</span>
            <p style={{ fontSize: 14, color: 'var(--success)', fontWeight: 600 }}>¡Listo!</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
              Si el correo <strong style={{ color: 'var(--text)' }}>{correo}</strong> está registrado,
              recibirás un enlace para restablecer tu contraseña.
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 6 }}>
              El enlace expira en 30 minutos. Revisa también tu carpeta de spam.
            </p>
            <button onClick={onVolver} style={btnSt}>Volver al login</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelSt}>Correo electrónico</label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
                placeholder="admin@ejemplo.mx"
                style={inputSt}
              />
            </div>

            {error && (
              <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 12 }}>{error}</p>
            )}

            <button type="submit" disabled={loading} style={{ ...btnSt, opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Enviando…' : 'Enviar enlace de recuperación'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const page      = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'var(--bg)' };
const card      = { width: '100%', maxWidth: 400, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '36px 32px' };
const titleSt   = { fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 };
const labelSt   = { display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 };
const inputSt   = { width: '100%', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text)', fontSize: 13, outline: 'none' };
const btnSt     = { width: '100%', padding: '11px 0', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 10 };
const backBtn   = { background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0 };
const successBox = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 20, background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 'var(--r-md)' };
