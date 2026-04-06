export const DIFFICULTIES = ['Fácil', 'Intermedio', 'Difícil'];
export const UNITS        = ['Unidad 1', 'Unidad 2', 'Unidad 3', 'Unidad 4'];
export const TOPICS_BY_UNIT = {
  'Unidad 1': ['Mallas DC', 'Nodal DC'],
  'Unidad 2': ['Transitorio RC', 'Transitorio RL'],
  'Unidad 3': ['Amplificadores', 'Diodos'],
  'Unidad 4': ['Potencia', 'Filtros'],
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
    unit:       'Unidad 1',
    topic:      'Mallas DC',
    type:       'Mallas',
    components: ['Resistencias'],
    voltage: 22, current: 0.5, resistance: 44,
    R: 24, C: 0, L: 0, F: 1, M: 4,
  },
  {
    id:         'una-malla',
    name:       'Circuito de Una Malla',
    difficulty: 'Fácil',
    unit:       'Unidad 1',
    topic:      'Mallas DC',
    type:       'Serie',
    components: ['Resistencias'],
    voltage: 12, current: 0.3, resistance: 40,
    R: 30, C: 0, L: 0, F: 1, M: 1,
  },
]
