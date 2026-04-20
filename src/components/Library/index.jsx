import { useEffect } from 'react';
import { ALL_CIRCUITS } from '../../data/circuits';
import { FilterPanel } from '../FilterPanel';
import { CircuitCard } from '../CircuitCard';

const MAX_VISIBLE = 32;

/**
 * Aplica los filtros activos al dataset de circuitos.
 * @param {Array} circuits
 * @param {object} filters
 * @returns {Array}
 */
function applyFilters(circuits, filters) {
  return circuits.filter((c) => {
    const name = c.name ?? c.nombre_circuito ?? c.nombre ?? '';
    if (filters.search && !name.toLowerCase().includes(filters.search.toLowerCase()))
      return false;
    if (filters.difficulty && c.difficulty !== filters.difficulty)
      return false;
    if (filters.unit && c.unit !== filters.unit)
      return false;
    if (filters.topic && c.topic !== filters.topic)
      return false;
    if (filters.type && c.type !== filters.type)
      return false;
    if (
      filters.components.length > 0 &&
      !filters.components.every((comp) => (c.components ?? []).includes(comp))
    )
      return false;
    return true;
  });
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

  // Al montar: cargar filtros desde la API
  useEffect(() => {
    api.cargarFiltros();
  }, [api]);

  // Fuente de datos: preferir circuitos de la API; caer a dataset local si no hay
  const dataset = circuitosApi.length > 0 ? circuitosApi : ALL_CIRCUITS;
  const filtered = applyFilters(dataset, filters);
  const visible  = filtered.slice(0, MAX_VISIBLE);

  const isLoadingCircuitos = loading?.circuitos;

  return (
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

        {isLoadingCircuitos ? (
          <p className="results-count">Buscando circuitos…</p>
        ) : (
          <p className="results-count">
            Mostrando {visible.length} de {filtered.length} circuitos
            {filtered.length !== dataset.length && ` (${dataset.length} total)`}
          </p>
        )}

        <div className="circuit-grid">
          {visible.map((circuit) => (
            <CircuitCard
              key={circuit.id}
              circuit={circuit}
              onSelect={(c) => {
                // Si el circuito viene de la API, cargamos su netlist completa
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
            <button className="control-btn" onClick={() => dispatch('CLEAR_FILTERS')}>
              Limpiar filtros
            </button>
          </div>
        )}
      </section>
    </div>
  );
}