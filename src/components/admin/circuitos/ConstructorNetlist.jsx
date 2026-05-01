import { useState } from 'react';
import { RecuadroParametros } from '../shared/RecuadroParametros';

/** Tipos de componentes que existen en la BD */
const TIPOS_COMPONENTE = [
  { value: 'resistencia',         label: 'Resistencia' },
  { value: 'resistencia_variable',label: 'Resistencia variable (potenciómetro)' },
  { value: 'fuente_voltaje',      label: 'Fuente de voltaje' },
  { value: 'fuente_corriente',    label: 'Fuente de corriente' },
  { value: 'capacitor',           label: 'Capacitor' },
  { value: 'bobina',              label: 'Bobina (inductor)' },
  { value: 'diodo',               label: 'Diodo' },
  { value: 'transistor_bjt',      label: 'Transistor BJT' },
  { value: 'transistor_fet',      label: 'Transistor FET' },
  { value: 'regulador_voltaje',   label: 'Regulador de voltaje' },
];

/** Prefijos de designador por tipo (para el ID temporal visual) */
const PREFIJO = {
  resistencia: 'R', resistencia_variable: 'RV', fuente_voltaje: 'V',
  fuente_corriente: 'I', capacitor: 'C', bobina: 'L',
  diodo: 'D', transistor_bjt: 'Q', transistor_fet: 'J', regulador_voltaje: 'U',
};

/** Rangos de validación por tipo */
const RANGOS = {
  resistencia:       { min: 1,    max: 10_000_000, unit: 'Ω' },
  resistencia_variable: { min: 1, max: 10_000_000, unit: 'Ω' },
  capacitor:         { min: 1e-12, max: 0.1,        unit: 'F' },
  bobina:            { min: 1e-9,  max: 100,         unit: 'H' },
  fuente_voltaje:    { min: 0.1,   max: 500,         unit: 'V' },
  fuente_corriente:  { min: 1e-6,  max: 50,          unit: 'A' },
  diodo:             { min: null,  max: null,         unit: '' },
  transistor_bjt:    { min: null,  max: null,         unit: '' },
  transistor_fet:    { min: null,  max: null,         unit: '' },
  regulador_voltaje: { min: null,  max: null,         unit: '' },
};

/** Sufijos soportados */
const SUFIJOS = { p: 1e-12, n: 1e-9, u: 1e-6, m: 1e-3, k: 1e3, M: 1e6, G: 1e9 };

function parseValue(str) {
  if (!str) return null;
  const s = str.trim();
  const match = s.match(/^([0-9]*\.?[0-9]+)\s*([pnumkMG]?)$/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const suf = match[2];
  return num * (SUFIJOS[suf] ?? 1);
}

function validarValue(tipo, rawVal) {
  const rango = RANGOS[tipo];
  if (!rango || rango.min === null) return null; // sin validacion de valor para componentes sin valor SI
  const v = parseValue(rawVal);
  if (v === null) return 'Formato inválido. Ej: 330, 1k, 5m, 2u';
  if (v < rango.min || v > rango.max) return `Valor fuera de rango (${rango.min}–${rango.max} ${rango.unit})`;
  return null;
}

function generarId(tipo, lista) {
  const pref = PREFIJO[tipo] ?? 'X';
  let n = 1;
  const ids = new Set(lista.map((c) => c.id));
  while (ids.has(`${pref}${n}`)) n++;
  return `${pref}${n}`;
}

/** Parametros por defecto al cambiar de tipo */
function defaultParams(tipo) {
  switch (tipo) {
    case 'resistencia':
    case 'resistencia_variable':
      return { banda_uno: 'Naranja', banda_dos: 'Naranja', banda_tres: 'Marrón', banda_tolerancia: 'Dorado', potencia_nominal: '0.25', isResistenciaVariable: 0 };
    case 'fuente_voltaje':
      return { activo: 1, corriente_max: '5.00', dcOrAc: 'dc', phase: '0.00', frequency: '0.00' };
    case 'fuente_corriente':
      return { activo: 1, voltaje_max: '30.00', dcOrAc: 'dc', phase: '0.00', frequency: '0.00' };
    case 'diodo':
      return { tipo: 'Rectificador', corriente_max: '1.000', voltaje_inv_max: '100.000', caida_tension: '0.700', rz: '0.00', is_saturacion: '1e-14' };
    case 'capacitor':
      return { tipo_dioelectrico: 'Cerámico', voltaje: '50.00', polaridad: 0 };
    case 'bobina':
      return { corriente_max: '0.500', resistencia_dc: '5.000' };
    case 'transistor_bjt':
      return { tipo: 'NPN', configuracion: 'Uso General', beta: '100', vbe_saturacion: '0.600', vce_saturacion: '0.300', corriente_colector_max: '0.800', potencia_maxima: '0.500', frecuencia_transicion: '300', modo_operacion: 'Amplificador/Interruptor' };
    case 'transistor_fet':
      return { tipo: 'MOSFET_N', idss: '0.200', vp: '2.000', gm: '0.320', rd: '5.000', configuracion: 'Interruptor', modo_operacion: 'Conmutación Rápida' };
    case 'regulador_voltaje':
      return { tipo: 'Lineal Fijo', voltaje_salida: '5.000', corriente_maxima: '1.500', voltaje_entrada_min: '7.000', voltaje_entrada_max: '35.000', dropout_voltage: '2.000', disipacion_maxima: '15.000', tolerancia: '4.00' };
    default:
      return {};
  }
}

/**
 * ConstructorNetlist — Subformulario para agregar componentes uno por uno.
 *
 * @param {{
 *   componentes: Array,
 *   onAgregar: (comp: object) => void,
 * }} props
 */
export function ConstructorNetlist({ componentes, onAgregar }) {
  const [tipo,     setTipo]     = useState('');
  const [value,    setValue]    = useState('');
  const [nodo_a,   setNodoA]    = useState('');
  const [nodo_b,   setNodoB]    = useState('');
  const [rotation, setRotation] = useState(0);
  const [params,   setParams]   = useState({});
  const [focusCampo, setFocusCampo] = useState(null); // 'a' | 'b' | null
  const [errVal,   setErrVal]   = useState('');

  // Nodos ya declarados en la netlist actual
  const nodosExistentes = [...new Set(
    componentes.flatMap((c) => [c.nodo_a, c.nodo_b].filter(Boolean))
  )].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  function handleTipoChange(t) {
    setTipo(t);
    setValue('');
    setParams(defaultParams(t));
    setErrVal('');
  }

  function handleValueChange(v) {
    setValue(v);
    if (tipo) setErrVal(validarValue(tipo, v) ?? '');
  }

  function handleParamChange(campo, val) {
    setParams((p) => ({ ...p, [campo]: val }));
  }

  function handleBandasChange(bandas) {
    setParams((p) => ({ ...p, ...bandas }));
  }

  const idVisual = tipo ? generarId(tipo, componentes) : '—';

  const puedeAgregar =
    tipo !== '' &&
    nodo_a.trim() !== '' &&
    nodo_b.trim() !== '' &&
    errVal === '' &&
    (RANGOS[tipo]?.min === null || value.trim() !== '');

  function handleAgregar() {
    if (!puedeAgregar) return;
    onAgregar({
      id:       idVisual,
      type:     tipo,
      value:    value.trim(),
      nodo_a:   nodo_a.trim(),
      nodo_b:   nodo_b.trim(),
      rotation: Number(rotation),
      params:   { ...params },
    });
    // Reset
    setValue(''); setNodoA(''); setNodoB(''); setRotation(0); setErrVal('');
    setParams(defaultParams(tipo));
  }

  function handleLimpiar() {
    setTipo(''); setValue(''); setNodoA(''); setNodoB(''); setRotation(0);
    setParams({}); setErrVal('');
  }

  return (
    <div style={box}>
      <p style={boxTitle}>Agregar componente</p>

      {/* ID temporal (solo lectura) */}
      <div style={row}>
        <FieldWrap label="ID temporal (visual, no se envía al backend)">
          <input value={idVisual} readOnly style={{ ...inputSt, color: 'var(--text-muted)', cursor: 'default' }}/>
        </FieldWrap>
      </div>

      {/* Tipo */}
      <div style={row}>
        <FieldWrap label="Tipo de componente">
          <select value={tipo} onChange={(e) => handleTipoChange(e.target.value)} style={selectSt}>
            <option value="">— Seleccionar —</option>
            {TIPOS_COMPONENTE.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </FieldWrap>

        <FieldWrap label="Rotación">
          <select value={rotation} onChange={(e) => setRotation(Number(e.target.value))} style={selectSt}>
            <option value={0}>0°</option>
            <option value={90}>90°</option>
          </select>
        </FieldWrap>
      </div>

      {/* Valor */}
      {tipo && RANGOS[tipo]?.min !== null && (
        <div style={row}>
          <FieldWrap label={`Valor (${RANGOS[tipo]?.unit ?? ''}) — ej: 330, 1k, 5m`}>
            <input
              type="text"
              value={value}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder={`Ej: 330, 1k, 5m (${RANGOS[tipo]?.unit})`}
              style={{ ...inputSt, borderColor: errVal ? 'var(--danger)' : 'var(--border)' }}
            />
            {errVal && <p style={errMsg}>{errVal}</p>}
          </FieldWrap>
        </div>
      )}

      {/* Nodos */}
      <div style={row}>
        <FieldWrap label="Nodo A (terminal +/izquierdo)">
          <input
            type="text"
            value={nodo_a}
            onChange={(e) => setNodoA(e.target.value)}
            onFocus={() => setFocusCampo('a')}
            onBlur={() => setTimeout(() => setFocusCampo(null), 150)}
            placeholder="ej: 0, 1, 2"
            style={inputSt}
          />
          {focusCampo === 'a' && nodosExistentes.length > 0 && (
            <NodeBadges nodos={nodosExistentes} onSelect={setNodoA} />
          )}
        </FieldWrap>

        <FieldWrap label="Nodo B (terminal −/derecho)">
          <input
            type="text"
            value={nodo_b}
            onChange={(e) => setNodoB(e.target.value)}
            onFocus={() => setFocusCampo('b')}
            onBlur={() => setTimeout(() => setFocusCampo(null), 150)}
            placeholder="ej: 0, 1, 2"
            style={inputSt}
          />
          {focusCampo === 'b' && nodosExistentes.length > 0 && (
            <NodeBadges nodos={nodosExistentes} onSelect={setNodoB} />
          )}
        </FieldWrap>
      </div>

      {/* Parametros adicionales */}
      {tipo && (
        <RecuadroParametros
          tipo={tipo}
          params={params}
          onChange={handleParamChange}
          onBandasChange={handleBandasChange}
          onValueChange={handleValueChange}
          value={value}
        />
      )}

      {/* Botones */}
      <div style={btnRow}>
        <button
          type="button"
          onClick={handleAgregar}
          disabled={!puedeAgregar}
          style={{ ...btnPrimary, opacity: puedeAgregar ? 1 : 0.4 }}
        >
          + Agregar componente
        </button>
        <button type="button" onClick={handleLimpiar} style={btnSecondary}>
          Limpiar
        </button>
      </div>
    </div>
  );
}

/** Badges de nodos existentes para autocompletar */
function NodeBadges({ nodos, onSelect }) {
  return (
    <div style={badgeWrap}>
      <span style={{ fontSize: 10, color: 'var(--text-hint)', marginRight: 4 }}>Nodos:</span>
      {nodos.map((n) => (
        <button key={n} type="button" onClick={() => onSelect(n)} style={nodeBadge}>
          {n}
        </button>
      ))}
    </div>
  );
}

function FieldWrap({ label, children }) {
  return (
    <div style={{ flex: 1, minWidth: 140 }}>
      <label style={labelSt}>{label}</label>
      {children}
    </div>
  );
}

/* ── Estilos ────────────────────────────────────── */
const box       = { border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '14px 16px', background: 'var(--bg-elevated)' };
const boxTitle  = { fontSize: 12, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 };
const row       = { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 };
const labelSt   = { display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 };
const inputSt   = { width: '100%', padding: '7px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--text)', fontSize: 12, outline: 'none' };
const selectSt  = { width: '100%', padding: '7px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--text)', fontSize: 12, outline: 'none' };
const errMsg    = { fontSize: 11, color: 'var(--danger)', marginTop: 3 };
const btnRow    = { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 };
const btnPrimary   = { padding: '8px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-md)', fontSize: 12, fontWeight: 600, cursor: 'pointer' };
const btnSecondary = { padding: '8px 16px', background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 12, cursor: 'pointer' };
const badgeWrap    = { marginTop: 5, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' };
const nodeBadge    = { padding: '2px 8px', background: 'rgba(108,99,255,0.15)', color: 'var(--accent)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 10, fontSize: 11, cursor: 'pointer', fontWeight: 600 };
