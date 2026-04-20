import { useState, useEffect } from 'react';
import {
  DIFFICULTIES, UNITS, TOPICS_BY_UNIT, CIRCUIT_TYPES, COMPONENTS_LIST,
} from '../../data/circuits';

const INITIAL_LOCAL = {
  search: '', difficulty: '', unit: '', topic: '', type: '', components: [],
};

/**
 * FilterPanel — Panel de filtros de la biblioteca.
 *
 * Prioriza las opciones dinámicas de la API (filtrosApi) sobre las
 * constantes locales, para que el panel refleje los datos reales del backend.
 *
 * @param {{
 *   filters:    object,
 *   filtrosApi: object|null,   // { temas, componentes, dificultades, materias }
 *   dispatch:   Function,
 *   onBuscar:   Function       // llama a api.buscarCircuitos(params)
 * }} props
 */
export function FilterPanel({ filters, filtrosApi, dispatch, onBuscar }) {
  const [local, setLocal]         = useState({ ...INITIAL_LOCAL, ...filters });
  const [localComps, setLocalComps] = useState(filters.components || []);

  // Opciones: API cuando disponible, fallback a constantes locales
  const dificultades = filtrosApi?.dificultades ?? DIFFICULTIES;
  const materias     = filtrosApi?.materias     ?? UNITS;
  const componentes  = filtrosApi?.componentes  ?? COMPONENTS_LIST;

  // Temas: si la API los tiene como arreglo plano, usarlos directo;
  // si no, caer al mapa local por unidad
  const temasApi = filtrosApi?.temas ?? null;
  const availableTopics = temasApi
    ? temasApi
    : (local.unit ? TOPICS_BY_UNIT[local.unit] || [] : []);

  // Sincronizar estado local si los filtros globales se limpian externamente
  useEffect(() => {
    if (!filters.search && !filters.difficulty && !filters.unit &&
        !filters.topic && !filters.type && filters.components.length === 0) {
      setLocal({ ...INITIAL_LOCAL });
      setLocalComps([]);
    }
  }, [filters]);

  const handleField = (key, value) => {
    const updated = {
      ...local,
      [key]: value,
      ...(key === 'unit' ? { topic: '' } : {}),
    };
    setLocal(updated);
    // Búsqueda en tiempo real solo para el campo de texto
    if (key === 'search') {
      dispatch('SET_FILTER', { ...updated, components: localComps });
    }
  };

  const handleComponent = (comp) =>
    setLocalComps((prev) =>
      prev.includes(comp) ? prev.filter((c) => c !== comp) : [...prev, comp]
    );

  const handleFilter = () => {
    const params = {
      nombreBusqueda: local.search,
      dificultad:     local.difficulty,
      materia:        local.unit,
      tema:           local.topic,
      componentes:    localComps,
    };
    // Actualiza el estado global de filtros (para filtrado local)
    dispatch('SET_FILTER', { ...local, components: localComps });
    // Llama a la API a través del Mediator
    onBuscar?.(params);
  };

  const handleClear = () => {
    setLocal({ ...INITIAL_LOCAL });
    setLocalComps([]);
    dispatch('CLEAR_FILTERS');
    onBuscar?.({});
  };

  return (
    <div className="filter-panel">
      {/* Búsqueda */}
      <div className="filter-search-wrap">
        <label className="filter-label">Buscar por nombre</label>
        <input
          className="filter-input"
          placeholder="Buscar circuito..."
          value={local.search}
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
            disabled: !temasApi && !local.unit,
          },
          { label: 'Tipo de circuito',      key: 'type',       opts: CIRCUIT_TYPES },
        ].map((f) => (
          <div key={f.key}>
            <label className="filter-label">{f.label}</label>
            <select
              className="filter-select"
              value={local[f.key]}
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
                checked={localComps.includes(comp)}
                onChange={() => handleComponent(comp)}
              />
              <span>{comp}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Acciones */}
      <div className="filter-actions">
        <button className="control-btn primary" onClick={handleFilter}>
          ⚡ Filtrar
        </button>
        <button className="control-btn" onClick={handleClear}>
          Limpiar filtros
        </button>
      </div>
    </div>
  );
}