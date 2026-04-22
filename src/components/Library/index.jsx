import { useEffect } from 'react';
import { ALL_CIRCUITS } from '../../data/circuits';
import { FilterPanel } from '../FilterPanel';
import { CircuitCard } from '../CircuitCard';

const MAX_VISIBLE = 32;

/**
 * Aplica los filtros activos al dataset de circuitos.
 * Normaliza campos API (dificultad/materia) y locales (difficulty/unit).
 * @param {Array} circuits
 * @param {object} filters
 * @returns {Array}
 */
function applyFilters(circuits, filters) {
  return circuits.filter((c) => {
    const name = c.name ?? c.nombre_circuito ?? c.nombre ?? '';
    const difficulty = c.difficulty ?? c.dificultad ?? '';
    const unit = c.unit ?? c.materia ?? '';
    const topic = c.topic ?? c.unidad_tematica ?? '';

    if (filters.search && !name.toLowerCase().includes(filters.search.toLowerCase()))
      return false;
    if (filters.difficulty && difficulty !== filters.difficulty)
      return false;
    if (filters.unit && unit !== filters.unit)
      return false;
    if (filters.topic && topic !== filters.topic)
      return false;
    if (filters.type && c.type !== filters.type)
      return false;
    if (
      filters.components.length > 0 &&
      !filters.components.every((comp) => (c.components ?? c.categorias ?? []).includes(comp))
    )
      return false;
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

  // Al montar: cargar filtros y circuitos de la API simultáneamente
  useEffect(() => {
    api.cargarFiltros();
    api.buscarCircuitos();
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
            onBuscar={(params) => api.buscarCircuitos(params)}
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
                api.buscarCircuitos();
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