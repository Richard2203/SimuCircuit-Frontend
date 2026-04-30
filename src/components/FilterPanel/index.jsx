import { useEffect } from 'react';
import {
  DIFFICULTIES, UNITS, TOPICS_BY_UNIT, CIRCUIT_TYPES, COMPONENTS_LIST,
} from '../../data/circuits';

/**
 * FilterPanel — Panel de filtros de la biblioteca - Se aplica en el cliente sin consultar backend
 *
 * @param {{
 *   filters:    object,
 *   filtrosApi: object|null,   // { temas, componentes, dificultades, materias }
 *   dispatch:   Function,
 * }} props
 */
export function FilterPanel({ filters, filtrosApi, dispatch }) {
  // Opciones: API cuando disponible, fallback a constantes locales
  const dificultades = filtrosApi?.dificultades ?? DIFFICULTIES;
  const materias     = filtrosApi?.materias     ?? UNITS;
  const componentes  = COMPONENTS_LIST;

  // Temas: si la API los tiene como arreglo plano, usarlos directo;
  // si no, caer al mapa local por unidad
  const temasApi = filtrosApi?.temas ?? null;
  const availableTopics = temasApi
    ? temasApi
    : (filters.unit ? TOPICS_BY_UNIT[filters.unit] || [] : []);

  // Si se cambia la unidad y el tema actual ya no es válido, limpiarlo
  useEffect(() => {
    if (filters.topic && !temasApi && filters.unit) {
      const validTopics = TOPICS_BY_UNIT[filters.unit] || [];
      if (!validTopics.includes(filters.topic)) {
        dispatch('SET_FILTER', { ...filters, topic: '' });
      }
    }
  }, [filters.unit]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Actualiza un campo de texto o select e inmediatamente despacha el filtro */
  const handleField = (key, value) => {
    const updated = {
      ...filters,
      [key]: value,
      // Al cambiar de unidad, resetear el tema
      ...(key === 'unit' ? { topic: '' } : {}),
    };
    dispatch('SET_FILTER', updated);
  };

  /** Alterna un componente del checkbox e inmediatamente despacha el filtro */
  const handleComponent = (comp) => {
    const current = filters.components ?? [];
    const updated = current.includes(comp)
      ? current.filter((c) => c !== comp)
      : [...current, comp];
    dispatch('SET_FILTER', { ...filters, components: updated });
  };

  const handleClear = () => {
    dispatch('CLEAR_FILTERS');
  };

  const hasActiveFilters =
    filters.search ||
    filters.difficulty ||
    filters.unit ||
    filters.topic ||
    filters.type ||
    (filters.components ?? []).length > 0;

  return (
    <div className="filter-panel">
      {/* Búsqueda */}
      <div className="filter-search-wrap">
        <label className="filter-label">Buscar por nombre</label>
        <input
          className="filter-input"
          placeholder="Buscar circuito..."
          value={filters.search}
          onChange={(e) => handleField('search', e.target.value)}
        />
      </div>

      {/* Selects */}
      <div className="filter-row">
        {[
          { label: 'Nivel de dificultad',   key: 'difficulty', opts: dificultades },
          { label: 'Unidad de aprendizaje', key: 'unit',       opts: materias },
          {
            label: 'Tema',
            key: 'topic',
            opts: availableTopics,
            disabled: !temasApi && !filters.unit,
          },
          { label: 'Tipo de circuito',      key: 'type',       opts: CIRCUIT_TYPES },
        ].map((f) => (
          <div key={f.key}>
            <label className="filter-label">{f.label}</label>
            <select
              className="filter-select"
              value={filters[f.key]}
              disabled={f.disabled}
              onChange={(e) => handleField(f.key, e.target.value)}
            >
              <option value="">Todos</option>
              {f.opts.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>

      {/* Componentes */}
      <div className="components-section">
        <label className="filter-label">Componentes</label>
        <div className="comp-grid">
          {componentes.map((comp) => (
            <label key={comp} className="checkbox-item">
              <input
                type="checkbox"
                checked={(filters.components ?? []).includes(comp)}
                onChange={() => handleComponent(comp)}
              />
              <span>{comp}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Acciones — solo limpiar, el filtrado es instantáneo */}
      <div className="filter-actions">
        <button
          className="control-btn"
          onClick={handleClear}
          disabled={!hasActiveFilters}
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  );
}