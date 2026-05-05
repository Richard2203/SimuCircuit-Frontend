import { useEffect } from 'react';
import { FilterPanel } from '../FilterPanel';
import { CircuitCard } from '../CircuitCard';
import { Circuit }     from '../../domain';

const MAX_VISIBLE = 32;

/**
 * Normaliza string: minusculas + sin tildes
 * @param {string} str
 */
function normalize(str) {
  return (str ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Mapeo de fragmentos de categoria -> etiquetas de checkbox del frontend.
 * Cada entrada: [fragmentoEnCategoria, etiquetaCheckbox].
 */
const CATEGORIA_RULES = [
  ['diodos: rectificador',   'Diodo rectificador'],
  ['diodos: led',            'Diodo LED'],
  ['diodos: recortador',     'Diodo zener'],
  ['diodos: sujetador',      'Diodo zener'],
  ['diodo zener',            'Diodo zener'],
  ['transistor bjt',         'Transistor BJT'],
  ['transistor fet',         'Transistor FET'],
  ['filtros pasivos',        'Resistencias'],
  ['corriente alterna',      'Resistencias'],
  ['rlc',                    'Capacitores'],
  ['rlc',                    'Bobinas'],
  ['regulador lm317',        'Regulador LM317'],
  ['regulador lm7805',       'Regulador LM7805'],
];

/**
 * Heuristica por nombre del circuito
 */
const NOMBRE_RULES = [
  ['resistiv',    'Resistencias'],
  [' rc ',        'Resistencias'],
  [' rc ',        'Capacitores'],
  [' rl ',        'Resistencias'],
  [' rl ',        'Bobinas'],
  ['rlc',         'Resistencias'],
  ['rlc',         'Capacitores'],
  ['rlc',         'Bobinas'],
  ['capacitor',   'Capacitores'],
  ['bobina',      'Bobinas'],
  ['inductor',    'Bobinas'],
  ['zener',       'Diodo zener'],
  [' led',        'Diodo LED'],
  ['rectificador','Diodo rectificador'],
  ['transistor',  'Transistor BJT'],
  ['regulador',   'Regulador LM317'],
];

/**
 * Extrae las etiquetas de checkbox presentes en un Circuit.
 * Fuentes (en orden de prioridad):
 *   1. circuit.tipos_componentes  (campo del backend en el listado)
 *   2. circuit.categorias         (mismo origen, fallback)
 *   3. nombre del circuito        (heuristica)
 *
 * @param {Circuit} circuit
 * @returns {string[]}
 */
function getComponentLabels(circuit) {
  const labels = new Set();

  // 1. Campo tipos_componentes del backend
  if (Array.isArray(circuit.tipos_componentes) && circuit.tipos_componentes.length > 0) {
    for (const tipo of circuit.tipos_componentes) {
      const key = normalize(tipo);
      for (const [fragment, label] of CATEGORIA_RULES) {
        if (key.includes(normalize(fragment))) labels.add(label);
      }
    }
    if (labels.size > 0) return [...labels];
  }

  // 2. Derivar desde categorias
  const categorias = circuit.categorias ?? [];
  for (const cat of categorias) {
    const catNorm = normalize(cat);
    for (const [fragment, label] of CATEGORIA_RULES) {
      if (catNorm.includes(normalize(fragment))) labels.add(label);
    }
  }

  // Inferencia: si hay cat. de DC/AC y ninguna de diodo/transistor -> tiene resistencias
  const catStr = categorias.map(normalize).join(' ');
  if (catStr.includes('corriente') && !catStr.includes('diodo') && !catStr.includes('transistor')) {
    labels.add('Resistencias');
  }

  // 3. Heuristica por nombre
  const nombreNorm = ' ' + normalize(circuit.nombre) + ' ';
  for (const [fragment, label] of NOMBRE_RULES) {
    if (nombreNorm.includes(normalize(fragment))) labels.add(label);
  }

  return [...labels];
}

/**
 * Aplica los filtros activos al dataset de circuitos (Circuit[]).
 * El filtro de componentes usa OR.
 *
 * @param {Circuit[]} circuits
 * @param {object} filters
 * @returns {Circuit[]}
 */
function applyFilters(circuits, filters) {
  return circuits.filter((c) => {
    if (filters.search &&
        !normalize(c.nombre).includes(normalize(filters.search)))
      return false;

    if (filters.difficulty &&
        normalize(c.dificultad) !== normalize(filters.difficulty))
      return false;

    if (filters.unit && normalize(c.materia) !== normalize(filters.unit))
      return false;

    if (filters.topic && normalize(c.unidad_tematica) !== normalize(filters.topic))
      return false;

    // Tipo: el backend lo pone embebido en alguna categoria
    if (filters.type) {
      const inCategorias = (c.categorias ?? []).some((cat) =>
        normalize(cat).includes(normalize(filters.type))
      );
      if (!inCategorias) return false;
    }

    // Componentes: OR
    if (filters.components.length > 0) {
      const circuitLabels = getComponentLabels(c);
      const hasAny = filters.components.some((comp) => circuitLabels.includes(comp));
      if (!hasAny) return false;
    }

    return true;
  });
}

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
 *
 * Recibe Circuit[] desde `state.circuitosApi` (via Mediator).
 *
 * @param {{ state: object, dispatch: Function, api: object }} props
 */
export function Library({ state, dispatch, api }) {
  const { filters, filtrosApi, circuitosApi, loading } = state;

  useEffect(() => {
    api.cargarFiltros();
    api.buscarCircuitos();
  }, [api]);

  const isLoadingCircuitos = loading?.circuitos;
  const isLoadingCircuito  = loading?.circuito;

  // normaliza cualquier JSON crudo que pueda llegar
  const dataset = (circuitosApi?.length ? circuitosApi : [])
    .map((c) => (c instanceof Circuit ? c : Circuit.fromAny(c)));

  const filtered = applyFilters(dataset, filters);
  const visible  = filtered.slice(0, MAX_VISIBLE);

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>

      <div className="page-container">
        <header className="hero">
          <h1 className="hero-logo">SimuCircuit</h1>
          <p className="hero-sub">
            Simulador de circuitos eléctricos interactivo.
            Explora, aprende y experimenta con decenas de circuitos diferentes.
          </p>
        </header>

        <section>
          <div className="section-header">
            <h2 className="section-title">Biblioteca de Circuitos</h2>
            <p className="section-sub">Selecciona un circuito para comenzar la simulación</p>
          </div>

          <FilterPanel
            filters={filters}
            filtrosApi={filtrosApi}
            dispatch={dispatch}
          />

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

          <div className="circuit-grid">
            {isLoadingCircuitos && Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={`skel-${i}`} />
            ))}

            {!isLoadingCircuitos && visible.map((circuit) => (
              <CircuitCard
                key={circuit.id}
                circuit={circuit}
                onSelect={(c) => {
                  // Si el circuito tiene id numerico, cargamos su detalle desde API
                  if (c.id && typeof c.id === 'number') {
                    api.cargarCircuito(c.id);
                  } else {
                    dispatch('SELECT_CIRCUIT', c);
                  }
                }}
              />
            ))}
          </div>

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
