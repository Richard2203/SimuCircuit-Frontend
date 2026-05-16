import { useState, useEffect } from 'react';
import { RecuadroParametros } from '../shared/RecuadroParametros';
import {
  TIPOS_COMPONENTE as TIPOS_VALIDOS,
  RANGOS,
  UNIDADES_VALIDAS,
  ComponentFactory,
  Component,
  labelForTipo,
} from '../../../domain';
import {
  DIRECCIONES,
  ROTACIONES,
  rotacionSugerida,
  etiquetaDireccion,
  etiquetaRotacion,
} from './circuitLayout';

/* Lista de tipos para el select de tipo */
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

/* Pines visibles en el formulario por tipo */
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

const TIPOS_SIN_VALOR_NUMERICO = new Set([
  'diodo', 'transistor_bjt', 'transistor_fet', 'regulador_voltaje',
]);

const SUFIJOS = { p: 1e-12, n: 1e-9, u: 1e-6, μ: 1e-6, m: 1e-3, k: 1e3, K: 1e3, M: 1e6, G: 1e9 };

function generarId(tipo, lista) {
  if (!TIPOS_VALIDOS.includes(tipo)) return `X${lista.length + 1}`;
  return Component.generarId(tipo, lista);
}

function nodosVaciosPara(tipo) {
  const pines = PINES_POR_TIPO[tipo] ?? [];
  return Object.fromEntries(pines.map((p) => [p.key, '']));
}

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

function formatearValorParaPreview(rawVal, tipo) {
  const parsed = parseValue(rawVal, tipo);
  if (parsed === null || typeof parsed === 'object') return '';
  const unit = RANGOS[tipo]?.unit ?? '';
  const abs = Math.abs(parsed);
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

function parseValue(str, tipo) {
  if (!str) return null;
  const s = String(str).trim();
  if (!s) return null;
  const re = /^([+-]?[0-9]*\.?[0-9]+)\s*([pnuμmkKMG]?)([a-zA-ZΩμ]*)$/;
  const match = s.match(re);
  if (!match) return null;
  const num = parseFloat(match[1]);
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

/**
 * Normaliza un value tipeado por el usuario a un string "canonico" que el
 * renderer y los modelos del simulador puedan interpretar.
 *
 * Funcion para descartar unidad-etra del value
 * "12V"  -> "12", "5mA" -> "5m", "10kΩ" -> "10k".
 *
 * Si el value no se puede parsear se devuelve tal cual: diodos, BJT, regulador
 *
 * @param {string} rawVal
 * @param {string} tipo
 * @returns {string}
 */
function normalizarValueParaBackend(rawVal, tipo) {
  if (!rawVal) return '';
  const s = String(rawVal).trim();
  if (!s) return '';
  // Para tipos sin valor numerico, conservar la cadena original
  if (TIPOS_SIN_VALOR_NUMERICO.has(tipo)) return s;
  // Descomponer "<numero><sufijoSI><unidad?>" y reconstruir sin la unidad
  const re = /^([+-]?[0-9]*\.?[0-9]+)\s*([pnuμmkKMG]?)([a-zA-ZΩμ]*)$/;
  const match = s.match(re);
  if (!match) return s;            // no parseable: lo dejamos tal cual
  const num = match[1];
  const sufijo = match[2] || '';
  // Devolvemos numero + sufijo, sin la unidad-letra final
  return `${num}${sufijo}`;
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

function defaultParams(tipo) {
  if (!TIPOS_VALIDOS.includes(tipo)) return {};
  const dummy = ComponentFactory.crearVacio(tipo);
  return { ...dummy.params };
}

/**
 * ConstructorNetlist — Form de agregar / editar componente (Approach C v2).
 *
 * Modo EDICION: cuando se pasa editing (un componente existente), el
 * formulario se rellena con sus valores. Al pulsar "Guardar cambios" se
 * llama a onActualizar(compEditado). El boton "Limpiar" cancela.
 *
 * @param {{
 *   componentes: Array,
 *   onAgregar:    (rawComp: object) => void,
 *   onActualizar?:(rawComp: object) => void,
 *   editing?:     object | null,
 *   onCancelEdit?: () => void,
 * }} props
 */
export function ConstructorNetlist({
  componentes,
  onAgregar,
  onActualizar,
  editing = null,
  onCancelEdit,
}) {
  const isEditing = Boolean(editing);

  const [tipo,      setTipo]      = useState('');
  const [value,     setValue]     = useState('');
  const [nodos,     setNodos]     = useState({});
  const [rotation,  setRotation]  = useState(0);
  const [params,    setParams]    = useState({});
  const [focusPin,  setFocusPin]  = useState(null);
  const [errVal,    setErrVal]    = useState('');
  const [refId,     setRefId]     = useState('');
  const [direccion, setDireccion] = useState(DIRECCIONES.DERECHA);

  /* Cargar valores del componente al entrar en modo edicion */
  useEffect(() => {
    if (!editing) {
      // Salimos de edicion: limpia el form
      setTipo(''); setValue(''); setNodos({}); setRotation(0);
      setParams({}); setErrVal('');
      return;
    }
    setTipo(editing.type ?? '');
    setValue(String(editing.value ?? ''));
    // Si viene como Component instance, getNodos no aplica para el form admin
    const nodosAdmin = editing.nodos
      ?? Object.fromEntries(
        Object.entries(editing.nodes ?? {}).map(([k, v]) => [
          k,
          typeof v === 'object' ? v.nodo : v,
        ])
      );
    // Filtra solo las keys conocidas para este tipo
    const pines = PINES_POR_TIPO[editing.type] ?? [];
    const filtered = {};
    pines.forEach((p) => { filtered[p.key] = String(nodosAdmin[p.key] ?? ''); });
    setNodos(filtered);
    setRotation(Number(editing.rotation) || 0);
    setParams({ ...(editing.params ?? {}) });
    setErrVal('');
  }, [editing]);

  /* Sugerir rotacion al cambiar direccion (solo agregar, no editar) */
  useEffect(() => {
    if (!isEditing && refId) setRotation(rotacionSugerida(direccion));
  }, [direccion, refId, isEditing]);

  /* Si el componente referenciado desaparece, limpia */
  useEffect(() => {
    if (refId && !componentes.some((c) => c.id === refId)) setRefId('');
  }, [componentes, refId]);

  const pinesActuales = tipo ? (PINES_POR_TIPO[tipo] ?? []) : [];
  const hayExistentes = componentes.length > 0;

  const existentesOrdenados = [...componentes]
    .filter((c) => c.id !== editing?.id)
    .sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));

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
    if (tipo && !TIPOS_SIN_VALOR_NUMERICO.has(tipo)) {
      setErrVal(validarValue(tipo, v) ?? '');
    } else {
      setErrVal('');
    }
  }

  function handleParamChange(campo, val) {
    setParams((p) => ({ ...p, [campo]: val }));
  }

  function handleBandasChange(bandas) {
    setParams((p) => ({ ...p, ...bandas }));
  }

  /**
   * Carga de parametros de acuerdo al tipo de componente
   */
  function handleParamsBulkChange(nuevosParams) {
    setParams((p) => ({ ...p, ...nuevosParams }));
  }

  function handleNodoChange(pinKey, valor) {
    setNodos((n) => ({ ...n, [pinKey]: valor }));
  }

  const idVisual = isEditing
    ? editing.id
    : (tipo ? generarId(tipo, componentes) : '—');

  const todosLosPinesLlenos = pinesActuales.every(
    (p) => (nodos[p.key] ?? '').trim() !== ''
  );

  const requiereValor = tipo && !TIPOS_SIN_VALOR_NUMERICO.has(tipo);
  const puedeAgregar =
    tipo !== '' &&
    todosLosPinesLlenos &&
    errVal === '' &&
    (!requiereValor || value.trim() !== '');

  function handleLimpiar() {
    if (isEditing) {
      onCancelEdit?.();
      return;
    }
    setTipo(''); setValue(''); setNodos({}); setRotation(0);
    setParams({}); setErrVal('');
  }

  function handleAgregarOActualizar() {
    if (!puedeAgregar) return;
    const nodosFinal = Object.fromEntries(
      pinesActuales.map((p) => [p.key, (nodos[p.key] ?? '').trim()])
    );
    // Normalizar el value para que el renderer pueda parsearlo correctamente.
    // "12V" -> "12", "100mA" -> "100m", "10kΩ" -> "10k".
    const valueNormalizado = normalizarValueParaBackend(value.trim(), tipo);
    const payload = {
      id:       idVisual,
      type:     tipo,
      value:    valueNormalizado,
      rotation: Number(rotation),
      nodos:    nodosFinal,
      params:   { ...params },
    };
    if (isEditing) {
      onActualizar?.({ ...payload, position: editing.position });
    } else {
      onAgregar?.({
        ...payload,
        __placement: {
          refId:     refId || null,
          direccion: refId ? direccion : null,
        },
      });
    }
    handleLimpiar();
  }

  return (
    <div className={`admin-builder ${isEditing ? 'admin-builder--editing' : ''}`}>
      <p className="admin-subsection-title">
        {isEditing
          ? <>Editando componente <span style={{ color: 'var(--accent)' }}>{editing.id}</span></>
          : 'Agregar componente'}
      </p>

      <div className="admin-builder__row">
        <FieldWrap label="ID temporal (visual, no se envía al backend)">
          <input className="admin-input admin-input--readonly" value={idVisual} readOnly />
        </FieldWrap>
      </div>

      <div className="admin-builder__row">
        <FieldWrap label="Tipo de componente">
          <select
            className="admin-select admin-select--sm"
            value={tipo}
            onChange={(e) => handleTipoChange(e.target.value)}
            disabled={isEditing}
          >
            <option value="">— Seleccionar —</option>
            {TIPOS_COMPONENTE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </FieldWrap>

        <FieldWrap label="Rotación">
          <select className="admin-select admin-select--sm" value={rotation} onChange={(e) => setRotation(Number(e.target.value))}>
            {ROTACIONES.map((r) => <option key={r} value={r}>{etiquetaRotacion(r)}</option>)}
          </select>
        </FieldWrap>
      </div>

      {/* Bloque de colocacion (solo en modo agregar) */}
      {!isEditing && (
        <div className="admin-builder__placement">
          <p className="admin-builder__placement-title">Colocación en el circuito</p>

          {!hayExistentes ? (
            <p className="admin-input-hint" style={{ margin: 0 }}>
              Este será el <strong>primer componente</strong>; se colocará en el origen del canvas.
            </p>
          ) : (
            <div className="admin-builder__row">
              <FieldWrap label="Respecto a">
                <select
                  className="admin-select admin-select--sm"
                  value={refId}
                  onChange={(e) => setRefId(e.target.value)}
                >
                  <option value="">— Origen (sin referencia) —</option>
                  {existentesOrdenados.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} ({c.value || labelForTipo(c.type)})
                    </option>
                  ))}
                </select>
              </FieldWrap>

              <FieldWrap label="Dirección">
                <select
                  className="admin-select admin-select--sm"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  disabled={!refId}
                >
                  {Object.values(DIRECCIONES).map((d) => (
                    <option key={d} value={d}>{etiquetaDireccion(d)}</option>
                  ))}
                </select>
              </FieldWrap>
            </div>
          )}
        </div>
      )}

      {/* Campo de valor: solo para tipos con valor numerico */}
      {requiereValor && (
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

      {/* Nodos */}
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
          onParamsBulkChange={handleParamsBulkChange}
          value={value}
        />
      )}

      <div className="admin-builder__btn-row">
        <button
          type="button"
          className="admin-btn admin-btn--primary admin-btn--sm"
          onClick={handleAgregarOActualizar}
          disabled={!puedeAgregar}
        >
          {isEditing ? '💾 Guardar cambios' : '+ Agregar componente'}
        </button>
        <button
          type="button"
          className="admin-btn admin-btn--cancel admin-btn--sm"
          onClick={handleLimpiar}
        >
          {isEditing ? 'Cancelar edición' : 'Limpiar'}
        </button>
      </div>

      {!isEditing && tipo && hayExistentes && (
        <p className="admin-input-hint" style={{ marginTop: 6 }}>
          Tip: al agregar, podrás <strong>moverlo</strong> con las flechas en la lista o
          hacer clic en él en el preview para <strong>editar</strong> sus propiedades.
        </p>
      )}
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

export function normalizarComponente(comp) {
  if (typeof comp.toAdminJSON === 'function') return comp.toAdminJSON();
  if (comp.nodos && typeof comp.nodos === 'object') return comp;
  if ('nodo_a' in comp || 'nodo_b' in comp) {
    return { ...comp, nodos: { a: comp.nodo_a ?? '', b: comp.nodo_b ?? '' } };
  }
  return { ...comp, nodos: nodosVaciosPara(comp.type) };
}