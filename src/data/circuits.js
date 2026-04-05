/**
 * data/circuits.js
 * Datos estáticos y generador de circuitos para la biblioteca.
 * En una app real, esto vendría de una API.
 */

export const DIFFICULTIES = ['Fácil', 'Intermedio', 'Difícil'];

export const UNITS = ['Unidad 1', 'Unidad 2', 'Unidad 3', 'Unidad 4'];

export const TOPICS_BY_UNIT = {
  'Unidad 1': ['Mallas DC', 'Nodal DC'],
  'Unidad 2': ['Transitorio RC', 'Transitorio RL'],
  'Unidad 3': ['Amplificadores', 'Diodos'],
  'Unidad 4': ['Potencia', 'Filtros'],
};

export const CIRCUIT_TYPES = ['Serie', 'Paralelo', 'Mixto', 'Mallas', 'Nodal'];

export const COMPONENTS_LIST = [
  'Resistencias',
  'Capacitores',
  'Bobinas',
  'Regulador LM317',
  'Regulador LM7805',
  'Transistor BJT',
  'Transistor FET',
  'Diodo rectificador',
  'Diodo zener',
  'Diodo LED',
];

/**
 * Genera un conjunto de circuitos de ejemplo.
 * @param {number} count - Número de circuitos a generar
 * @returns {Array<Circuit>}
 */
export function generateCircuits(count = 60) {
  const names = ['Mallas', 'Nodal', 'Serie', 'Paralelo', 'RC', 'RL', 'RLC', 'Amp', 'Diodo', 'Potencia'];

  return Array.from({ length: count }, (_, i) => {
    const id = i + 1;
    const difficulty = DIFFICULTIES[i % 3];
    const unit = UNITS[i % 4];
    const topicsForUnit = TOPICS_BY_UNIT[unit];
    const topic = topicsForUnit[i % topicsForUnit.length];
    const type = CIRCUIT_TYPES[i % CIRCUIT_TYPES.length];
    const name = names[i % names.length];

    return {
      id,
      name: `Circuito ${name} ${Math.ceil(id / 3)}-${(id % 3) + 1}`,
      difficulty,
      unit,
      topic,
      type,
      components: COMPONENTS_LIST.filter((_, idx) => (id + idx) % 4 === 0),
      // Parámetros eléctricos
      R: Math.floor(Math.random() * 10) + 1,
      C: Math.floor(Math.random() * 5),
      L: Math.floor(Math.random() * 4),
      F: Math.floor(Math.random() * 5) + 1,
      M: Math.floor(Math.random() * 5) + 1,
      voltage: (Math.floor(Math.random() * 20) + 1) * 5,
      current: parseFloat((Math.random() * 9 + 1).toFixed(1)),
      resistance: Math.floor(Math.random() * 900) + 10,
    };
  });
}

/** Dataset singleton */
export const ALL_CIRCUITS = generateCircuits(60);
