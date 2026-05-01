import { SelectorBandasColor } from './SelectorBandasColor';

/**
 * RecuadroParametros — Recuadro agrupador de parametros adicionales.
 * Renderiza dinasmicamente los campos correspondientes a cada tipo/subtipo de componente.s

 * @param {{
 *   tipo: string,
 *   params: object,
 *   onChange: (campo: string, valor: any) => void,
 *   onBandasChange?: (bandas: object) => void,
 *   onValueChange?: (v: string) => void,
 *   value?: string,
 * }} props
 */
export function RecuadroParametros({ tipo, params = {}, onChange, onBandasChange, onValueChange, value }) {
  if (!tipo) return null;

  const p = params;
  const set = (campo, val) => onChange(campo, val);

  return (
    <div style={box}>
      <p style={boxTitle}>Parámetros de {tipo.replace(/_/g, ' ')}</p>

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
            <select value={p.potencia_nominal ?? '0.25'} onChange={(e) => set('potencia_nominal', e.target.value)} style={selectSt}>
              {['0.13', '0.25', '0.50', '1.00', '2.00'].map((v) => (
                <option key={v} value={v}>{v} W</option>
              ))}
            </select>
          </Field>
          <Field label="¿Resistencia variable?">
            <Toggle
              value={p.isResistenciaVariable ?? 0}
              onChange={(v) => set('isResistenciaVariable', v)}
            />
          </Field>
        </>
      )}

      {(tipo === 'fuente_voltaje' || tipo === 'fuente_corriente') && (
        <FuenteParams tipo={tipo} p={p} set={set} />
      )}

      {tipo === 'diodo' && <DiodoParams p={p} set={set} />}

      {tipo === 'capacitor' && <CapacitorParams p={p} set={set} />}

      {tipo === 'bobina' && <BobinaParams p={p} set={set} />}

      {tipo === 'transistor_bjt' && <BJTParams p={p} set={set} />}

      {tipo === 'transistor_fet' && <FETParams p={p} set={set} />}

      {tipo === 'regulador_voltaje' && <ReguladorParams p={p} set={set} />}

      {tipo === 'resistencia_variable' && (
        <>
          <SelectorBandasColor
            banda_uno={p.banda_uno ?? 'Marrón'}
            banda_dos={p.banda_dos ?? 'Negro'}
            banda_tres={p.banda_tres ?? 'Rojo'}
            banda_tolerancia={p.banda_tolerancia ?? 'Dorado'}
            value={value ?? ''}
            onBandasChange={onBandasChange}
            onValueChange={onValueChange}
          />
          <Field label="Potencia nominal">
            <select value={p.potencia_nominal ?? '0.25'} onChange={(e) => set('potencia_nominal', e.target.value)} style={selectSt}>
              {['0.13', '0.25', '0.50', '1.00', '2.00'].map((v) => (
                <option key={v} value={v}>{v} W</option>
              ))}
            </select>
          </Field>
          <NumField label="Posición del cursor (0–100%)" campo="cursor_pos" p={p} set={set} min={0} max={100} step={1} />
        </>
      )}
    </div>
  );
}

/* ── Sub-secciones por tipo ───────────────────────── */

function FuenteParams({ tipo, p, set }) {
  const isDC = (p.dcOrAc ?? 'dc') === 'dc';
  return (
    <>
      <Field label="Estado">
        <Toggle value={p.activo ?? 1} onChange={(v) => set('activo', v)} labelOn="Activa" labelOff="Inactiva" />
      </Field>
      <Field label="Tipo de señal (dcOrAc)">
        <select value={p.dcOrAc ?? 'dc'} onChange={(e) => set('dcOrAc', e.target.value)} style={selectSt}>
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
      {!isDC && (
        <>
          <NumField label="Fase (°)" campo="phase" p={p} set={set} min={0} max={360} step={1} />
          <NumField label="Frecuencia (Hz)" campo="frequency" p={p} set={set} min={0.01} max={1e9} step={1} />
        </>
      )}
    </>
  );
}

function DiodoParams({ p, set }) {
  const tipo = p.tipo ?? 'Rectificador';
  const esZener = tipo === 'Zener';
  return (
    <>
      <Field label="Subtipo (tipo)">
        <select value={tipo} onChange={(e) => set('tipo', e.target.value)} style={selectSt}>
          {['Señal', 'Schottky', 'Rectificador', 'Zener', 'LED', 'LED_Ultrabrillante', 'LED_IR'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </Field>
      <NumField label="Corriente máx (A)" campo="corriente_max" p={p} set={set} min={0.001} max={400} step={0.001} />
      <NumField label="Voltaje inverso máx (V)" campo="voltaje_inv_max" p={p} set={set} min={0.01} max={6000} step={0.01} />
      <NumField label="Caída de tensión (V)" campo="caida_tension" p={p} set={set} min={0.1} max={3.5} step={0.01} />
      {esZener && (
        <NumField label="Resistencia Zener rz (Ω)" campo="rz" p={p} set={set} min={0} max={200} step={0.1} />
      )}
      <Field label="Is saturación (A)">
        <select value={p.is_saturacion ?? '1e-14'} onChange={(e) => set('is_saturacion', e.target.value)} style={selectSt}>
          {['1e-18','1e-16','1e-14','1e-12','1e-10','1e-8','1e-6'].map((v) => (
            <option key={v} value={v}>{v} A</option>
          ))}
        </select>
      </Field>
    </>
  );
}

function CapacitorParams({ p, set }) {
  return (
    <>
      <Field label="Tipo dieléctrico (tipo_dioelectrico)">
        <select value={p.tipo_dioelectrico ?? 'Cerámico'} onChange={(e) => set('tipo_dioelectrico', e.target.value)} style={selectSt}>
          {['Cerámico', 'Electrolítico', 'Tantalio'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </Field>
      <NumField label="Voltaje nominal (V)" campo="voltaje" p={p} set={set} min={1} max={1000} step={1} />
      <Field label="Polaridad">
        <Toggle
          value={p.polaridad ?? 0}
          onChange={(v) => set('polaridad', v)}
          labelOn="Polarizado"
          labelOff="No polarizado"
        />
      </Field>
    </>
  );
}

function BobinaParams({ p, set }) {
  return (
    <>
      <NumField label="Corriente máxima (A)" campo="corriente_max" p={p} set={set} min={0.001} max={100} step={0.001} />
      <NumField label="Resistencia DC (Ω)" campo="resistencia_dc" p={p} set={set} min={0} max={10000} step={0.001} />
    </>
  );
}

function BJTParams({ p, set }) {
  return (
    <>
      <Field label="Tipo (tipo)">
        <select value={p.tipo ?? 'NPN'} onChange={(e) => set('tipo', e.target.value)} style={selectSt}>
          <option value="NPN">NPN</option>
          <option value="PNP">PNP</option>
        </select>
      </Field>
      <Field label="Configuración">
        <input type="text" value={p.configuracion ?? ''} onChange={(e) => set('configuracion', e.target.value)} style={inputSt} placeholder="ej. Uso General" />
      </Field>
      <NumField label="Beta (β)" campo="beta" p={p} set={set} min={1} max={1000} step={1} />
      <NumField label="Vbe saturación (V)" campo="vbe_saturacion" p={p} set={set} min={0.1} max={2} step={0.001} />
      <NumField label="Vce saturación (V)" campo="vce_saturacion" p={p} set={set} min={0.05} max={2} step={0.001} />
      <NumField label="Corriente colector máx (A)" campo="corriente_colector_max" p={p} set={set} min={0.001} max={100} step={0.001} />
      <NumField label="Potencia máxima (W)" campo="potencia_maxima" p={p} set={set} min={0.01} max={300} step={0.01} />
      <NumField label="Frecuencia transición (MHz)" campo="frecuencia_transicion" p={p} set={set} min={0.1} max={10000} step={0.1} />
      <Field label="Modo de operación">
        <input type="text" value={p.modo_operacion ?? ''} onChange={(e) => set('modo_operacion', e.target.value)} style={inputSt} placeholder="ej. Amplificador/Interruptor" />
      </Field>
    </>
  );
}

function FETParams({ p, set }) {
  return (
    <>
      <Field label="Tipo (tipo)">
        <select value={p.tipo ?? 'MOSFET_N'} onChange={(e) => set('tipo', e.target.value)} style={selectSt}>
          {['JFET_N', 'JFET_P', 'MOSFET_N', 'MOSFET_P'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </Field>
      <NumField label="Idss (A)" campo="idss" p={p} set={set} min={1e-6} max={100} step={0.001} />
      <NumField label="Vp — Pinch-off (V)" campo="vp" p={p} set={set} min={-20} max={20} step={0.001} />
      <NumField label="gm — Transconductancia (S)" campo="gm" p={p} set={set} min={1e-6} max={100} step={0.001} />
      <NumField label="Rd — Resistencia drenaje (Ω)" campo="rd" p={p} set={set} min={0.001} max={1e9} step={0.001} />
      <Field label="Configuración">
        <input type="text" value={p.configuracion ?? ''} onChange={(e) => set('configuracion', e.target.value)} style={inputSt} placeholder="ej. Señal, Potencia" />
      </Field>
      <Field label="Modo de operación">
        <input type="text" value={p.modo_operacion ?? ''} onChange={(e) => set('modo_operacion', e.target.value)} style={inputSt} placeholder="ej. Amplificador Lineal" />
      </Field>
    </>
  );
}

function ReguladorParams({ p, set }) {
  return (
    <>
      <Field label="Tipo (tipo)">
        <select value={p.tipo ?? 'Lineal Fijo'} onChange={(e) => set('tipo', e.target.value)} style={selectSt}>
          <option value="Lineal Fijo">Lineal Fijo</option>
          <option value="Lineal Ajustable">Lineal Ajustable</option>
        </select>
      </Field>
      <NumField label="Voltaje salida (V)" campo="voltaje_salida" p={p} set={set} min={-40} max={40} step={0.001} />
      <NumField label="Corriente máxima (A)" campo="corriente_maxima" p={p} set={set} min={0.001} max={10} step={0.001} />
      <NumField label="Voltaje entrada mínimo (V)" campo="voltaje_entrada_min" p={p} set={set} min={-50} max={50} step={0.001} />
      <NumField label="Voltaje entrada máximo (V)" campo="voltaje_entrada_max" p={p} set={set} min={-50} max={50} step={0.001} />
      <NumField label="Dropout voltage (V)" campo="dropout_voltage" p={p} set={set} min={0} max={10} step={0.001} />
      <NumField label="Disipación máxima (W)" campo="disipacion_maxima" p={p} set={set} min={0} max={100} step={0.001} />
      <NumField label="Tolerancia (%)" campo="tolerancia" p={p} set={set} min={0} max={10} step={0.01} />
    </>
  );
}

/* ── Helpers de UI ────────────────────────────────── */

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={labelSt}>{label}</label>
      {children}
    </div>
  );
}

function NumField({ label, campo, p, set, min, max, step }) {
  return (
    <Field label={label}>
      <input
        type="number"
        value={p[campo] ?? ''}
        onChange={(e) => set(campo, e.target.value)}
        min={min} max={max} step={step}
        style={inputSt}
      />
    </Field>
  );
}

function Toggle({ value, onChange, labelOn = 'Sí', labelOff = 'No' }) {
  const active = Boolean(value);
  return (
    <button
      type="button"
      onClick={() => onChange(active ? 0 : 1)}
      style={{
        padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
        border: 'none',
        background: active ? 'var(--success)' : 'var(--border)',
        color: active ? '#000' : 'var(--text-muted)',
        fontWeight: 500,
      }}
    >
      {active ? labelOn : labelOff}
    </button>
  );
}

/* ── Estilos ──────────────────────────────────────── */
const box      = { border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '14px 12px', marginTop: 10 };
const boxTitle = { fontSize: 11, color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 };
const labelSt  = { display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 };
const selectSt = { width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--text)', fontSize: 12, padding: '6px 8px', outline: 'none' };
const inputSt  = { width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--text)', fontSize: 12, padding: '6px 8px', outline: 'none' };
