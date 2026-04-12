export const DIFFICULTIES = ['Fácil', 'Intermedio', 'Difícil'];
export const UNITS        = ['Circuitos Eléctricos', 'Electrónica Analógica'];
export const TOPICS_BY_UNIT = {
  'Circuitos Eléctricos': ['Mallas DC', 'Ley de Ohm', 'Fuentes de Voltaje Independientes', 'Fuentes de Corriente Independientes', 'Ley de Kirchhoff de Corriente', 'Ley de Kirchhoff de Voltaje', 'Divisor de Voltaje', 'Divisor de Corriente', 'Análisis de Mallas', 'Análisis de Nodos', 'Teorema de Thevenin', 'Teorema de Norton', 'Teorema de Superposición', 'Teorema de Intercambio de Fuentes', 'Theorema de Thévenin', 'Teorema de Norton', 'Teorema de Máxima Transferencia de Potencia'],
  'Electrónica Analógica': ['Teoria de Semiconductores', 'Transistores BJT', 'Transistores FET', 'Transitores BJT'],
};
export const CIRCUIT_TYPES  = ['Serie', 'Paralelo', 'Mixto', 'Mallas', 'Nodal'];
export const COMPONENTS_LIST = [
  'Resistencias', 'Capacitores', 'Bobinas',
  'Regulador LM317', 'Regulador LM7805',
  'Transistor BJT', 'Transistor FET',
  'Diodo rectificador', 'Diodo zener', 'Diodo LED',
];

// Circuitos con diagrama visual real
export const ALL_CIRCUITS = [
  {
    id:         'cuatro-mallas',
    name:       'Circuito de Cuatro Mallas',
    difficulty: 'Intermedio',
    unit:       'Circuitos Eléctricos',
    topic:      'Mallas DC',
    type:       'Mallas',
    components: ['Resistencias'],
    voltage: 22, current: 0.5, resistance: 9,
    R: 9, C: 0, L: 0, F: 2, M: 4,
  },
  {
    id:         'una-malla',
    name:       'Circuito de Una Malla',
    difficulty: 'Fácil',
    unit:       'Circuitos Eléctricos',
    topic:      'Mallas DC',
    type:       'Serie',
    components: ['Resistencias'],
    voltage: 12, current: 0.3, resistance: 4,
    R: 3, C: 0, L: 0, F: 1, M: 1,
  },
]
