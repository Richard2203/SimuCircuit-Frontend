import { useEffect } from 'react';
import { ALL_CIRCUITS } from '../../data/circuits';
import { FilterPanel } from '../FilterPanel';
import { CircuitCard } from '../CircuitCard';

const MAX_VISIBLE = 32;

/**
 * Normaliza un string: minusculas + sin tildes/diacriticos.
 * Permite comparar "Básico" === "Basico", "Fácil" === "Facil", etc.
 */
function normalize(str) {
  return (str ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Mapeo de categorías de la BD → etiquetas de checkbox del frontend.
 * Se compara con normalize() para ignorar tildes y mayúsculas.
 * Cada entrada es [fragmento_en_categoria, etiqueta_checkbox].
 * Se usa "includes" sobre la categoría normalizada, así "diodos: rectificadores"
 * hace match con la regla "diodos: rectificador".
 */
const CATEGORIA_RULES = [
  ['diodos: rectificador',   'Diodo rectificador'],
  ['diodos: led',            'Diodo LED'],
  ['diodos: recortador',     'Diodo zener'],
  ['diodos: sujetador',      'Diodo zener'],
  ['diodo zener',            'Diodo zener'],
  ['transistor bjt',         'Transistor BJT'],
  ['transistor fet',         'Transistor FET'],
  ['filtros pasivos',        'Resistencias'],   // RC/RL/RLC siempre tienen resistencias
  ['corriente alterna',      'Resistencias'],   // todos los AC tienen al menos R
  ['rlc',                    'Capacitores'],
  ['rlc',                    'Bobinas'],
  ['regulador lm317',        'Regulador LM317'],
  ['regulador lm7805',       'Regulador LM7805'],
];

/**
 * Palabras clave en el NOMBRE del circuito → etiquetas de checkbox.
 * Cubre casos donde la categoría no es suficiente.
 */
const NOMBRE_RULES = [
  ['resistiv',    'Resistencia'],
  [' rc ',        'Resistencia'],
  [' rc ',        'Capacitor'],
  [' rl ',        'Resistencia'],
  [' rl ',        'Bobina'],
  ['rlc',         'Resistencia'],
  ['rlc',         'Capacitor'],
  ['rlc',         'Bobina'],
  ['capacitor',   'Capacitor'],
  ['bobina',      'Bobina'],
  ['inductor',    'Bobina'],
  ['zener',       'Diodo zener'],
  [' led',        'Diodo LED'],
  ['rectificador','Diodo rectificador'],
  ['transistor',  'Transistor BJT'],
  ['regulador',   'Regulador LM317'],
];

/**
 * Extrae las etiquetas de checkbox presentes en un circuito.
 * Fuentes de datos (en orden de prioridad):
 *  1. circuit.components        → circuitos locales (ya tienen etiquetas directas)
 *  2. circuit.tipos_componentes → campo nuevo del backend (si ya esta desplegado)
 *  3. circuit.categorias        → array disponible en el listado actual de la API
 *  4. nombre del circuito       → heurística de último recurso
 */
function getComponentLabels(circuit) {
  const labels = new Set();

  // 1. Circuitos locales: ya traen etiquetas directas
  if (Array.isArray(circuit.components) && circuit.components.length > 0) {
    return circuit.components;
  }

  // 2. Campo tipos_componentes del backend (cuando esté disponible)
  if (Array.isArray(circuit.tipos_componentes) && circuit.tipos_componentes.length > 0) {
    for (const tipo of circuit.tipos_componentes) {
      const key = normalize(tipo);
      for (const [fragment, label] of CATEGORIA_RULES) {
        if (key.includes(normalize(fragment))) labels.add(label);
      }
    }
    if (labels.size > 0) return [...labels];
  }

  // 3. Derivar desde categorias (disponible en el listado actual)
  const categorias = Array.isArray(circuit.categorias) ? circuit.categorias : [];
  for (const cat of categorias) {
    const catNorm = normalize(cat);
    for (const [fragment, label] of CATEGORIA_RULES) {
      if (catNorm.includes(normalize(fragment))) labels.add(label);
    }
  }

  // Los circuitos 1-9 son todos resistivos (aparecen en categorias como Mixto/Serie/Paralelo)
  // Si tiene al menos una categoría DC o AC y ninguna categoría de diodo/transistor,
  // casi seguro tiene resistencias.
  const catStr = categorias.map(normalize).join(' ');
  if (catStr.includes('corriente') && !catStr.includes('diodo') && !catStr.includes('transistor')) {
    labels.add('Resistencia');
  }

  // 4. Heurística por nombre del circuito
  const nombreNorm = ' ' + normalize(circuit.nombre ?? circuit.name ?? circuit.nombre_circuito ?? '') + ' ';
  for (const [fragment, label] of NOMBRE_RULES) {
    if (nombreNorm.includes(normalize(fragment))) labels.add(label);
  }

  return [...labels];
}

/**
 * Aplica los filtros activos al dataset de circuitos.
 * Normaliza campos API (dificultad/materia) y locales (difficulty/unit).
 * La comparación de dificultad ignora tildes y mayúsculas.
 * El filtro de componentes usa OR: basta con que el circuito
 * contenga AL MENOS UNO de los componentes seleccionados.
 * @param {Array} circuits
 * @param {object} filters
 * @returns {Array}
 */
function applyFilters(circuits, filters) {
  return circuits.filter((c) => {
    
    const name       = c.name ?? c.nombre_circuito ?? c.nombre ?? '';
    const difficulty = c.difficulty ?? c.dificultad ?? '';
    // "materia" en la BD == "unit" en circuitos locales
    const unit       = c.unit ?? c.materia ?? '';
    // "unidad_tematica" en la BD == "topic" en circuitos locales
    const topic      = c.topic ?? c.unidad_tematica ?? '';
    // "type" en circuitos locales (ej. "Serie"); en circuitos de BD viene
    // dentro de `categorias` como "Circuito en Serie", "Circuito Mixto...", etc.
    const categorias = Array.isArray(c.categorias) ? c.categorias : [];


    if (filters.search &&
        !normalize(name).includes(normalize(filters.search)))
      return false;

    // Comparación sin tildes: "Básico" == "Basico"
    if (filters.difficulty &&
        normalize(difficulty) !== normalize(filters.difficulty))
      return false;

    if (filters.unit && normalize(unit) !== normalize(filters.unit))
      return false;

    // Tema: comparación normalizada
    if (filters.topic && normalize(topic) !== normalize(filters.topic))
      return false;

    // Tipo de circuito: circuitos locales usan c.type; circuitos de BD
    // tienen el tipo embebido en alguna categoría (ej. "Circuito en Serie")
    if (filters.type) {
      const localType = c.type ?? '';
      const inCategorias = categorias.some((cat) =>
        normalize(cat).includes(normalize(filters.type))
      );
      if (normalize(localType) !== normalize(filters.type) && !inCategorias)
        return false;
    }

    // Componentes: OR — el circuito debe tener AL MENOS UNO
    if (filters.components.length > 0) {
      console.log('filters.components:', filters.components);
      const circuitLabels = getComponentLabels(c);
      const hasAny = filters.components.some((comp) =>
        circuitLabels.includes(comp)
      );
      if (!hasAny) return false;
    }

    

    return true;
  });
}

/**
 * SkeletonCard — Placeholder animado mientras cargan los circuitos.
 */
function SkeletonCard() {
  return (
    <div className="circuit-card sim-panel" style={{ cursor: 'default', pointerEvents: 'none' }}>
      <div className="card-preview" style={{ background: 'var(--bg-elevated)' }}>
        <div style={{
          width: '70%', height: 16,
          background: 'var(--surface)',
          borderRadius: 4,
          animation: 'pulse 1.4s ease-in-out infinite',
        }} />
      </div>
      <div className="card-body">
        <div style={{ height: 13, width: '80%', background: 'var(--surface)', borderRadius: 4, marginBottom: 8, animation: 'pulse 1.4s ease-in-out infinite' }} />
        <div style={{ height: 11, width: '60%', background: 'var(--surface)', borderRadius: 4, marginBottom: 10, animation: 'pulse 1.4s ease-in-out infinite 0.1s' }} />
        <div style={{ height: 20, width: 64, background: 'var(--surface)', borderRadius: 20, animation: 'pulse 1.4s ease-in-out infinite 0.2s' }} />
      </div>
    </div>
  );
}

/**
 * Library — Vista principal de la biblioteca de circuitos.
 * Orquesta FilterPanel y la grilla de CircuitCards.
 * Se conecta a la API a través del Mediator (api.cargarFiltros, api.buscarCircuitos).
 *
 * @param {{ state: object, dispatch: Function, api: object }} props
 */
export function Library({ state, dispatch, api }) {
  const { filters, filtrosApi, circuitosApi, loading } = state;

  // Al montar: cargar filtros y circuitos de la API simultaneamente
  useEffect(() => {
    api.cargarFiltros();
    api.buscarCircuitos();
    api.cargarComponentes();
  }, [api]);

  const isLoadingCircuitos = loading?.circuitos;
  const isLoadingCircuito  = loading?.circuito;

  // Fuente de datos: preferir circuitos de la API; caer a dataset local si no hay
  const dataset = circuitosApi.length > 0 ? circuitosApi : ALL_CIRCUITS;
  const filtered = applyFilters(dataset, filters);
  const visible  = filtered.slice(0, MAX_VISIBLE);

  return (
    <>
      {/* Keyframe de animación del skeleton */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>

      <div className="page-container">
        {/* Hero */}
        <header className="hero">
          <h1 className="hero-logo">SimuCircuit</h1>
          <p className="hero-sub">
            Simulador de circuitos eléctricos interactivo.
            Explora, aprende y experimenta con decenas de circuitos diferentes.
          </p>
        </header>

        {/* Biblioteca */}
        <section>
          <div className="section-header">
            <h2 className="section-title">Biblioteca de Circuitos</h2>
            <p className="section-sub">Selecciona un circuito para comenzar la simulación</p>
          </div>

          <FilterPanel
            filters={filters}
            filtrosApi={filtrosApi}
            dispatch={dispatch}
            componentesCatalogo={state.componentesCatalogo}
          />

          {/* Conteo de resultados */}
          {isLoadingCircuitos ? (
            <p className="results-count" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                display: 'inline-block', width: 12, height: 12,
                border: '2px solid var(--border)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
              Cargando circuitos desde la base de datos…
            </p>
          ) : (
            <p className="results-count">
              {circuitosApi.length > 0
                ? `${visible.length} de ${filtered.length} circuito${filtered.length !== 1 ? 's' : ''} de la base de datos`
                : `${visible.length} de ${filtered.length} circuito${filtered.length !== 1 ? 's' : ''} (datos locales)`
              }
              {filtered.length !== dataset.length && ` · ${dataset.length} en total`}
            </p>
          )}

          {/* Overlay de carga al abrir un circuito */}
          {isLoadingCircuito && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(13,13,13,0.75)',
              backdropFilter: 'blur(3px)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 16,
            }}>
              <div style={{
                width: 40, height: 40,
                border: '3px solid var(--border)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Cargando circuito…</p>
            </div>
          )}

          {/* Grid de circuitos */}
          <div className="circuit-grid">
            {/* Skeletons mientras carga la lista */}
            {isLoadingCircuitos && Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={`skel-${i}`} />
            ))}

            {/* Tarjetas reales */}
            {!isLoadingCircuitos && visible.map((circuit) => (
              <CircuitCard
                key={circuit.id}
                circuit={circuit}
                onSelect={(c) => {
                  // Si el circuito viene de la API (id numérico), cargamos su netlist completa
                  if (c.id && typeof c.id === 'number') {
                    api.cargarCircuito(c.id);
                  } else {
                    dispatch('SELECT_CIRCUIT', c);
                  }
                }}
              />
            ))}
          </div>

          {/* Estado vacío */}
          {filtered.length === 0 && !isLoadingCircuitos && (
            <div className="empty-state">
              <p>No se encontraron circuitos con los filtros actuales.</p>
              <button className="control-btn" onClick={() => {
                dispatch('CLEAR_FILTERS');
              }}>
                Limpiar filtros
              </button>
            </div>
          )}
        </section>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}