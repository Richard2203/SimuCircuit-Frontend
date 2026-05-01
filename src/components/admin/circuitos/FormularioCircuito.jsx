import { useState, useEffect, useRef } from 'react';
import { ConstructorNetlist }       from './ConstructorNetlist';
import { ListaComponentesAgrupada } from './FilaComponente';
import { PreviewSVG }               from './PreviewSVG';
import { circuitosAdminService }    from '../../../services/admin/circuitosAdminService';

const DIFICULTADES = ['Básico', 'Intermedio', 'Avanzado'];

/** Validaciones antes de guardar */
function validarCircuito(meta, componentes) {
  const errores = [];

  // 1. Metadatos completos
  if (!meta.nombre_circuito?.trim())   errores.push('El nombre del circuito es obligatorio.');
  if (!meta.descripcion?.trim())       errores.push('La descripción es obligatoria.');
  if (!meta.dificultad)                errores.push('Selecciona una dificultad.');
  if (!meta.materia)                   errores.push('Selecciona una materia.');
  if (!meta.unidad_tematica)           errores.push('Selecciona una unidad temática.');
  if (!meta.tema?.trim())              errores.push('El tema es obligatorio.');

  // 2. Al menos un componente
  if (componentes.length === 0) errores.push('Agrega al menos un componente a la netlist.');

  // 3. Nodo tierra presente
  const todosNodos = new Set(componentes.flatMap((c) => [c.nodo_a, c.nodo_b].filter(Boolean)));
  if (!todosNodos.has('0')) errores.push('El nodo de referencia (tierra, nodo "0") debe estar presente en la netlist.');

  // 4. Nodos flotantes (nodo conectado a un solo componente)
  const nodoCount = {};
  componentes.forEach((c) => {
    [c.nodo_a, c.nodo_b].filter(Boolean).forEach((n) => {
      nodoCount[n] = (nodoCount[n] ?? 0) + 1;
    });
  });
  const flotantes = Object.entries(nodoCount).filter(([, v]) => v < 2).map(([n]) => n);
  if (flotantes.length > 0) errores.push(`Nodos flotantes detectados (conectados a un solo componente): ${flotantes.join(', ')}. Todo nodo debe tener al menos 2 conexiones.`);

  return errores;
}

/**
 * FormularioCircuito — Vista de creacion/edicion con layout de dos paneles.
 * Panel izquierdo: formulario scrolleable.
 * Panel derecho: PreviewSVG fijo (sticky).
 *
 * @param {{
 *   modo: 'crear' | 'editar',
 *   circuitoInicial?: object,
 *   netlistInicial?: Array,
 *   onGuardar: () => void,
 *   onCancelar: () => void,
 * }} props
 */
export function FormularioCircuito({ modo = 'crear', circuitoInicial, netlistInicial = [], onGuardar, onCancelar }) {
  const [catalogos, setCatalogos] = useState({ materias: [], unidades_tematicas: {}, temas: [], categorias: [] });
  const [meta, setMeta] = useState({
    nombre_circuito:  circuitoInicial?.nombre_circuito ?? '',
    descripcion:      circuitoInicial?.descripcion ?? '',
    dificultad:       circuitoInicial?.dificultad ?? '',
    materia:          circuitoInicial?.materia ?? '',
    unidad_tematica:  circuitoInicial?.unidad_tematica ?? '',
    tema:             circuitoInicial?.tema ?? '',
    categorias:       circuitoInicial?.categorias ?? [],
  });
  const [componentes,  setComponentes]  = useState(netlistInicial);
  const [hoveredId,    setHoveredId]    = useState(null);
  const [errores,      setErrores]      = useState([]);
  const [guardando,    setGuardando]    = useState(false);
  const [okMsg,        setOkMsg]        = useState('');

  const previewRef = useRef(null);

  useEffect(() => {
    circuitosAdminService.obtenerCatalogos().then(setCatalogos).catch(console.error);
  }, []);

  const setField = (campo, val) => setMeta((m) => ({ ...m, [campo]: val }));

  const unidadesDisponibles = meta.materia
    ? (catalogos.unidades_tematicas[meta.materia] ?? [])
    : [];

  // tipos_componentes se genera automaticamente
  const tiposComponentes = [...new Set(componentes.map((c) => c.type))];

  function handleAgregarComp(comp) {
    setComponentes((cs) => [...cs, comp]);
  }

  function handleEliminarComp(id) {
    setComponentes((cs) => cs.filter((c) => c.id !== id));
  }

  function toggleCategoria(cat) {
    setMeta((m) => {
      const cats = m.categorias.includes(cat)
        ? m.categorias.filter((c) => c !== cat)
        : [...m.categorias, cat];
      return { ...m, categorias: cats };
    });
  }

  async function handleGuardar() {
    const errs = validarCircuito(meta, componentes);
    setErrores(errs);
    if (errs.length > 0) return;

    setGuardando(true);
    setOkMsg('');
    try {
      // Serializar el SVG del preview como miniatura
      const svgEl  = previewRef.current?.querySelector('svg');
      const svgStr = svgEl ? new XMLSerializer().serializeToString(svgEl) : '<svg/>';

      const payload = {
        circuito: { ...meta, tipos_componentes: tiposComponentes },
        netlist:  componentes,
        miniatura_svg: svgStr,
      };

      if (modo === 'editar' && circuitoInicial?.id) {
        await circuitosAdminService.editarCircuito({ id: circuitoInicial.id, ...payload });
      } else {
        await circuitosAdminService.crearCircuito(payload);
      }

      setOkMsg(modo === 'editar' ? 'Circuito actualizado.' : 'Circuito creado exitosamente.');
      onGuardar?.();
    } catch (e) {
      setErrores([e?.message ?? 'Error al guardar. Intenta de nuevo.']);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div style={twoPanel}>

      {/* ─── Panel izquierdo: formulario ─── */}
      <div style={leftPanel}>

        {/* Header */}
        <div style={formHeader}>
          <h2 style={formTitle}>{modo === 'editar' ? 'Editar circuito' : 'Nuevo circuito'}</h2>
          <button type="button" onClick={onCancelar} style={btnCancel}>Cancelar</button>
        </div>

        {/* ── Bloque 1: Metadatos ── */}
        <section style={sectionBox}>
          <p style={sectionTitle}>Metadatos del circuito</p>

          <Field label="nombre_circuito">
            <input type="text" value={meta.nombre_circuito} onChange={(e) => setField('nombre_circuito', e.target.value)} style={inputSt} placeholder="Nombre del circuito" />
          </Field>

          <Field label="descripcion">
            <textarea value={meta.descripcion} onChange={(e) => setField('descripcion', e.target.value)} rows={3} style={{ ...inputSt, resize: 'vertical' }} placeholder="Descripción del circuito" />
          </Field>

          <div style={twoCol}>
            <Field label="dificultad">
              <select value={meta.dificultad} onChange={(e) => setField('dificultad', e.target.value)} style={selectSt}>
                <option value="">— Seleccionar —</option>
                {DIFICULTADES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>

            <Field label="materia">
              <select value={meta.materia} onChange={(e) => { setField('materia', e.target.value); setField('unidad_tematica', ''); }} style={selectSt}>
                <option value="">— Seleccionar —</option>
                {catalogos.materias.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
          </div>

          <Field label="unidad_tematica">
            <select value={meta.unidad_tematica} onChange={(e) => setField('unidad_tematica', e.target.value)} style={selectSt} disabled={!meta.materia}>
              <option value="">— Seleccionar materia primero —</option>
              {unidadesDisponibles.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </Field>

          <Field label="tema">
            <textarea value={meta.tema} onChange={(e) => setField('tema', e.target.value)} rows={2} style={{ ...inputSt, resize: 'vertical' }} placeholder="ej: 1. Ley de Ohm&#10;2. Divisor de Voltaje" />
          </Field>

          {/* categorias — chips seleccionables */}
          <Field label="categorias">
            <div style={chipContainer}>
              {catalogos.categorias.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategoria(cat)}
                  style={{
                    ...chip,
                    background: meta.categorias.includes(cat) ? 'rgba(108,99,255,0.25)' : 'var(--bg-elevated)',
                    borderColor: meta.categorias.includes(cat) ? 'var(--accent)' : 'var(--border)',
                    color:       meta.categorias.includes(cat) ? 'var(--accent-soft)' : 'var(--text-muted)',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </Field>

          {/* tipos_componentes: solo lectura, generado automaticamente */}
          <Field label="tipos_componentes (generado automáticamente)">
            <div style={chipContainer}>
              {tiposComponentes.length === 0
                ? <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>Se generará al agregar componentes</span>
                : tiposComponentes.map((t) => (
                    <span key={t} style={{ ...chip, background: 'rgba(74,222,128,0.1)', borderColor: 'rgba(74,222,128,0.3)', color: 'var(--success)', cursor: 'default' }}>{t}</span>
                  ))
              }
            </div>
          </Field>
        </section>

        {/* ── Bloque 2: Constructor de netlist ── */}
        <section style={sectionBox}>
          <p style={sectionTitle}>Netlist — Componentes del circuito</p>

          <ConstructorNetlist componentes={componentes} onAgregar={handleAgregarComp} />

          {componentes.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>Componentes agregados</p>
              <ListaComponentesAgrupada
                componentes={componentes}
                hoveredId={hoveredId}
                onHover={setHoveredId}
                onEliminar={handleEliminarComp}
              />
            </div>
          )}
        </section>

        {/* ── Errores y guardar ── */}
        {errores.length > 0 && (
          <div style={errorBox}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--danger)', marginBottom: 8 }}>⚠ No se puede guardar. Corrija los siguientes errores:</p>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {errores.map((e, i) => (
                <li key={i} style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 4 }}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {okMsg && (
          <div style={successBox}><p style={{ fontSize: 13, color: 'var(--success)' }}>✓ {okMsg}</p></div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button type="button" onClick={onCancelar} style={btnCancelSm}>Cancelar</button>
          <button type="button" onClick={handleGuardar} disabled={guardando} style={{ ...btnPrimary, opacity: guardando ? 0.6 : 1 }}>
            {guardando ? 'Guardando…' : (modo === 'editar' ? 'Guardar cambios' : 'Crear circuito')}
          </button>
        </div>
      </div>

      {/* ─── Panel derecho: preview fijo ─── */}
      <div style={rightPanel} ref={previewRef}>
        <PreviewSVG
          componentes={componentes}
          hoveredId={hoveredId}
          onHoverComp={setHoveredId}
        />
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={labelSt}>{label}</label>
      {children}
    </div>
  );
}

/* ── Responsive ──────────────────────────────────
   > 1000px : dos columnas 50/50
   768-1000  : 55/45
   < 768     : columna única, preview arriba
*/
const twoPanel = {
  display: 'flex',
  gap: 0,
  minHeight: 'calc(100vh - 140px)',
  '@media (max-width: 767px)': { flexDirection: 'column' },
};

const leftPanel = {
  flex: '0 0 50%',
  overflowY: 'auto',
  padding: '20px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  borderRight: '1px solid var(--border)',
};

const rightPanel = {
  flex: '0 0 50%',
  position: 'sticky',
  top: 0,
  alignSelf: 'flex-start',
  height: 'calc(100vh - 140px)',
  overflowY: 'hidden',
  padding: '20px 20px',
  display: 'flex',
  flexDirection: 'column',
};

// Inline responsive styles via JS (CSS Variables approach)
const responsiveStyle = `
@media (max-width: 999px) and (min-width: 768px) {
  .admin-left-panel  { flex: 0 0 55% !important; }
  .admin-right-panel { flex: 0 0 45% !important; }
}
@media (max-width: 767px) {
  .admin-two-panel   { flex-direction: column !important; }
  .admin-right-panel { position: relative !important; height: 250px !important; top: auto !important; border-right: none !important; border-bottom: 1px solid var(--border); }
  .admin-left-panel  { flex: 1 !important; border-right: none !important; }
}
@media (max-width: 479px) {
  .admin-right-panel { height: 180px !important; }
}
`;

const formHeader   = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 };
const formTitle    = { fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: 0 };
const sectionBox   = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '18px 20px' };
const sectionTitle = { fontSize: 12, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 };
const twoCol       = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };
const labelSt      = { display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 };
const inputSt      = { width: '100%', padding: '8px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text)', fontSize: 13, outline: 'none' };
const selectSt     = { width: '100%', padding: '8px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text)', fontSize: 13, outline: 'none' };
const chipContainer = { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 };
const chip          = { padding: '3px 10px', borderRadius: 20, fontSize: 11, border: '1px solid', cursor: 'pointer', fontWeight: 500, transition: 'all .15s' };
const errorBox      = { background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 'var(--r-md)', padding: '12px 16px' };
const successBox    = { background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 'var(--r-md)', padding: '10px 16px' };
const btnPrimary    = { padding: '10px 24px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const btnCancel     = { padding: '7px 14px', background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 12, cursor: 'pointer' };
const btnCancelSm   = { padding: '10px 18px', background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 13, cursor: 'pointer' };
