import { useState, useId } from 'react';

/**
 * evalFortaleza — Evalua la fortaleza de una contraseña.
 */
function evalFortaleza(pwd) {
  if (!pwd) return { nivel: 0, etiqueta: '', color: 'transparent' };
  let score = 0;
  if (pwd.length >= 8)                      score++;
  if (/[A-Z]/.test(pwd))                    score++;
  if (/[0-9]/.test(pwd))                    score++;
  if (/[^A-Za-z0-9]/.test(pwd))            score++;

  const niveles = [
    { nivel: 0, etiqueta: '',           color: 'transparent' },
    { nivel: 1, etiqueta: 'Muy débil',  color: '#f87171' },
    { nivel: 2, etiqueta: 'Débil',      color: '#fb923c' },
    { nivel: 3, etiqueta: 'Aceptable',  color: '#fbbf24' },
    { nivel: 4, etiqueta: 'Fuerte',     color: '#4ade80' },
  ];
  return niveles[score];
}

/**
 * InputContrasena — Campo de contraseña reutilizable.
 * Incluye: toggle mostrar/ocultar + barra de fortaleza en tiempo real.
 *
 * @param {{
 *   label: string,
 *   name: string,
 *   value: string,
 *   onChange: (v: string) => void,
 *   mostrarFortaleza?: boolean,
 *   error?: string,
 *   placeholder?: string,
 * }} props
 */
export function InputContrasena({
  label,
  name,
  value = '',
  onChange,
  mostrarFortaleza = false,
  error,
  placeholder = '',
}) {
  const [visible, setVisible] = useState(false);
  const uid = useId();
  const fortaleza = mostrarFortaleza ? evalFortaleza(value) : null;

  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label htmlFor={uid} style={labelStyle}>{label}</label>
      )}

      <div style={inputWrap}>
        <input
          id={uid}
          name={name}
          type={visible ? 'text' : 'password'}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle, borderColor: error ? 'var(--danger)' : 'var(--border)' }}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          style={toggleBtn}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible ? <EyeOff /> : <Eye />}
        </button>
      </div>

      {/* Barra de fortaleza */}
      {mostrarFortaleza && value.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <div style={barContainer}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  ...barSegment,
                  background: i <= fortaleza.nivel ? fortaleza.color : 'var(--border)',
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: 11, color: fortaleza.color, marginTop: 3 }}>
            {fortaleza.etiqueta}
          </span>
        </div>
      )}

      {error && <p style={errorMsg}>{error}</p>}
    </div>
  );
}

/* ── Iconos inline ─────────────────────────────────── */
function Eye() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function EyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

/* ── Estilos ──────────────────────────────────────── */
const labelStyle  = { display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 };
const inputWrap   = { position: 'relative' };
const inputStyle  = {
  width: '100%', padding: '9px 38px 9px 12px',
  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)', color: 'var(--text)', fontSize: 13,
  outline: 'none', transition: 'border-color .15s',
};
const toggleBtn = {
  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--text-muted)', display: 'flex', padding: 2,
};
const barContainer = { display: 'flex', gap: 4 };
const barSegment   = { flex: 1, height: 4, borderRadius: 2, transition: 'background .2s' };
const errorMsg     = { fontSize: 11, color: 'var(--danger)', marginTop: 4 };
