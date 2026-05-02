import { useState, useId } from 'react';

/** Evalua la fortaleza de una contraseña: 0–4 niveles. */
function evalFortaleza(pwd) {
  if (!pwd) return { nivel: 0, etiqueta: '', color: 'transparent' };
  let score = 0;
  if (pwd.length >= 8)            score++;
  if (/[A-Z]/.test(pwd))          score++;
  if (/[0-9]/.test(pwd))          score++;
  if (/[^A-Za-z0-9]/.test(pwd))   score++;

  return [
    { nivel: 0, etiqueta: '',          color: 'transparent' },
    { nivel: 1, etiqueta: 'Muy débil', color: '#f87171' },
    { nivel: 2, etiqueta: 'Débil',     color: '#fb923c' },
    { nivel: 3, etiqueta: 'Aceptable', color: '#fbbf24' },
    { nivel: 4, etiqueta: 'Fuerte',    color: '#4ade80' },
  ][score];
}

/**
 * InputContrasena — Campo de contraseña con toggle mostrar/ocultar
 * y barra de fortaleza en tiempo real.
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
    <div className="admin-pwd">
      {label && <label htmlFor={uid} className="admin-form-label">{label}</label>}

      <div className="admin-pwd__wrap">
        <input
          id={uid}
          name={name}
          type={visible ? 'text' : 'password'}
          className={`admin-input admin-pwd__input ${error ? 'admin-input--error' : ''}`}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
        />
        <button
          type="button"
          className="admin-pwd__toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible ? <EyeOff /> : <Eye />}
        </button>
      </div>

      {mostrarFortaleza && value.length > 0 && (
        <div className="admin-pwd__strength">
          <div className="admin-pwd__bars">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="admin-pwd__bar"
                style={{ background: i <= fortaleza.nivel ? fortaleza.color : undefined }}
              />
            ))}
          </div>
          <span className="admin-pwd__label" style={{ color: fortaleza.color }}>
            {fortaleza.etiqueta}
          </span>
        </div>
      )}

      {error && <p className="admin-error-msg">{error}</p>}
    </div>
  );
}

/* ── Iconos inline ─────────────────────────────── */
function Eye() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
