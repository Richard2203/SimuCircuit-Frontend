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
    if (filters.search && !c.name.toLowerCase().includes(filters.search.toLowerCase()))
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
      !filters.components.every((comp) => c.components.includes(comp))
    )
      return false;
    return true;
  });
}

/**
 * Library — Vista principal de la biblioteca de circuitos.
 * Orquesta FilterPanel y la grilla de CircuitCards.
 *
 * @param {{ state: object, dispatch: Function }} props
 */
export function Library({ state, dispatch }) {
  const filtered = applyFilters(ALL_CIRCUITS, state.filters);
  const visible = filtered.slice(0, MAX_VISIBLE);

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

        <FilterPanel filters={state.filters} dispatch={dispatch} />

        <p className="results-count">
          Mostrando {visible.length} de {filtered.length} circuitos
          {filtered.length !== ALL_CIRCUITS.length && ` (${ALL_CIRCUITS.length} total)`}
        </p>

        <div className="circuit-grid">
          {visible.map((circuit) => (
            <CircuitCard
              key={circuit.id}
              circuit={circuit}
              onSelect={(c) => dispatch('SELECT_CIRCUIT', c)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
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
