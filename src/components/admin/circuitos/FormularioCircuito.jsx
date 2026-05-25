import { useState, useMemo, useRef } from 'react';
import { ConstructorNetlist }       from './ConstructorNetlist';
import { ListaComponentesAgrupada } from './FilaComponente';
import { PreviewSVG }               from './PreviewSVG';
import { circuitosAdminService }    from '../../../services/admin/circuitosAdminService';
import { useCatalogoComponentes }   from './CatalogoComponentesContext';
import { Circuit, ComponentFactory } from '../../../domain';
import {
  colocarRelativoA,
  posicionDeOrigen,
  nudgePos,
  componenteConPosicion,
  rotarComponente,
} from './Circuitlayout';

const DIFICULTADES_DEFAULT = ['Básico', 'Intermedio', 'Avanzado'];

/**
 * Extrae el digito-prefijo de una unidad tematica y se filtran los temas (categorias)
 * por convencion del nombre
 */
function prefijoUnidadTematica(uTematica) {
  if (!uTematica) return null;
  const match = String(uTematica).match(/^(\d+)\s*\./);
  return match ? match[1] : null;
}

/**
 * Serializacion del campo "tema": multi-seleccion en UI <-> string para backend.
 *
 * El backend guarda los temas como UN solo string, con cada tema en su propia
 * linea.
 *
 * En el form mantenemos meta.tema como ese mismo string (compatibilidad
 * con Circuit domain y backend); el array de seleccion se calcula al vuelo
 * desde el string mediante temasFromString().
 */
function temasFromString(temaStr) {
  if (!temaStr) return [];
  return String(temaStr).split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

function temasToString(arr) {
  return (arr ?? []).join('\n');
}

function validarCircuito(meta, componentes) {
  const errores = [];
  if (!meta.nombre?.trim())      errores.push('El nombre del circuito es obligatorio.');
  if (!meta.descripcion?.trim()) errores.push('La descripción es obligatoria.');
  if (!meta.dificultad)          errores.push('Selecciona una dificultad.');
  if (!meta.materia)             errores.push('Selecciona una materia.');
  if (!meta.unidad_tematica)     errores.push('Selecciona una unidad temática.');
  if (!meta.tema?.trim())        errores.push('Selecciona al menos un tema.');
  if (componentes.length === 0)  errores.push('Agrega al menos un componente a la netlist.');

  /* Validacion de al menos una fuente de alimentacion */
  if (componentes.length > 0) {
    const fuentes = componentes.filter(
      (c) => c.type === 'fuente_voltaje' || c.type === 'fuente_corriente'
    );
    if (fuentes.length === 0) {
      errores.push(
        'El circuito no tiene fuente de alimentación. Agrega al menos una fuente de voltaje o de corriente.'
      );
    } else {
      const algunaUtil = fuentes.some((c) => {
        const activa = c.params?.activo ?? 1;
        const val = parseFloat(c.value);
        return Boolean(activa) && Number.isFinite(val) && val > 0;
      });
      if (!algunaUtil) {
        const todasInactivas = fuentes.every((c) => !(c.params?.activo ?? 1));
        if (todasInactivas) {
          errores.push(
            `Todas las fuentes de alimentación están inactivas. Activa al menos una desde sus parámetros.`
          );
        } else {
          errores.push(
            `Hay fuentes de alimentación pero ninguna tiene un valor mayor a 0. Asigna un voltaje o corriente positivo a al menos una.`
          );
        }
      }
    }
  }

  const nodosDe = (c) => {
    if (typeof c.getNodos === 'function') return c.getNodos();
    return Object.values(c.nodos ?? c.nodes ?? {})
      .map((v) => (v && typeof v === 'object' ? v.nodo : v))
      .filter(Boolean);
  };

  const todosNodos = new Set(componentes.flatMap(nodosDe));
  if (componentes.length > 0 && !todosNodos.has('0')) {
    errores.push('El nodo de referencia (tierra, nodo "0") debe estar presente en la netlist.');
  }
  const nodoCount = {};
  componentes.forEach((c) => {
    nodosDe(c).forEach((n) => { nodoCount[n] = (nodoCount[n] ?? 0) + 1; });
  });
  const flotantes = Object.entries(nodoCount).filter(([, v]) => v < 2).map(([n]) => n);
  if (flotantes.length > 0) {
    errores.push(`Nodos flotantes detectados (conectados a un solo componente): ${flotantes.join(', ')}. Todo nodo debe tener al menos 2 conexiones.`);
  }
  return errores;
}

/**
 * Convierte una instancia Component al formato "admin" que entiende ConstructorNetlist
 */
function compToAdminForm(comp) {
  if (!comp) return null;
  if (typeof comp.toAdminJSON === 'function') {
    return { ...comp.toAdminJSON(), position: comp.position, rotation: comp.rotation };
  }
  return comp;
}

/**
 * FormularioCircuito — Vista de creacion / edicion de circuito.
 *
 * Estructura de metadatos:
 *   - materia          (string)    — dropdown con materias del catalogo
 *   - unidad_tematica  (string)    — dropdown con las 4 unidades fijas del catalogo
 *   - tema             (string)    — dropdown con categorias filtradas por:
 *                                      * materia seleccionada
 *                                      * prefijo numerico de la unidad tematica
 *   - dificultad       (string)    — Basico / Intermedio / Avanzado
 */
export function FormularioCircuito({
  modo = 'crear',
  circuitoInicial,
  netlistInicial = [],
  onGuardar,
  onCancelar,
}) {
  const { catalogo, loading: catLoading, error: catError } = useCatalogoComponentes();
  const { categorias: categoriasCatalogo, unidades_tematicas: unidadesTematicas } = catalogo;

  /* Materias: se derivan de las categorias (cada categoria tiene su materia). */
  const materias = useMemo(() => {
    const set = new Set();
    categoriasCatalogo.forEach((c) => { if (c.materia) set.add(c.materia); });
    return [...set];
  }, [categoriasCatalogo]);

  const circuitoNorm = circuitoInicial
    ? (circuitoInicial instanceof Circuit ? circuitoInicial : Circuit.fromAny(circuitoInicial))
    : null;

  const [meta, setMeta] = useState({
    nombre:          circuitoNorm?.nombre ?? '',
    descripcion:     circuitoNorm?.descripcion ?? '',
    dificultad:      circuitoNorm?.dificultad ?? '',
    materia:         circuitoNorm?.materia ?? '',
    unidad_tematica: circuitoNorm?.unidad_tematica ?? '',
    tema:            circuitoNorm?.tema ?? '',
  });

  const [componentes, setComponentes] = useState(() => {
    const fuente = circuitoNorm?.netlist?.length
      ? circuitoNorm.netlist
      : netlistInicial;
    return fuente.map((c) => ComponentFactory.from(c));
  });

  const [hoveredId,  setHoveredId]  = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [errores,    setErrores]    = useState([]);
  const [guardando,  setGuardando]  = useState(false);
  const [okMsg,      setOkMsg]      = useState('');

  const previewRef = useRef(null);
  const builderRef = useRef(null);

  const setField = (campo, val) => setMeta((m) => ({ ...m, [campo]: val }));

  /**
   * Temas disponibles para el dropdown actual.
   * Convencion (por decision de producto):
   *   - Filtrar por materia seleccionada.
   *   - Filtrar por prefijo numerico de la unidad tematica
   */
  const temasDisponibles = useMemo(() => {
    if (!meta.materia || !meta.unidad_tematica) return [];
    const prefijo = prefijoUnidadTematica(meta.unidad_tematica);
    return categoriasCatalogo.filter((cat) => {
      if (cat.materia !== meta.materia) return false;
      if (!prefijo) return true;
      return String(cat.nombre ?? '').startsWith(`${prefijo}.`);
    });
  }, [categoriasCatalogo, meta.materia, meta.unidad_tematica]);

  /** Array de temas actualmente seleccionados (derivado del string meta.tema). */
  const temasSeleccionados = useMemo(() => temasFromString(meta.tema), [meta.tema]);

  const tiposComponentes = [...new Set(componentes.map((c) => c.type))];

  /* Handlers */

  function handleAgregarComp(rawComp) {
    setComponentes((cs) => {
      const placement = rawComp.__placement ?? {};
      const { refId, direccion } = placement;
      let pos;
      if (cs.length === 0 || !refId) {
        pos = posicionDeOrigen();
      } else {
        const ref = cs.find((c) => c.id === refId);
        pos = ref ? colocarRelativoA(ref, direccion, cs, rawComp) : posicionDeOrigen();
      }
      const cleanRaw = { ...rawComp };
      delete cleanRaw.__placement;
      const inst = ComponentFactory.from({ ...cleanRaw, position: pos });
      return [...cs, inst];
    });
  }

  function handleActualizarComp(rawComp) {
    setComponentes((cs) =>
      cs.map((c) => {
        if (c.id !== rawComp.id) return c;
        return ComponentFactory.from({ ...rawComp, position: c.position });
      })
    );
    setSelectedId(null);
  }

  function handleEliminarComp(id) {
    setComponentes((cs) => cs.filter((c) => c.id !== id));
    setHoveredId((hid) => (hid === id ? null : hid));
    setSelectedId((sid) => (sid === id ? null : sid));
  }

  function handleMoverComp(id, direccion) {
    setComponentes((cs) =>
      cs.map((c) => c.id === id ? componenteConPosicion(c, nudgePos(c, direccion)) : c)
    );
  }

  function handleRotarComp(id) {
    setComponentes((cs) =>
      cs.map((c) => c.id === id ? rotarComponente(c) : c)
    );
  }

  function handleEditarComp(id) {
    setSelectedId(id);
    if (id && builderRef.current) {
      builderRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function handleCancelarEdit() {
    setSelectedId(null);
  }

  /**
   * Cambia el nodo de un pin de un componente existente.
   */
  function handleChangeNodo(compId, pinAdmin, nuevoNodo) {
    setComponentes((cs) =>
      cs.map((c) => {
        if (c.id !== compId) return c;
        const json = typeof c.toJSON === 'function' ? c.toJSON() : c;
        const nodesActuales = json.nodes ?? {};
        const nodes = {};
        Object.entries(nodesActuales).forEach(([k, v]) => {
          nodes[k] = { ...v };
        });
        nodes[pinAdmin] = { nodo: String(nuevoNodo ?? '').trim(), x: null, y: null };
        return ComponentFactory.from({ ...json, nodes });
      })
    );
  }

  /* Handlers de cascada para los dropdowns */

  function handleMateriaChange(nuevaMateria) {
    setMeta((m) => ({
      ...m,
      materia: nuevaMateria,
      tema: '',
    }));
  }

  function handleUnidadTematicaChange(nuevaUnidad) {
    setMeta((m) => ({
      ...m,
      unidad_tematica: nuevaUnidad,
      tema: '',
    }));
  }

  /**
   * Agrega o quita un tema de la seleccion. Internamente meta.tema se
   * mantiene como un string con saltos de linea para enviar al backend.
   */
  function toggleTema(nombreTema) {
    setMeta((m) => {
      const arr = temasFromString(m.tema);
      const nuevoArr = arr.includes(nombreTema)
        ? arr.filter((t) => t !== nombreTema)
        : [...arr, nombreTema];
      return { ...m, tema: temasToString(nuevoArr) };
    });
  }

  async function handleGuardar() {
    const errs = validarCircuito(meta, componentes);
    setErrores(errs);
    if (errs.length > 0) return;

    setGuardando(true);
    setOkMsg('');
    try {
      const svgEl  = previewRef.current?.querySelector('svg');
      const svgStr = svgEl ? new XMLSerializer().serializeToString(svgEl) : '<svg/>';

      // Resolver IDs numericos de las categorias seleccionadas.
      // temasSeleccionados contiene nombres (strings); los cruzamos con
      // categoriasCatalogo para obtener sus IDs antes de construir el Circuit.
      const categoriasIds = temasSeleccionados
        .map((nombre) => {
          const cat = categoriasCatalogo.find((c) => c.nombre === nombre);
          return cat?.id ?? null;
        })
        .filter((id) => id != null);

      const circuit = new Circuit({
        ...meta,
        categorias:        categoriasIds,
        tipos_componentes: tiposComponentes,
        netlist:           componentes,
        miniatura_svg:     svgStr,
      });

      if (modo === 'editar' && circuitoNorm?.id) {
        await circuitosAdminService.editarCircuito({
          id: circuitoNorm.id,
          ...circuit.toBackendPayload(),
        });
      } else {
        await circuitosAdminService.crearCircuito(circuit.toBackendPayload());
      }

      setOkMsg(modo === 'editar' ? 'Circuito actualizado.' : 'Circuito creado exitosamente.');
      onGuardar?.();
    } catch (e) {
      setErrores([e?.message ?? 'Error al guardar. Intenta de nuevo.']);
    } finally {
      setGuardando(false);
    }
  }

  const editingComp = selectedId
    ? compToAdminForm(componentes.find((c) => c.id === selectedId))
    : null;

  /* Hints para los dropdowns */

  const hintTema = !meta.materia
    ? 'Selecciona una materia primero.'
    : !meta.unidad_tematica
      ? 'Selecciona una unidad temática primero.'
      : temasDisponibles.length === 0
        ? 'No hay temas disponibles para esta combinación de materia + unidad temática.'
        : null;

  return (
    <div className="admin-two-panel">
      <div className="admin-left-panel">
        <div className="admin-form-header">
          <h2 className="admin-form-title">
            {modo === 'editar' ? 'Editar circuito' : 'Nuevo circuito'}
          </h2>
          <button type="button" className="admin-btn admin-btn--cancel admin-btn--sm" onClick={onCancelar}>
            Cancelar
          </button>
        </div>

        <section className="admin-section">
          <p className="admin-subsection-title">Metadatos del circuito</p>

          {catError && (
            <div className="admin-warn-box" style={{ marginBottom: 14 }}>
              <span>⚠️</span>
              <p>No se pudieron cargar los catálogos del servidor: {catError}.</p>
            </div>
          )}

          <Field label="nombre">
            <input className="admin-input" type="text"
              value={meta.nombre}
              onChange={(e) => setField('nombre', e.target.value)}
              placeholder="Nombre del circuito" />
          </Field>

          <Field label="descripcion">
            <textarea className="admin-textarea"
              value={meta.descripcion}
              onChange={(e) => setField('descripcion', e.target.value)}
              rows={3} placeholder="Descripción del circuito" />
          </Field>

          <div className="admin-two-col">
            <Field label="dificultad">
              <select className="admin-select"
                value={meta.dificultad}
                onChange={(e) => setField('dificultad', e.target.value)}>
                <option value="">— Seleccionar —</option>
                {DIFICULTADES_DEFAULT.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>

            <Field label="materia">
              <select className="admin-select"
                value={meta.materia}
                onChange={(e) => handleMateriaChange(e.target.value)}
                disabled={catLoading}>
                <option value="">{catLoading ? 'Cargando…' : '— Seleccionar —'}</option>
                {materias.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
          </div>

          <Field label="unidad_tematica">
            <select className="admin-select"
              value={meta.unidad_tematica}
              onChange={(e) => handleUnidadTematicaChange(e.target.value)}
              disabled={catLoading}>
              <option value="">{catLoading ? 'Cargando…' : '— Seleccionar unidad temática —'}</option>
              {unidadesTematicas.map((u) => (
                <option key={u.nombre} value={u.nombre}>{u.nombre}</option>
              ))}
            </select>
          </Field>

          <Field label="tema">
            {catLoading ? (
              <p className="admin-input-hint">Cargando temas…</p>
            ) : hintTema ? (
              <p className="admin-input-hint">{hintTema}</p>
            ) : (
              <>
                <div className="admin-chip-container">
                  {temasDisponibles.map((cat) => {
                    const seleccionado = temasSeleccionados.includes(cat.nombre);
                    return (
                      <button key={cat.id} type="button"
                        className={`admin-chip ${seleccionado ? 'admin-chip--selected' : ''}`}
                        onClick={() => toggleTema(cat.nombre)}>
                        {cat.nombre}
                      </button>
                    );
                  })}
                </div>
                {temasSeleccionados.length > 0 && (
                  <p className="admin-input-hint" style={{ marginTop: 6 }}>
                    {temasSeleccionados.length} tema{temasSeleccionados.length !== 1 ? 's' : ''} seleccionado{temasSeleccionados.length !== 1 ? 's' : ''}.
                  </p>
                )}
              </>
            )}
          </Field>

          <Field label="tipos_componentes (generado automáticamente)">
            <div className="admin-chip-container">
              {tiposComponentes.length === 0
                ? <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>Se generará al agregar componentes</span>
                : tiposComponentes.map((t) => (
                    <span key={t} className="admin-chip admin-chip--readonly">{t}</span>
                  ))
              }
            </div>
          </Field>
        </section>

        <section className="admin-section" ref={builderRef}>
          <p className="admin-subsection-title">Netlist — Componentes del circuito</p>

          <ConstructorNetlist
            componentes={componentes}
            onAgregar={handleAgregarComp}
            onActualizar={handleActualizarComp}
            editing={editingComp}
            onCancelEdit={handleCancelarEdit}
          />

          {componentes.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p className="admin-form-list-title">Componentes agregados</p>
              <ListaComponentesAgrupada
                componentes={componentes}
                hoveredId={hoveredId}
                selectedId={selectedId}
                onHover={setHoveredId}
                onEliminar={handleEliminarComp}
                onMover={handleMoverComp}
                onRotar={handleRotarComp}
                onEditar={handleEditarComp}
                onChangeNodo={handleChangeNodo}
              />
            </div>
          )}
        </section>

        {errores.length > 0 && (
          <div className="admin-error-box">
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--danger)', marginBottom: 8 }}>
              ⚠ No se puede guardar. Corrija los siguientes errores:
            </p>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {errores.map((e, i) => (
                <li key={i} style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 4 }}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {okMsg && (
          <div className="admin-success-box">
            <p style={{ fontSize: 13, color: 'var(--success)' }}>✓ {okMsg}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button type="button" className="admin-btn admin-btn--cancel" onClick={onCancelar}>Cancelar</button>
          <button type="button" className="admin-btn admin-btn--primary" onClick={handleGuardar} disabled={guardando}>
            {guardando ? 'Guardando…' : (modo === 'editar' ? 'Guardar cambios' : 'Crear circuito')}
          </button>
        </div>
      </div>

      <div className="admin-right-panel" ref={previewRef}>
        <PreviewSVG
          componentes={componentes}
          hoveredId={hoveredId}
          selectedId={selectedId}
          onHoverComp={setHoveredId}
          onEditComp={handleEditarComp}
        />
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="admin-field">
      <label className="admin-form-label">{label}</label>
      {children}
    </div>
  );
}