import { useState } from 'react';
import { DIFFICULTIES, UNITS, TOPICS_BY_UNIT, CIRCUIT_TYPES, COMPONENTS_LIST } from '../../data/circuits';

const INITIAL_LOCAL = { search: '', difficulty: '', unit: '', topic: '', type: '', components: [] };

export function FilterPanel({ filters, dispatch }) {
  const [local, setLocal] = useState({ ...INITIAL_LOCAL, ...filters });
  const [localComps, setLocalComps] = useState(filters.components || []);

  const availableTopics = local.unit ? TOPICS_BY_UNIT[local.unit] || [] : [];

  const handleField = (key, value) => {
    const updated = { ...local, [key]: value, ...(key === 'unit' ? { topic: '' } : {}) };
    setLocal(updated);
    if (key === 'search') {
      dispatch('SET_FILTER', { ...updated, components: localComps });
    }
};

  
  const handleComponent = (comp) =>
    setLocalComps((prev) =>
      prev.includes(comp) ? prev.filter((c) => c !== comp) : [...prev, comp]
    );

  const handleFilter = () => dispatch('SET_FILTER', { ...local, components: localComps });

  const handleClear = () => {
    setLocal({ ...INITIAL_LOCAL });
    setLocalComps([]);
    dispatch('CLEAR_FILTERS');
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
          { label: 'Nivel de dificultad',    key: 'difficulty', opts: DIFFICULTIES },
          { label: 'Unidad de aprendizaje',  key: 'unit',       opts: UNITS },
          { label: 'Tema',                   key: 'topic',      opts: availableTopics, disabled: !local.unit },
          { label: 'Tipo de circuito',       key: 'type',       opts: CIRCUIT_TYPES },
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
          {COMPONENTS_LIST.map((comp) => (
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
        <button className="control-btn primary" onClick={handleFilter}>⚡ Filtrar</button>
        <button className="control-btn" onClick={handleClear}>Limpiar filtros</button>
      </div>
    </div>
  );
}
