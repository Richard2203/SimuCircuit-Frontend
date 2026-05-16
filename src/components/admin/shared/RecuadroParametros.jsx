import { SelectorBandasColor } from './SelectorBandasColor';
import {
  MODELOS_BJT,
  MODELOS_FET,
  MODELOS_REGULADOR,
  MODELOS_DIODO,
  MODELOS_LED,
  paramsDeModelo,
} from '../circuitos/modelosCatalog';

/**
 * RecuadroParametros — Recuadro de parametros adicionales por tipo de componente.
 * Props:
 *  @param {{
 *   tipo: string,
 *   params: object,
 *   onChange: (campo: string, valor: any) => void,
 *   onBandasChange?: (bandas: object) => void,
 *   onValueChange?: (v: string) => void,
 *   onParamsBulkChange?: (params: object) => void,
 *   value?: string,
 * }} props
 */
export function RecuadroParametros({
  tipo,
  params = {},
  onChange,
  onBandasChange,
  onValueChange,
  onParamsBulkChange,
  value,
}) {
  if (!tipo) return null;

  const p = params;
  const set = (campo, val) => onChange(campo, val);

  return (
    <div className="admin-paramsbox">
      <p className="admin-paramsbox__title">Parámetros de {tipo.replace(/_/g, ' ')}</p>

      {tipo === 'resistencia' && (
        <>
          <SelectorBandasColor
            banda_uno={p.banda_uno ?? 'Marrón'}
            banda_dos={p.banda_dos ?? 'Negro'}
            banda_tres={p.banda_tres ?? 'Marrón'}
            banda_tolerancia={p.banda_tolerancia ?? 'Dorado'}
            value={value ?? ''}
            onBandasChange={onBandasChange}
            onValueChange={onValueChange}
          />
          <Field label="Potencia nominal">
            <select className="admin-select" value={p.potencia_nominal ?? '0.25'} onChange={(e) => set('potencia_nominal', e.target.value)}>
              {['0.13', '0.25', '0.50', '1.00', '2.00'].map((v) => <option key={v} value={v}>{v} W</option>)}
            </select>
          </Field>
        </>
      )}

      {tipo === 'resistencia_variable' && (
        <>
          <Field label="Valor nominal (Ω)">
            <input
              className="admin-input"
              type="text"
              value={value ?? ''}
              onChange={(e) => onValueChange?.(e.target.value)}
              placeholder="ej. 1k, 10k, 100k"
            />
          </Field>
          <Field label="Potencia nominal">
            <select className="admin-select" value={p.potencia_nominal ?? '0.25'} onChange={(e) => set('potencia_nominal', e.target.value)}>
              {['0.13', '0.25', '0.50', '1.00', '2.00'].map((v) => <option key={v} value={v}>{v} W</option>)}
            </select>
          </Field>
          <NumField label="Posición del cursor (0–100%)" campo="cursor_pos" p={p} set={set} min={0} max={100} step={1} />
        </>
      )}

      {(tipo === 'fuente_voltaje' || tipo === 'fuente_corriente') && (
        <FuenteParams tipo={tipo} p={p} set={set} />
      )}

      {tipo === 'diodo'             && <DiodoParams       p={p} set={set} value={value} onValueChange={onValueChange} onParamsBulkChange={onParamsBulkChange} />}
      {tipo === 'capacitor'         && <CapacitorParams   p={p} set={set} />}
      {tipo === 'bobina'            && <BobinaParams      p={p} set={set} />}
      {tipo === 'transistor_bjt'    && <BJTParams         p={p} set={set} value={value} onValueChange={onValueChange} onParamsBulkChange={onParamsBulkChange} />}
      {tipo === 'transistor_fet'    && <FETParams         p={p} set={set} value={value} onValueChange={onValueChange} onParamsBulkChange={onParamsBulkChange} />}
      {tipo === 'regulador_voltaje' && <ReguladorParams   p={p} set={set} value={value} onValueChange={onValueChange} onParamsBulkChange={onParamsBulkChange} />}
    </div>
  );
}

/* Fuentes */

function FuenteParams({ tipo, p, set }) {
  const isAC = (p.dcOrAc ?? 'dc') === 'ac';
  return (
    <>
      <Field label="Estado">
        <Toggle value={p.activo ?? 1} onChange={(v) => set('activo', v)} labelOn="Activa" labelOff="Inactiva" />
      </Field>

      <Field label="Tipo de señal (dcOrAc)">
        <select className="admin-select" value={p.dcOrAc ?? 'dc'} onChange={(e) => set('dcOrAc', e.target.value)}>
          <option value="dc">DC</option>
          <option value="ac">AC</option>
        </select>
      </Field>

      {tipo === 'fuente_voltaje' && (
        <NumField label="Corriente máxima (A)" campo="corriente_max" p={p} set={set} min={0.01} max={50} step={0.1} />
      )}
      {tipo === 'fuente_corriente' && (
        <NumField label="Voltaje máximo (V)" campo="voltaje_max" p={p} set={set} min={0.1} max={500} step={0.1} />
      )}

      {isAC && (
        <>
          <NumField label="Fase (°)" campo="phase" p={p} set={set} min={0} max={360} step={1} />
          <NumField label="Frecuencia (Hz)" campo="frequency" p={p} set={set} min={0.01} max={1e9} step={1} />
        </>
      )}
    </>
  );
}

/* Diodo: combina rectificadores+zener (readonly) con LEDs (editables) */

function DiodoParams({ p, set, value, onValueChange, onParamsBulkChange }) {
  const esLED = MODELOS_LED.some((m) => m.value === value);
  const esNoLEDConModelo = MODELOS_DIODO.some((m) => m.value === value);
  const todosModelos = [...MODELOS_DIODO, ...MODELOS_LED];

  function handleModeloChange(nuevoValue) {
    onValueChange?.(nuevoValue);
    const ps = paramsDeModelo(todosModelos, nuevoValue);
    if (ps && onParamsBulkChange) onParamsBulkChange(ps);
  }

  return (
    <>
      <Field label="Modelo del diodo">
        <select className="admin-select" value={value ?? ''} onChange={(e) => handleModeloChange(e.target.value)}>
          <option value="">— Seleccionar modelo —</option>
          <optgroup label="Rectificadores y Zener (valores fijos)">
            {MODELOS_DIODO.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </optgroup>
          <optgroup label="LEDs (valores editables)">
            {MODELOS_LED.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </optgroup>
        </select>
      </Field>

      {value && (
        <p className="admin-input-hint">
          Subtipo: <strong>{p.tipo ?? '—'}</strong>
        </p>
      )}

      {/* Rectificador / Zener: TODO readonly */}
      {esNoLEDConModelo && (
        <>
          <ReadField label="Corriente máx (A)" value={p.corriente_max} />
          <ReadField label="Voltaje inverso máx (V)" value={p.voltaje_inv_max} />
          <ReadField label="Caída de tensión Vf (V)" value={p.caida_tension} />
          <ReadField label="Resistencia Zener rz (Ω)" value={p.rz} />
          <ReadField label="Is saturación (A)" value={p.is_saturacion} />
          <p className="admin-input-hint" style={{ marginTop: 4 }}>
            ℹ Los valores eléctricos del modelo seleccionado son de catálogo y no se modifican.
          </p>
        </>
      )}

      {/* LED: editable */}
      {esLED && (
        <>
          <NumField label="Corriente máx (A)"       campo="corriente_max"   p={p} set={set} min={0.001} max={1}    step={0.001} />
          <NumField label="Voltaje inverso máx (V)" campo="voltaje_inv_max" p={p} set={set} min={0.01}  max={50}   step={0.01} />
          <NumField label="Caída de tensión Vf (V)" campo="caida_tension"   p={p} set={set} min={0.1}   max={5}    step={0.01} />
          <Field label="Is saturación (A)">
            <select className="admin-select" value={p.is_saturacion ?? '1e-14'} onChange={(e) => set('is_saturacion', e.target.value)}>
              {['1e-18', '1e-16', '1e-14', '1e-12', '1e-10', '1e-8', '1e-6'].map((v) => <option key={v} value={v}>{v} A</option>)}
            </select>
          </Field>
          <p className="admin-input-hint" style={{ marginTop: 4 }}>
            ℹ LEDs: los valores del modelo se cargan al seleccionar, pero puedes ajustarlos si tu hoja de datos difiere.
          </p>
        </>
      )}
    </>
  );
}

/* Capacitor / Bobina */

function CapacitorParams({ p, set }) {
  return (
    <>
      <Field label="Tipo dieléctrico (tipo_dioelectrico)">
        <select className="admin-select" value={p.tipo_dioelectrico ?? 'Cerámico'} onChange={(e) => set('tipo_dioelectrico', e.target.value)}>
          {['Cerámico', 'Electrolítico', 'Tantalio', 'Mica', 'Poliéster', 'Polipropileno'].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>
      <NumField label="Voltaje nominal (V)" campo="voltaje" p={p} set={set} min={1} max={1000} step={1} />
      <Field label="Polaridad">
        <Toggle value={p.polaridad ?? 0} onChange={(v) => set('polaridad', v)} labelOn="Polarizado" labelOff="No polarizado" />
      </Field>
    </>
  );
}

function BobinaParams({ p, set }) {
  return (
    <>
      <NumField label="Corriente máxima (A)" campo="corriente_max"  p={p} set={set} min={0.001} max={100}   step={0.001} />
      <NumField label="Resistencia DC (Ω)"   campo="resistencia_dc" p={p} set={set} min={0}     max={10000} step={0.001} />
    </>
  );
}

/* BJT — modelo del catalogo autocompleta TODO readonly */

function BJTParams({ p, set, value, onValueChange, onParamsBulkChange }) {
  const hayModelo = !!value;

  function handleModeloChange(nuevoValue) {
    onValueChange?.(nuevoValue);
    const ps = paramsDeModelo(MODELOS_BJT, nuevoValue);
    if (ps && onParamsBulkChange) onParamsBulkChange(ps);
  }

  return (
    <>
      <Field label="Modelo del transistor BJT">
        <select className="admin-select" value={value ?? ''} onChange={(e) => handleModeloChange(e.target.value)}>
          <option value="">— Seleccionar modelo —</option>
          {MODELOS_BJT.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </Field>

      {hayModelo && (
        <>
          <ReadField label="Polaridad" value={p.tipo} />
          <ReadField label="Configuración" value={p.configuracion} />
          <ReadField label="β (beta)" value={p.beta} />
          <ReadField label="Vbe saturación (V)" value={p.vbe_saturacion} />
          <ReadField label="Vce saturación (V)" value={p.vce_saturacion} />
          <ReadField label="Corriente colector máx (A)" value={p.corriente_colector_max} />
          <ReadField label="Potencia máxima (W)" value={p.potencia_maxima} />
          <ReadField label="Frecuencia transición (MHz)" value={p.frecuencia_transicion} />
          <ReadField label="Modo de operación" value={p.modo_operacion} />
          <p className="admin-input-hint" style={{ marginTop: 4 }}>
            ℹ Los valores corresponden al modelo seleccionado y no son editables.
          </p>
        </>
      )}
    </>
  );
}

/* FET — idem BJT */

function FETParams({ p, set, value, onValueChange, onParamsBulkChange }) {
  const hayModelo = !!value;

  function handleModeloChange(nuevoValue) {
    onValueChange?.(nuevoValue);
    const ps = paramsDeModelo(MODELOS_FET, nuevoValue);
    if (ps && onParamsBulkChange) onParamsBulkChange(ps);
  }

  return (
    <>
      <Field label="Modelo del transistor FET">
        <select className="admin-select" value={value ?? ''} onChange={(e) => handleModeloChange(e.target.value)}>
          <option value="">— Seleccionar modelo —</option>
          {MODELOS_FET.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </Field>

      {hayModelo && (
        <>
          <ReadField label="Tipo" value={p.tipo} />
          <ReadField label="Idss (A)" value={p.idss} />
          <ReadField label="Vp — Pinch-off (V)" value={p.vp} />
          <ReadField label="gm — Transconductancia (S)" value={p.gm} />
          <ReadField label="Rd — Resistencia drenaje (Ω)" value={p.rd} />
          <ReadField label="Configuración" value={p.configuracion} />
          <ReadField label="Modo de operación" value={p.modo_operacion} />
          <p className="admin-input-hint" style={{ marginTop: 4 }}>
            ℹ Los valores corresponden al modelo seleccionado y no son editables.
          </p>
        </>
      )}
    </>
  );
}

/* Regulador — idem */

function ReguladorParams({ p, set, value, onValueChange, onParamsBulkChange }) {
  const hayModelo = !!value;

  function handleModeloChange(nuevoValue) {
    onValueChange?.(nuevoValue);
    const ps = paramsDeModelo(MODELOS_REGULADOR, nuevoValue);
    if (ps && onParamsBulkChange) onParamsBulkChange(ps);
  }

  return (
    <>
      <Field label="Modelo del regulador">
        <select className="admin-select" value={value ?? ''} onChange={(e) => handleModeloChange(e.target.value)}>
          <option value="">— Seleccionar modelo —</option>
          {MODELOS_REGULADOR.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </Field>

      {hayModelo && (
        <>
          <ReadField label="Tipo" value={p.tipo} />
          <ReadField label="Voltaje salida (V)" value={p.voltaje_salida} />
          <ReadField label="Corriente máxima (A)" value={p.corriente_maxima} />
          <ReadField label="Voltaje entrada mínimo (V)" value={p.voltaje_entrada_min} />
          <ReadField label="Voltaje entrada máximo (V)" value={p.voltaje_entrada_max} />
          <ReadField label="Dropout voltage (V)" value={p.dropout_voltage} />
          <ReadField label="Disipación máxima (W)" value={p.disipacion_maxima} />
          <ReadField label="Tolerancia (%)" value={p.tolerancia} />
          <p className="admin-input-hint" style={{ marginTop: 4 }}>
            ℹ Los valores corresponden al modelo seleccionado y no son editables.
          </p>
        </>
      )}
    </>
  );
}

/* Helpers UI */

function Field({ label, children }) {
  return (
    <div className="admin-field">
      <label className="admin-form-label admin-form-label--sm">{label}</label>
      {children}
    </div>
  );
}

function NumField({ label, campo, p, set, min, max, step }) {
  return (
    <Field label={label}>
      <input
        className="admin-input"
        type="number"
        value={p[campo] ?? ''}
        onChange={(e) => set(campo, e.target.value)}
        min={min} max={max} step={step}
      />
    </Field>
  );
}

/**
 * Campo "solo lectura" para mostrar el valor de un modelo seleccionado.
 */
function ReadField({ label, value }) {
  return (
    <Field label={label}>
      <input
        className="admin-input admin-input--readonly"
        type="text"
        value={value ?? '—'}
        readOnly
      />
    </Field>
  );
}

function Toggle({ value, onChange, labelOn = 'Sí', labelOff = 'No' }) {
  const active = Boolean(value);
  return (
    <button
      type="button"
      className={`admin-toggle ${active ? 'admin-toggle--active' : ''}`}
      onClick={() => onChange(active ? 0 : 1)}
    >
      {active ? labelOn : labelOff}
    </button>
  );
}