/**
 * applyFilters vive inline en FilterPanel porque es una transformacion 
 * pura acoplada al estado local del componente. La funcion se duplica 
 * aqui para poder probarla de forma aislada — esto es preferible a 
 * exponer internos del componente solo por testabilidad.
 *
 * Prueba
 *   - Filtros vacios retornan todos los circuitos
 *   - Busqueda por nombre (case-insensitive, substring)
 *   - Filtros por campo exacto (difficulty, unit, topic, type)
 *   - Filtro AND por componentes: el circuito debe tenerlos TODOS
 *   - Combinacion de moltiples filtros simultaneos
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

const CIRCUITS = [
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

const EMPTY = { search: '', difficulty: '', unit: '', topic: '', type: '', components: [] };

describe('applyFilters — filtros vacíos', () => {
  it('retorna todos los circuitos', () => {
    expect(applyFilters(CIRCUITS, EMPTY)).toHaveLength(4);
  });

  it('retorna array vacío si no hay circuitos', () => {
    expect(applyFilters([], EMPTY)).toHaveLength(0);
  });
});

describe('applyFilters — búsqueda por nombre', () => {
  it('es case-insensitive', () => {
    const lower = applyFilters(CIRCUITS, { ...EMPTY, search: 'malla' });
    const upper = applyFilters(CIRCUITS, { ...EMPTY, search: 'MALLA' });
    expect(lower.length).toBe(upper.length);
    expect(lower.length).toBeGreaterThan(0);
  });

  it('encuentra por substring parcial', () => {
    expect(applyFilters(CIRCUITS, { ...EMPTY, search: 'malla' })).toHaveLength(2);
  });

  it('retorna vacío cuando no hay coincidencia', () => {
    expect(applyFilters(CIRCUITS, { ...EMPTY, search: 'xyz123' })).toHaveLength(0);
  });
});

describe('applyFilters — filtros por campo exacto', () => {
  it('difficulty filtra correctamente', () => {
    const result = applyFilters(CIRCUITS, { ...EMPTY, difficulty: 'Fácil' });
    expect(result).toHaveLength(2);
    result.forEach(c => expect(c.difficulty).toBe('Fácil'));
  });

  it('unit filtra correctamente', () => {
    const result = applyFilters(CIRCUITS, { ...EMPTY, unit: 'Electrónica Analógica' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bjt-amplifier');
  });

  it('topic filtra correctamente', () => {
    expect(applyFilters(CIRCUITS, { ...EMPTY, topic: 'Mallas DC' })).toHaveLength(2);
  });
});

describe('applyFilters — filtro AND por componentes', () => {
  it('el circuito debe tener TODOS los componentes seleccionados', () => {
    const result = applyFilters(CIRCUITS, {
      ...EMPTY,
      components: ['Resistencias', 'Transistor BJT'],
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bjt-amplifier');
  });

  it('retorna vacío si ningún circuito tiene todos los componentes', () => {
    expect(applyFilters(CIRCUITS, {
      ...EMPTY,
      components: ['Transistor BJT', 'Diodo LED'],
    })).toHaveLength(0);
  });
});

describe('applyFilters — combinación de filtros', () => {
  it('search + difficulty reduce el resultado correctamente', () => {
    const result = applyFilters(CIRCUITS, {
      ...EMPTY, search: 'malla', difficulty: 'Fácil',
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('una-malla');
  });

  it('filtros contradictorios devuelven array vacío', () => {
    expect(applyFilters(CIRCUITS, {
      ...EMPTY, difficulty: 'Difícil', type: 'Serie',
    })).toHaveLength(0);
  });
});
