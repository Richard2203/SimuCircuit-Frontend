import { useState } from 'react';
import { RecuadroParametros } from '../shared/RecuadroParametros';

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

/**
 * Configuración de pines (terminales) por tipo de componente.
 * key - dato JSON
 * label - dato usuario
 */
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

/** Prefijos de designador por tipo (ID temporal visual) */
const PREFIJO = {
  resistencia: 'R', resistencia_variable: 'RV', fuente_voltaje: 'V',
  fuente_corriente: 'I', capacitor: 'C', bobina: 'L',
  diodo: 'D', transistor_bjt: 'Q', transistor_fet: 'J', regulador_voltaje: 'U',
};

/** Rangos de validación por tipo */
const RANGOS = {
  resistencia:          { min: 1,    max: 10_000_000, unit: 'Ω' },
  resistencia_variable: { min: 1,    max: 10_000_000, unit: 'Ω' },
  capacitor:            { min: 1e-12,max: 0.1,        unit: 'F' },
  bobina:               { min: 1e-9, max: 100,        unit: 'H' },
  fuente_voltaje:       { min: 0.1,  max: 500,        unit: 'V' },
  fuente_corriente:     { min: 1e-6, max: 50,         unit: 'A' },
  diodo:                { min: null, max: null,       unit: '' },
  transistor_bjt:       { min: null, max: null,       unit: '' },
  transistor_fet:       { min: null, max: null,       unit: '' },
  regulador_voltaje:    { min: null, max: null,       unit: '' },
};

/** Multiplicadores SI */
const SUFIJOS = { p: 1e-12, n: 1e-9, u: 1e-6, μ: 1e-6, m: 1e-3, k: 1e3, K: 1e3, M: 1e6, G: 1e9 };

/** Validación de unidades */
const UNIDADES_VALIDAS = {
  resistencia:          ['Ω', 'OHM', 'OHMS'],
  resistencia_variable: ['Ω', 'OHM', 'OHMS'],
  capacitor:            ['F'],
  bobina:               ['H'],
  fuente_voltaje:       ['V'],
  fuente_corriente:     ['A'],
};

function generarId(tipo, lista) {
  const pref = PREFIJO[tipo] ?? 'X';
  let n = 1;
  const ids = new Set(lista.map((c) => c.id));
  while (ids.has(`${pref}${n}`)) n++;
  return `${pref}${n}`;
}

/** Devuelve un objeto vacio con las keys de los pines del tipo. */
function nodosVaciosPara(tipo) {
  const pines = PINES_POR_TIPO[tipo] ?? [];
  return Object.fromEntries(pines.map((p) => [p.key, '']));
}

/** Ejemplos contextuales segun tipo de componente */
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

/**
 * Formatea el valor crudo a notacion de  ingenieria para feedback inmediato.
 */
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

/**
 * parseValue — Acepta formatos como: "330", "11k", "11kΩ", "5V", "100mF", "2.2u"
 */
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
  if (parsed === null) return 'Formato inválido. Ej: 330, 1k, 5m, 12V, 100uF';
  if (typeof parsed === 'object' && parsed.__unidadInvalida) {
    return `Unidad "${parsed.__unidadInvalida}" no corresponde. Use ${parsed.esperada} u omítala.`;
  }
  if (parsed < rango.min || parsed > rango.max) {
    return `Valor fuera de rango (${rango.min}–${rango.max} ${rango.unit})`;
  }
  return null;
}

/** Parametros por defecto al cambiar de tipo */
function defaultParams(tipo) {
  switch (tipo) {
    case 'resistencia':
    case 'resistencia_variable':
      return { banda_uno: 'Naranja', banda_dos: 'Naranja', banda_tres: 'Marrón', banda_tolerancia: 'Dorado', potencia_nominal: '0.25', isResistenciaVariable: tipo === 'resistencia_variable' ? 1 : 0, ...(tipo === 'resistencia_variable' ? { cursor_pos: 50 } : {}) };
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
    default: return {};
  }
}

/**
 * ConstructorNetlist — Subformulario para agregar componentes uno por uno.
 */
export function ConstructorNetlist({ componentes, onAgregar }) {
  const [tipo,       setTipo]       = useState('');
  const [value,      setValue]      = useState('');
  const [nodos,      setNodos]      = useState({});
  const [rotation,   setRotation]   = useState(0);
  const [params,     setParams]     = useState({});
  const [focusPin,   setFocusPin]   = useState(null);   // key del pin enfocado
  const [errVal,     setErrVal]     = useState('');

  const pinesActuales = tipo ? (PINES_POR_TIPO[tipo] ?? []) : [];

  // Nodos ya usados en el circuito (de cualquier pin de cualquier componente)
  const nodosExistentes = [
    ...new Set(
      componentes.flatMap((c) =>
        Object.values(c.nodos ?? {}).filter((v) => v !== '' && v != null)
      )
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
    // Construir objeto nodos final con valores trimmed
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

      {/* ID temporal */}
      <div className="admin-builder__row">
        <FieldWrap label="ID temporal (visual, no se envía al backend)">
          <input className="admin-input admin-input--readonly" value={idVisual} readOnly />
        </FieldWrap>
      </div>

      {/* Tipo + rotacion */}
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

      {/* Valor con unidad visible como addon */}
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

      {/* Pines (dinamicos segun el tipo: 2 o 3 nodos) */}
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
 * Normaliza una entrada de netlist heredada (con `nodo_a` / `nodo_b`)
 * al formato unificado con `nodos: { ... }`.
 */
export function normalizarComponente(comp) {
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
