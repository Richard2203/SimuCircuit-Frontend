/**
 * circuits.js — Dataset local de circuitos
 */

import { Circuit } from '../domain';

export const DIFFICULTIES = ['Fácil', 'Intermedio', 'Difícil'];
export const UNITS        = ['Circuitos Eléctricos', 'Electrónica Analógica'];
export const TOPICS_BY_UNIT = {
  'Circuitos Eléctricos': [
    'Unidades eléctricas', 'Ley de Ohm', 'Código de colores',
    'Elementos Activos de circuitos eléctricos', 'Análisis de Nodos',
    'Teorema de Superposición', 'Análisis de Mallas (Leyes de Kirchhoff de Corriente y Voltaje)',
    'Divisor de Voltaje', 'Divisor de Corriente',
    'Teorema de Norton', 'Teorema de Intercambio de Fuentes', 
    'Theorema de Thévenin', 'Teorema de Máxima Transferencia de Potencia',
    'Circuitos de Corriente Alterna (AC)'
  ],
  'Electrónica Analógica': [
    'Teoria de Semiconductores', 'Transistores BJT', 'Transistores FET',
    'Diodo Zener', 'Diodo Emmisor de Luz', 'Regulador de Voltaje Lineal',
    'Regulador de Voltaje Ajustable'
  ],
};
export const CIRCUIT_TYPES   = ['Serie', 'Paralelo', 'Mixto', 'Mallas', 'Nodal'];
export const COMPONENTS_LIST = [
  'Resistencias', 'Capacitores', 'Bobinas',
  'Regulador LM317', 'Regulador LM7805',
  'Transistor BJT', 'Transistor FET',
  'Diodo rectificador', 'Diodo zener', 'Diodo LED',
];