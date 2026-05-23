import { Circuit } from '../domain';

export const DIFFICULTIES = ['Fácil', 'Intermedio', 'Difícil'];
export const UNITS        = ['Circuitos Eléctricos', 'Electrónica Analógica'];
// export const TOPICS_BY_UNIT = {
//   'Circuitos Eléctricos': [
//     'Unidades eléctricas', 'Ley de Ohm', 'Código de colores',
//     'Elementos Activos de circuitos eléctricos', 'Análisis de Nodos',
//     'Teorema de Superposición', 'Análisis de Mallas (Leyes de Kirchhoff de Corriente y Voltaje)',
//     'Divisor de Voltaje', 'Divisor de Corriente',
//     'Teorema de Norton', 'Teorema de Intercambio de Fuentes', 
//     'Theorema de Thévenin', 'Teorema de Máxima Transferencia de Potencia',
//     'Circuitos de Corriente Alterna (AC)'
//   ],
//   'Electrónica Analógica': [
//     'Teoria de Semiconductores', 'Transistores BJT', 'Transistores FET',
//     'Diodo Zener', 'Diodo Emmisor de Luz', 'Regulador de Voltaje Lineal',
//     'Regulador de Voltaje Ajustable'
//   ],
// };
export const TOPICS_BY_UNIT = {
  'Circuitos Eléctricos': [
    '1.1 Unidades eléctricas', '1.2 Ley de Ohm' , '1.3 Elementos activos de circuitos eléctricos',
    '1.6 Leyes de Kirchhoff', '2.1 Divisor de voltaje', '2.2 Divisor de corriente', 
    '2.3 Análisis de mallas', '2.4 Análisis de nodos', '2.5.1 Teorema de superposición',
    '2.5.3 Teorema de Thevenin', '2.5.4 Teorema de Norton', '2.5.5 Teorema de máxima transferencia de potencia',
    '3.3 Elementos pasivos de circuitos eléctricos variantes en el tiempo'
  ],
  'Electrónica Analógica': [
    '1.2.1 Diodo rectificador', '1.2.2 Diodo zener', '1.2.3 Diodo emisor de luz',
    '1.3.1 Reguladores de voltaje lineales fijos', '1.4.2 Configuraciones básicas del BJT',
    '1.3.2 Reguladores de voltaje lineales variables',
    '1.4.3 El BJT en estado de conmutación', '1.5 Transistor de Efecto de Campo (FET)'
  ]
};
export const CIRCUIT_TYPES   = ['Serie', 'Paralelo', 'Mixto'];
// export const CIRCUIT_TYPES   = ['Serie', 'Paralelo', 'Mixto', 'Mallas', 'Nodal'];
export const COMPONENTS_LIST = [
  'Resistencias', 'Capacitores', 'Bobinas',
  'Regulador LM317', 'Regulador LM7805',
  'Transistor BJT', 'Transistor FET',
  'Diodo rectificador', 'Diodo zener', 'Diodo LED',
];