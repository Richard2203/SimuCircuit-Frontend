/**
 * circuitosAdminService — Dominio: CRUD de circuitos (panel administrador)
 */

import { apiClient } from '../simulator/apiClient';

/** Mock de circuitos para pruebas */
const MOCK_CIRCUITOS = [
  {
    id: 1,
    nombre_circuito: 'Circuito Resistivo Mixto Básico',
    descripcion: 'Circuito con 4 resistencias en configuración serie-paralelo.',
    dificultad: 'Básico',
    materia: 'Circuitos Eléctricos',
    unidad_tematica: 'Fundamentos de Circuitos Eléctricos',
    tema: '1. Ley de Ohm.\n2. Código de colores.',
    miniatura_svg: '<svg>...</svg>',
  },
];

/** Mock de catalogos */
const MOCK_CATALOGOS = {
  materias: ['Circuitos Eléctricos', 'Electrónica Analógica'],
  unidades_tematicas: {
    'Circuitos Eléctricos': [
      'Fundamentos de Circuitos Eléctricos',
      'Análisis de Circuitos en Corriente Directa.',
      'Análisis del Circuito en el Dominio de la Frecuencia',
    ],
    'Electrónica Analógica': ['Dispositivos Semiconductores'],
  },
  temas: [
    'Ley de Ohm', 'Código de colores', 'Análisis de Nodos',
    'Análisis de Mallas', 'Divisor de Voltaje', 'Divisor de Corriente',
    'Teorema de Superposición', 'Teoremas de Thévenin y Norton',
    'Máxima Transferencia de Potencia', 'Circuitos de Corriente Alterna (AC)',
    'Teoría de Semiconductores',
  ],
  categorias: [
    'Circuito en Serie', 'Circuito en Paralelo', 'Circuito Mixto (Serie-Paralelo)',
    'Divisor de Voltaje', 'Divisor de Corriente', 'Una Sola Fuente', 'Varias Fuentes',
    'Análisis de Nodos', 'Análisis de Mallas', 'Teorema de Thévenin / Norton',
    'Superposición', 'Máxima Transferencia de Potencia', 'Corriente Directa (DC)',
    'Corriente Alterna (AC)', 'Filtros Pasivos', 'Respuesta en Frecuencia / Diagramas de Bode',
    'Circuitos Transitorios', 'Diodos: Rectificadores', 'Diodos: Recortadores y Sujetadores',
    'Amplificadores con BJT', 'Amplificadores con FET / MOSFET',
    'Fuentes de Alimentación / Regulación', 'Diodos: LED',
  ],
};

/**
 * Obtiene la lista de todos los circuitos.
 * @returns {Promise<Array>}
 */
async function obtenerCircuitos() {
  // TODO: conectar con backend
  // return apiClient.get('/api/admin/circuitos');
  return MOCK_CIRCUITOS;
}

/**
 * Obtiene un circuito completo por ID (metadatos + netlist).
 * @param {{ id: number }} payload
 * @returns {Promise<{ circuito: object, netlist: Array } | null>}
 */
async function obtenerCircuitoPorId({ id }) {
  // TODO: conectar con backend
  // return apiClient.get(`/api/admin/circuitos/${id}`);
  const circuito = MOCK_CIRCUITOS.find((c) => c.id === id) ?? null;
  return circuito ? { circuito, netlist: [] } : null;
}

/**
 * Crea un nuevo circuito.
 * @param {{ circuito: object, netlist: Array, miniatura_svg: string }} payload
 * @returns {Promise<{ id: number } | null>}
 */
async function crearCircuito({ circuito, netlist, miniatura_svg }) {
  // TODO: conectar con backend
  // return apiClient.post('/api/admin/circuitos', { circuito, netlist, miniatura_svg });
  console.log('[mock] Creando circuito:', circuito);
  return { id: Date.now() };
}

/**
 * Edita un circuito existente.
 * @param {{ id: number, circuito: object, netlist: Array, miniatura_svg: string }} payload
 * @returns {Promise<{ mensaje: string } | null>}
 */
async function editarCircuito({ id, circuito, netlist, miniatura_svg }) {
  // TODO: conectar con backend
  // return apiClient.post(`/api/admin/circuitos/${id}`, { circuito, netlist, miniatura_svg });
  console.log('[mock] Editando circuito:', id, circuito);
  return { mensaje: 'Circuito actualizado correctamente.' };
}

/**
 * Elimina un circuito por ID.
 * @param {{ id: number }} payload
 * @returns {Promise<{ mensaje: string } | null>}
 */
async function eliminarCircuito({ id }) {
  // TODO: conectar con backend
  // return apiClient.post(`/api/admin/circuitos/${id}/eliminar`, {});
  console.log('[mock] Eliminando circuito:', id);
  return { mensaje: 'Circuito eliminado correctamente.' };
}

/**
 * Retorna las listas de opciones para los dropdowns del formulario.
 * Incluye: materias, unidades_tematicas, temas, categorias.
 * @returns {Promise<object>}
 */
async function obtenerCatalogos() {
  // TODO: conectar con backend
  // return apiClient.get('/api/admin/circuitos/catalogos');
  return MOCK_CATALOGOS;
}

export const circuitosAdminService = {
  obtenerCircuitos,
  obtenerCircuitoPorId,
  crearCircuito,
  editarCircuito,
  eliminarCircuito,
  obtenerCatalogos,
};
