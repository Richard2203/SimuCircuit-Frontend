/**
 * ¿Que se prueba?
 *   - Busqueda por nombre (case-insensitive)
 *   - Filtro por dificultad, unidad, tema, tipo
 *   - Filtro por componentes (todos deben coincidir)
 *   - Combinacion de múltiples filtros
 *   - Filtros vacios retornan todos los circuitos
 *
 */

import { describe, it, expect } from 'vitest';

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
// ─────────────────────────────────────────────────────────────────────────────

// Dataset de prueba — independiente de ALL_CIRCUITS para aislar la logica
const MOCK_CIRCUITS = [
  {
    id: 'una-malla',
    name: 'Circuito de Una Malla',
    difficulty: 'Fácil',
    unit: 'Circuitos Eléctricos',
    topic: 'Mallas DC',
    type: 'Serie',
    components: ['Resistencias'],
  },
  {
    id: 'cuatro-mallas',
    name: 'Circuito de Cuatro Mallas',
    difficulty: 'Intermedio',
    unit: 'Circuitos Eléctricos',
    topic: 'Mallas DC',
    type: 'Mallas',
    components: ['Resistencias'],
  },
  {
    id: 'bjt-amplifier',
    name: 'Amplificador BJT',
    difficulty: 'Difícil',
    unit: 'Electrónica Analógica',
    topic: 'Transistores BJT',
    type: 'Mixto',
    components: ['Resistencias', 'Transistor BJT', 'Capacitores'],
  },
  {
    id: 'divisor-voltaje',
    name: 'Divisor de Voltaje',
    difficulty: 'Fácil',
    unit: 'Circuitos Eléctricos',
    topic: 'Divisor de Voltaje',
    type: 'Serie',
    components: ['Resistencias'],
  },
];

const emptyFilters = {
  search: '', difficulty: '', unit: '', topic: '', type: '', components: [],
};

// ─── Filtros vacios ───────────────────────────────────────────────────────────
describe('applyFilters — sin filtros activos', () => {
  it('retorna todos los circuitos cuando los filtros están vacíos', () => {
    expect(applyFilters(MOCK_CIRCUITS, emptyFilters)).toHaveLength(4);
  });

  it('retorna arreglo vacío si no hay circuitos', () => {
    expect(applyFilters([], emptyFilters)).toHaveLength(0);
  });
});

// ─── Busqueda por nombre ──────────────────────────────────────────────────────

describe('applyFilters — búsqueda por nombre', () => {
  it('encuentra por nombre exacto', () => {
    const result = applyFilters(MOCK_CIRCUITS, { ...emptyFilters, search: 'Divisor de Voltaje' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('divisor-voltaje');
  });

  it('encuentra por substring parcial', () => {
    const result = applyFilters(MOCK_CIRCUITS, { ...emptyFilters, search: 'malla' });
    expect(result).toHaveLength(2); // "Una Malla" y "Cuatro Mallas"
  });

  it('es case-insensitive (MALLA = malla = Malla)', () => {
    const lower = applyFilters(MOCK_CIRCUITS, { ...emptyFilters, search: 'malla' });
    const upper = applyFilters(MOCK_CIRCUITS, { ...emptyFilters, search: 'MALLA' });
    const mixed = applyFilters(MOCK_CIRCUITS, { ...emptyFilters, search: 'Malla' });
    expect(lower).toHaveLength(upper.length);
    expect(lower).toHaveLength(mixed.length);
  });

  it('retorna vacío si no hay coincidencia', () => {
    const result = applyFilters(MOCK_CIRCUITS, { ...emptyFilters, search: 'circuito inexistente xyz' });
    expect(result).toHaveLength(0);
  });
});

// ─── Filtros de campos exactos ────────────────────────────────────────────────

describe('applyFilters — filtros por campo exacto', () => {
  it('filtra por dificultad Fácil', () => {
    const result = applyFilters(MOCK_CIRCUITS, { ...emptyFilters, difficulty: 'Fácil' });
    expect(result).toHaveLength(2);
    result.forEach(c => expect(c.difficulty).toBe('Fácil'));
  });

  it('filtra por unidad Electrónica Analógica', () => {
    const result = applyFilters(MOCK_CIRCUITS, { ...emptyFilters, unit: 'Electrónica Analógica' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bjt-amplifier');
  });

  it('filtra por tipo Serie', () => {
    const result = applyFilters(MOCK_CIRCUITS, { ...emptyFilters, type: 'Serie' });
    expect(result).toHaveLength(2);
  });

  it('filtra por tema Mallas DC', () => {
    const result = applyFilters(MOCK_CIRCUITS, { ...emptyFilters, topic: 'Mallas DC' });
    expect(result).toHaveLength(2);
  });
});

// ─── Filtro por componentes ───────────────────────────────────────────────────

describe('applyFilters — filtro por componentes', () => {
  it('retorna circuitos que contienen el componente solicitado', () => {
    const result = applyFilters(MOCK_CIRCUITS, { ...emptyFilters, components: ['Transistor BJT'] });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bjt-amplifier');
  });

  it('requiere que el circuito tenga TODOS los componentes seleccionados', () => {
    const result = applyFilters(MOCK_CIRCUITS, {
      ...emptyFilters,
      components: ['Resistencias', 'Transistor BJT'],
    });
    expect(result).toHaveLength(1); // Solo bjt-amplifier tiene ambos
  });

  it('retorna vacío si ningún circuito tiene todos los componentes', () => {
    const result = applyFilters(MOCK_CIRCUITS, {
      ...emptyFilters,
      components: ['Transistor BJT', 'Diodo LED'],
    });
    expect(result).toHaveLength(0);
  });
});

// ─── Combinacion de filtros ───────────────────────────────────────────────────

describe('applyFilters — combinación de múltiples filtros', () => {
  it('combina search + difficulty correctamente', () => {
    const result = applyFilters(MOCK_CIRCUITS, {
      ...emptyFilters,
      search: 'malla',
      difficulty: 'Fácil',
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('una-malla');
  });

  it('combina unit + type correctamente', () => {
    const result = applyFilters(MOCK_CIRCUITS, {
      ...emptyFilters,
      unit: 'Circuitos Eléctricos',
      type: 'Serie',
    });
    expect(result).toHaveLength(2);
  });

  it('filtros muy específicos retornan 0 si no hay coincidencia exacta', () => {
    const result = applyFilters(MOCK_CIRCUITS, {
      ...emptyFilters,
      difficulty: 'Difícil',
      type: 'Serie',
    });
    expect(result).toHaveLength(0);
  });
});
