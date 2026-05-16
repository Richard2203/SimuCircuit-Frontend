import { useState, useEffect, useRef } from 'react';
import { ConstructorNetlist }       from './ConstructorNetlist';
import { ListaComponentesAgrupada } from './FilaComponente';
import { PreviewSVG }               from './PreviewSVG';
import { circuitosAdminService }    from '../../../services/admin/circuitosAdminService';
import { Circuit, ComponentFactory } from '../../../domain';
import {
  colocarRelativoA,
  posicionDeOrigen,
  nudgePos,
  componenteConPosicion,
  rotarComponente,
} from './circuitLayout';

const DIFICULTADES_DEFAULT = ['Básico', 'Intermedio', 'Avanzado'];

function validarCircuito(meta, componentes) {
  const errores = [];
  if (!meta.nombre?.trim())      errores.push('El nombre del circuito es obligatorio.');
  if (!meta.descripcion?.trim()) errores.push('La descripción es obligatoria.');
  if (!meta.dificultad)          errores.push('Selecciona una dificultad.');
  if (!meta.materia)             errores.push('Selecciona una materia.');
  if (!meta.unidad_tematica)     errores.push('Selecciona una unidad temática.');
  if (!meta.tema?.trim())        errores.push('El tema es obligatorio.');
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
      // Hay fuentes — verificar que al menos una este activa y con valor > 0
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
 * Convierte una instancia Component al formato "admin" que entiende
 * ConstructorNetlist
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
 */
export function FormularioCircuito({
  modo = 'crear',
  circuitoInicial,
  netlistInicial = [],
  onGuardar,
  onCancelar,
}) {
  const [catalogos, setCatalogos] = useState({
    materias: [], unidades_tematicas: {}, temas: [], categorias: [], dificultades: [],
  });
  const [catLoading, setCatLoading] = useState(true);
  const [catError,   setCatError]   = useState('');

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
    categorias:      circuitoNorm?.categorias ?? [],
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

  useEffect(() => {
    let cancelled = false;
    setCatLoading(true);
    setCatError('');
    circuitosAdminService.obtenerCatalogos()
      .then((data) => { if (!cancelled) setCatalogos(data); })
      .catch((e) => { if (!cancelled) setCatError(e?.message ?? 'No se pudieron cargar los catálogos.'); })
      .finally(() => { if (!cancelled) setCatLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const setField = (campo, val) => setMeta((m) => ({ ...m, [campo]: val }));

  const unidadesDisponibles = meta.materia
    ? (catalogos.unidades_tematicas[meta.materia] ?? [])
    : [];

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
        // Conserva la posicion actual del componente; el resto se reemplaza
        return ComponentFactory.from({
          ...rawComp,
          position: c.position,
        });
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
    // Scroll suave hacia el builder
    if (id && builderRef.current) {
      builderRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function handleCancelarEdit() {
    setSelectedId(null);
  }

  /**
   * Cambia el nodo de un pin de un componente existente.
   * Usa toJSON() para obtener el formato canonico y construye una nueva
   * instancia con el nodo actualizado (inmutable).
   *
   * `pinAdmin` puede venir en formato admin (e.g. "a", "base", "vin")
   * pero los nodes canonicos usan otras claves; el constructor del Component
   * los normaliza automaticamente al pasar nodes con la clave admin.
   */
  function handleChangeNodo(compId, pinAdmin, nuevoNodo) {
    setComponentes((cs) =>
      cs.map((c) => {
        if (c.id !== compId) return c;
        const json = typeof c.toJSON === 'function' ? c.toJSON() : c;
        // Buscamos el pinKey CANONICO que corresponde al pinAdmin recibido.
        // El constructor de Component normaliza claves, asi que pasamos
        // tanto las canonicas existentes como un override con la clave admin.
        const nodesActuales = json.nodes ?? {};
        const nodes = {};
        Object.entries(nodesActuales).forEach(([k, v]) => {
          nodes[k] = { ...v };
        });
        // Sobreescribimos con la clave admin (Component la resolvera a canonical)
        nodes[pinAdmin] = { nodo: String(nuevoNodo ?? '').trim(), x: null, y: null };
        return ComponentFactory.from({ ...json, nodes });
      })
    );
  }

  function toggleCategoria(cat) {
    setMeta((m) => ({
      ...m,
      categorias: m.categorias.includes(cat)
        ? m.categorias.filter((c) => c !== cat)
        : [...m.categorias, cat],
    }));
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

      const circuit = new Circuit({
        ...meta,
        tipos_componentes: tiposComponentes,
        netlist:           componentes,
        miniatura_svg:     svgStr,
      });

      if (modo === 'editar' && circuitoNorm?.id) {
        await circuitosAdminService.editarCircuito({
          id:            circuitoNorm.id,
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
                onChange={(e) => setField('dificultad', e.target.value)}
                disabled={catLoading}>
                <option value="">{catLoading ? 'Cargando…' : '— Seleccionar —'}</option>
                {(catalogos.dificultades.length > 0 ? catalogos.dificultades : DIFICULTADES_DEFAULT)
                  .map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>

            <Field label="materia">
              <select className="admin-select"
                value={meta.materia}
                onChange={(e) => { setField('materia', e.target.value); setField('unidad_tematica', ''); }}
                disabled={catLoading}>
                <option value="">{catLoading ? 'Cargando…' : '— Seleccionar —'}</option>
                {catalogos.materias.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
          </div>

          <Field label="unidad_tematica">
            <select className="admin-select"
              value={meta.unidad_tematica}
              onChange={(e) => setField('unidad_tematica', e.target.value)}
              disabled={!meta.materia}>
              <option value="">— Seleccionar materia primero —</option>
              {unidadesDisponibles.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </Field>

          <Field label="tema">
            <textarea className="admin-textarea"
              value={meta.tema}
              onChange={(e) => setField('tema', e.target.value)}
              rows={2} placeholder="ej: 1. Ley de Ohm&#10;2. Divisor de Voltaje" />
          </Field>

          <Field label="categorias">
            <div className="admin-chip-container">
              {catalogos.categorias.map((cat) => (
                <button key={cat} type="button"
                  className={`admin-chip ${meta.categorias.includes(cat) ? 'admin-chip--selected' : ''}`}
                  onClick={() => toggleCategoria(cat)}>
                  {cat}
                </button>
              ))}
            </div>
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