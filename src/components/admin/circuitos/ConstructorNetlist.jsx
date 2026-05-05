import { useState } from 'react';
import { RecuadroParametros } from '../shared/RecuadroParametros';
import {
  TIPOS_COMPONENTE as TIPOS_VALIDOS,
  CANONICAL_PINS,
  PREFIJOS,
  RANGOS,
  UNIDADES_VALIDAS,
  ComponentFactory,
  Component,
} from '../../../domain';


 // Lista de tipos para el <select>. 
const TIPOS_COMPONENTE = [
  { value: 'resistencia',          label: 'Resistencia' },
  { value: 'resistencia_variable', label: 'Resistencia variable (potenciómetro)' },
  { value: 'fuente_voltaje',       label: 'Fuente de voltaje' },
  { value: 'fuente_corriente',     label: 'Fuente de corriente' },
  { value: 'capacitor',            label: 'Capacitor' },
  { value: 'bobina',               label: 'Bobina (inductor)' },
  { value: 'diodo',                label: 'Diodo' },
  { value: 'transistor_bjt',       label: 'Transistor BJT' },
  { value: 'transistor_fet',       label: 'Transistor FET' },
  { value: 'regulador_voltaje',    label: 'Regulador de voltaje' },
];


// Pines visibles en el formulario, por tipo.
const PINES_POR_TIPO = {
  resistencia: [
    { key: 'a', label: 'Nodo A (terminal izquierdo)' },
    { key: 'b', label: 'Nodo B (terminal derecho)' },
  ],
  resistencia_variable: [
    { key: 'a', label: 'Nodo A (extremo izquierdo)' },
    { key: 'w', label: 'Nodo W (cursor / wiper)' },
    { key: 'b', label: 'Nodo B (extremo derecho)' },
  ],
  capacitor: [
    { key: 'a', label: 'Nodo A (terminal +)' },
    { key: 'b', label: 'Nodo B (terminal −)' },
  ],
  bobina: [
    { key: 'a', label: 'Nodo A' },
    { key: 'b', label: 'Nodo B' },
  ],
  fuente_voltaje: [
    { key: 'a', label: 'Nodo + (positivo)' },
    { key: 'b', label: 'Nodo − (negativo)' },
  ],
  fuente_corriente: [
    { key: 'a', label: 'Nodo A (entrada)' },
    { key: 'b', label: 'Nodo B (salida)' },
  ],
  diodo: [
    { key: 'anodo',  label: 'Nodo Ánodo (A)' },
    { key: 'catodo', label: 'Nodo Cátodo (K)' },
  ],
  transistor_bjt: [
    { key: 'base',     label: 'Nodo Base (B)' },
    { key: 'colector', label: 'Nodo Colector (C)' },
    { key: 'emisor',   label: 'Nodo Emisor (E)' },
  ],
  transistor_fet: [
    { key: 'gate',   label: 'Nodo Gate (G)' },
    { key: 'drain',  label: 'Nodo Drain (D)' },
    { key: 'source', label: 'Nodo Source (S)' },
  ],
  regulador_voltaje: [
    { key: 'vin',  label: 'Nodo Vin (entrada)' },
    { key: 'vout', label: 'Nodo Vout (salida)' },
    { key: 'ref',  label: 'Nodo GND / ADJ (referencia)' },
  ],
};

/** Multiplicadores SI */
const SUFIJOS = { p: 1e-12, n: 1e-9, u: 1e-6, μ: 1e-6, m: 1e-3, k: 1e3, K: 1e3, M: 1e6, G: 1e9 };

/**
 * Genera un designador unico (R1, V1, …) para un tipo dado.
 * Reutiliza el helper centralizado de Component (mismo prefijo, mismo algoritmo).
 */
function generarId(tipo, lista) {
  if (!TIPOS_VALIDOS.includes(tipo)) return `X${lista.length + 1}`;
  return Component.generarId(tipo, lista);
}

/** Devuelve un objeto vacio con las keys de los pines del tipo. */
function nodosVaciosPara(tipo) {
  const pines = PINES_POR_TIPO[tipo] ?? [];
  return Object.fromEntries(pines.map((p) => [p.key, '']));
}

/** Ejemplos contextuales por tipo. */
function ejemploPorTipo(tipo) {
  switch (tipo) {
    case 'resistencia':
    case 'resistencia_variable': return 'ej: 330, 1k, 10kΩ';
    case 'capacitor':            return 'ej: 100u, 1uF, 10n';
    case 'bobina':               return 'ej: 1m, 100uH, 10mH';
    case 'fuente_voltaje':       return 'ej: 5, 12V, 3.3';
    case 'fuente_corriente':     return 'ej: 1, 100m, 5mA';
    default:                     return 'ej: 100';
  }
}

/** Formatea el valor crudo a notacion de ingenieria para feedback inmediato. */
function formatearValorParaPreview(rawVal, tipo) {
  const parsed = parseValue(rawVal, tipo);
  if (parsed === null || typeof parsed === 'object') return '';

  const unit = RANGOS[tipo]?.unit ?? '';
  const abs  = Math.abs(parsed);

  let coef, prefix;
  if      (abs >= 1e9)  { coef = parsed / 1e9;  prefix = 'G'; }
  else if (abs >= 1e6)  { coef = parsed / 1e6;  prefix = 'M'; }
  else if (abs >= 1e3)  { coef = parsed / 1e3;  prefix = 'k'; }
  else if (abs >= 1)    { coef = parsed;        prefix = '';  }
  else if (abs >= 1e-3) { coef = parsed * 1e3;  prefix = 'm'; }
  else if (abs >= 1e-6) { coef = parsed * 1e6;  prefix = 'µ'; }
  else if (abs >= 1e-9) { coef = parsed * 1e9;  prefix = 'n'; }
  else                  { coef = parsed * 1e12; prefix = 'p'; }

  const num = Number(coef.toFixed(3)).toString();
  return `= ${num} ${prefix}${unit}`;
}

/** parseValue — Acepta "330", "11k", "11kΩ", "5V", "100mF", "2.2u" */
function parseValue(str, tipo) {
  if (!str) return null;
  const s = String(str).trim();
  if (!s) return null;

  const re = /^([+-]?[0-9]*\.?[0-9]+)\s*([pnuμmkKMG]?)([a-zA-ZΩμ]*)$/;
  const match = s.match(re);
  if (!match) return null;

  const num    = parseFloat(match[1]);
  const sufijo = match[2];
  const unidad = (match[3] ?? '').replace(/μ/g, 'u');

  if (Number.isNaN(num)) return null;

  if (unidad && tipo && UNIDADES_VALIDAS[tipo]) {
    const unidadNorm = unidad.toUpperCase();
    const validas = UNIDADES_VALIDAS[tipo].map((u) => u.toUpperCase());
    if (!validas.some((v) => unidadNorm === v || unidadNorm === v + 'S')) {
      return { __unidadInvalida: unidad, esperada: UNIDADES_VALIDAS[tipo][0] };
    }
  }

  return num * (SUFIJOS[sufijo] ?? 1);
}

function validarValue(tipo, rawVal) {
  const rango = RANGOS[tipo];
  if (!rango || rango.min === null) return null;

  const parsed = parseValue(rawVal, tipo);
  if (parsed === null) return 'Formato invalido. Ej: 330, 1k, 5m, 12V, 100uF';
  if (typeof parsed === 'object' && parsed.__unidadInvalida) {
    return `Unidad "${parsed.__unidadInvalida}" no corresponde. Use ${parsed.esperada} u omítala.`;
  }
  if (parsed < rango.min || parsed > rango.max) {
    return `Valor fuera de rango (${rango.min}–${rango.max} ${rango.unit})`;
  }
  return null;
}

/** Parametros por defecto (delegamos a las defaults de cada subclase). */
function defaultParams(tipo) {
  if (!TIPOS_VALIDOS.includes(tipo)) return {};
  const dummy = ComponentFactory.crearVacio(tipo);
  return { ...dummy.params };
}

/**
 * ConstructorNetlist — Subformulario para agregar componentes uno por uno.
 *
 * Devuelve a `onAgregar` un objeto con la forma "admin".
 * Quien lo reciba debe usar `ComponentFactory.fromAdmin`
 * (o `ComponentFactory.from`) si quiere una instancia tipada.
 */
export function ConstructorNetlist({ componentes, onAgregar }) {
  const [tipo,     setTipo]     = useState('');
  const [value,    setValue]    = useState('');
  const [nodos,    setNodos]    = useState({});
  const [rotation, setRotation] = useState(0);
  const [params,   setParams]   = useState({});
  const [focusPin, setFocusPin] = useState(null);
  const [errVal,   setErrVal]   = useState('');

  const pinesActuales = tipo ? (PINES_POR_TIPO[tipo] ?? []) : [];

  // Nodos ya usados por cualquier pin de cualquier componente.
  // Soporta tanto componentes JSON (con `nodos`) como instancias Component.
  const nodosExistentes = [
    ...new Set(
      componentes.flatMap((c) => {
        if (typeof c.getNodos === 'function') return c.getNodos();
        return Object.values(c.nodos ?? c.nodes ?? {})
          .map((v) => (v && typeof v === 'object' ? v.nodo : v))
          .filter(Boolean);
      })
    ),
  ].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));

  function handleTipoChange(t) {
    setTipo(t);
    setValue('');
    setErrVal('');
    setNodos(nodosVaciosPara(t));
    setParams(defaultParams(t));
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

  function handleNodoChange(pinKey, valor) {
    setNodos((n) => ({ ...n, [pinKey]: valor }));
  }

  const idVisual = tipo ? generarId(tipo, componentes) : '—';

  const todosLosPinesLlenos = pinesActuales.every(
    (p) => (nodos[p.key] ?? '').trim() !== ''
  );

  const puedeAgregar =
    tipo !== '' &&
    todosLosPinesLlenos &&
    errVal === '' &&
    (RANGOS[tipo]?.min === null || value.trim() !== '');

  function handleLimpiar() {
    setTipo(''); setValue(''); setNodos({}); setRotation(0);
    setParams({}); setErrVal('');
  }

  function handleAgregar() {
    if (!puedeAgregar) return;
    const nodosFinal = Object.fromEntries(
      pinesActuales.map((p) => [p.key, (nodos[p.key] ?? '').trim()])
    );
    onAgregar({
      id:       idVisual,
      type:     tipo,
      value:    value.trim(),
      rotation: Number(rotation),
      nodos:    nodosFinal,
      params:   { ...params },
    });
    handleLimpiar();
  }

  return (
    <div className="admin-builder">
      <p className="admin-subsection-title">Agregar componente</p>

      <div className="admin-builder__row">
        <FieldWrap label="ID temporal (visual, no se envía al backend)">
          <input className="admin-input admin-input--readonly" value={idVisual} readOnly />
        </FieldWrap>
      </div>

      <div className="admin-builder__row">
        <FieldWrap label="Tipo de componente">
          <select className="admin-select admin-select--sm" value={tipo} onChange={(e) => handleTipoChange(e.target.value)}>
            <option value="">— Seleccionar —</option>
            {TIPOS_COMPONENTE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </FieldWrap>

        <FieldWrap label="Rotación">
          <select className="admin-select admin-select--sm" value={rotation} onChange={(e) => setRotation(Number(e.target.value))}>
            <option value={0}>0°</option>
            <option value={90}>90°</option>
          </select>
        </FieldWrap>
      </div>

      {tipo && RANGOS[tipo]?.min !== null && (
        <div className="admin-builder__row">
          <FieldWrap label={`Valor — ${ejemploPorTipo(tipo)}`}>
            <div className="admin-input-with-unit">
              <input
                type="text"
                className={`admin-input admin-input--sm ${errVal ? 'admin-input--error' : ''}`}
                value={value}
                onChange={(e) => handleValueChange(e.target.value)}
                placeholder={ejemploPorTipo(tipo)}
              />
              <span className="admin-input__unit" aria-hidden="true">
                {RANGOS[tipo]?.unit ?? ''}
              </span>
            </div>
            {errVal && <p className="admin-error-msg">{errVal}</p>}
            {!errVal && value && (
              <p className="admin-input-hint">
                {formatearValorParaPreview(value, tipo)}
              </p>
            )}
          </FieldWrap>
        </div>
      )}

      {tipo && pinesActuales.length > 0 && (
        <>
          {tipo === 'resistencia_variable' && (
            <p className="admin-input-hint" style={{ marginBottom: 4 }}>
              ℹ El backend lo expande en dos resistencias en serie:
              R<sub>AW</sub> entre A↔W y R<sub>WB</sub> entre W↔B.
            </p>
          )}
          {pinesActuales.map((pin) => (
            <div className="admin-builder__row" key={pin.key}>
              <FieldWrap label={pin.label}>
                <input
                  type="text"
                  className="admin-input admin-input--sm"
                  value={nodos[pin.key] ?? ''}
                  onChange={(e) => handleNodoChange(pin.key, e.target.value)}
                  onFocus={() => setFocusPin(pin.key)}
                  onBlur={() => setTimeout(() => setFocusPin(null), 150)}
                  placeholder="ej: 0, 1, 2"
                />
                {focusPin === pin.key && nodosExistentes.length > 0 && (
                  <NodeBadges
                    nodos={nodosExistentes}
                    onSelect={(n) => handleNodoChange(pin.key, n)}
                  />
                )}
              </FieldWrap>
            </div>
          ))}
        </>
      )}

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

      <div className="admin-builder__btn-row">
        <button
          type="button"
          className="admin-btn admin-btn--primary admin-btn--sm"
          onClick={handleAgregar}
          disabled={!puedeAgregar}
        >
          + Agregar componente
        </button>
        <button
          type="button"
          className="admin-btn admin-btn--cancel admin-btn--sm"
          onClick={handleLimpiar}
        >
          Limpiar
        </button>
      </div>
    </div>
  );
}

function NodeBadges({ nodos, onSelect }) {
  return (
    <div className="admin-node-badges">
      <span className="admin-node-badges__hint">Nodos:</span>
      {nodos.map((n) => (
        <button key={n} type="button" className="admin-node-badge" onClick={() => onSelect(n)}>
          {n}
        </button>
      ))}
    </div>
  );
}

function FieldWrap({ label, children }) {
  return (
    <div className="admin-builder__field">
      <label className="admin-form-label admin-form-label--sm">{label}</label>
      {children}
    </div>
  );
}

export { PINES_POR_TIPO };

/**
 * @param {object|import('../../../domain').Component} comp
 */
export function normalizarComponente(comp) {
  if (typeof comp.toAdminJSON === 'function') return comp.toAdminJSON();
  if (comp.nodos && typeof comp.nodos === 'object') return comp;

  // Compat retroactiva: nodo_a / nodo_b → { a, b }
  if ('nodo_a' in comp || 'nodo_b' in comp) {
    return {
      ...comp,
      nodos: { a: comp.nodo_a ?? '', b: comp.nodo_b ?? '' },
    };
  }
  return { ...comp, nodos: nodosVaciosPara(comp.type) };
}
