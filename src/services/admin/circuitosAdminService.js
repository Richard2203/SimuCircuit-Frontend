/**
 * circuitosAdminService — CRUD de circuitos desde el panel de administrador.
 *
 *   LECTURA
 *   Reutiliza los endpoints REALES del simulador a traves de
 *   CircuitosService:
 *     GET /api/circuitos          → lista de circuitos
 *     GET /api/circuitos/:id      → circuito + netlist
 *     GET /api/circuitos/filtros  → catalogo (materias, temas, dificultades)
 *
 *   ESCRITURAS
 *     • Crear  → se agrega a una lista local con id ≥ 100000
 *     • Editar → se guarda como override en un mapa local
 *     • Borrar → se marca el id como "deleted" y se filtra al listar
 *
 */

import { apiClient }        from '../simulator/apiClient';
import { CircuitosService } from '../simulator/CircuitosService';

const OVERRIDES_KEY = 'admin_mock_circuitos_overrides';
const LOCAL_ID_BASE = 100000; // ids locales bien por encima del rango del backend

/* ── Categorías estaticas */

const CATEGORIAS_FALLBACK = [
  'Circuito en Serie', 'Circuito en Paralelo', 'Circuito Mixto (Serie-Paralelo)',
  'Divisor de Voltaje', 'Divisor de Corriente', 'Una Sola Fuente', 'Varias Fuentes',
  'Análisis de Nodos', 'Análisis de Mallas', 'Teorema de Thévenin / Norton',
  'Superposición', 'Máxima Transferencia de Potencia',
  'Corriente Directa (DC)', 'Corriente Alterna (AC)', 'Filtros Pasivos',
  'Respuesta en Frecuencia / Diagramas de Bode', 'Circuitos Transitorios',
  'Diodos: Rectificadores', 'Diodos: Recortadores y Sujetadores',
  'Amplificadores con BJT', 'Amplificadores con FET / MOSFET',
  'Fuentes de Alimentación / Regulación', 'Diodos: LED',
];

/* ── Storage helpers ─────────────────────────────────────────── */

function readOverrides() {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    if (raw) {
      const o = JSON.parse(raw);
      return {
        created: Array.isArray(o.created) ? o.created : [],
        edited:  o.edited && typeof o.edited === 'object' ? o.edited : {},
        deleted: Array.isArray(o.deleted) ? o.deleted : [],
      };
    }
  } catch { /* ignore */ }
  return { created: [], edited: {}, deleted: [] };
}

function writeOverrides(o) {
  try { localStorage.setItem(OVERRIDES_KEY, JSON.stringify(o)); }
  catch { /* ignore */ }
}

function nextLocalId(overrides) {
  const max = overrides.created.reduce((m, c) => Math.max(m, c.id ?? 0), LOCAL_ID_BASE - 1);
  return max + 1;
}

function unwrap(res) {
  return res?.data ?? res;
}

/* ── API: LECTURAS ───────────────────────────────────────────── */

async function obtenerCircuitos() {
  const overrides = readOverrides();

  let reales = [];
  try {
    reales = await CircuitosService.getCircuitos();
  } catch (e) {
    console.warn('[circuitosAdminService] /api/circuitos falló:', e.message);
    reales = [];
  }

  // Aplicar edits y excluir deletes sobre los reales
  const realesProcesados = reales
    .filter((c) => !overrides.deleted.includes(c.id))
    .map((c) => overrides.edited[c.id] ? { ...c, ...overrides.edited[c.id] } : c);

  // Locales (creados desde el admin) — no pasan por delete porque tienen id local
  const locales = overrides.created.filter((c) => !overrides.deleted.includes(c.id));

  return [...realesProcesados, ...locales];
}

/**
 * Obtiene un circuito completo con su netlist por ID.
 */
async function obtenerCircuitoPorId(id) {
  const numId    = Number(id);
  const overrides = readOverrides();

  // Caso A: circuito creado localmente
  if (numId >= LOCAL_ID_BASE) {
    const local = overrides.created.find((c) => c.id === numId);
    if (!local) {
      throw Object.assign(new Error('Circuito no encontrado.'), { status: 404 });
    }
    return {
      circuito: local,
      netlist:  local._netlist ?? [],
    };
  }

  // Caso B: circuito real, posiblemente parchado por un edit local
  const real = await CircuitosService.getCircuitoById(numId);
  const edit = overrides.edited[numId];

  if (edit) {
    return {
      circuito: { ...real.circuito, ...edit },
      netlist:  edit._netlist ?? real.netlist,
    };
  }
  return real;
}

/* ── API: CATALOGOS ──────────────────────────────────────────── */

/**
 * Catalogos para el formulario de creacion/edicion.
 * - materias, temas, dificultades vienen del filtro real del backend.
 * - unidades_tematicas se derivan de la lista de circuitos (campo
 *   `unidad_tematica` de cada circuito agrupado por `materia`).
 * - categorias es una lista estatica 
 */
async function obtenerCatalogos() {
  // Lanzamos las 2 lecturas en paralelo y toleramos fallos
  const [filtrosRes, circuitosRes] = await Promise.allSettled([
    CircuitosService.getFiltros(),
    obtenerCircuitos(),
  ]);

  const filtros = filtrosRes.status === 'fulfilled' ? (filtrosRes.value ?? {}) : {};
  const circuitos = circuitosRes.status === 'fulfilled' ? circuitosRes.value : [];

  // Derivar mapa { materia: [unidades_tematicas...] } de los circuitos reales
  const unidadesMap = {};
  circuitos.forEach((c) => {
    if (!c.materia || !c.unidad_tematica) return;
    if (!unidadesMap[c.materia]) unidadesMap[c.materia] = new Set();
    unidadesMap[c.materia].add(c.unidad_tematica);
  });
  const unidades_tematicas = {};
  Object.entries(unidadesMap).forEach(([m, set]) => { unidades_tematicas[m] = [...set]; });

  return {
    materias:           Array.isArray(filtros.materias)     ? filtros.materias     : [],
    temas:              Array.isArray(filtros.temas)        ? filtros.temas        : [],
    dificultades:       Array.isArray(filtros.dificultades) ? filtros.dificultades : [],
    unidades_tematicas,
    categorias:         CATEGORIAS_FALLBACK,
  };
}

/* ── API: ESCRITURAS (mock) ──────────────────────────────────── */
async function crearCircuito({ circuito, netlist, miniatura_svg }) {
  await new Promise((r) => setTimeout(r, 250));
  const overrides = readOverrides();
  const id = nextLocalId(overrides);

  const registro = {
    id,
    nombre_circuito: circuito.nombre_circuito,
    descripcion:     circuito.descripcion,
    dificultad:      circuito.dificultad,
    materia:         circuito.materia,
    unidad_tematica: circuito.unidad_tematica,
    tema:            circuito.tema,
    categorias:      circuito.categorias ?? [],
    tipos_componentes: circuito.tipos_componentes ?? [],
    miniatura_svg:   miniatura_svg ?? '<svg/>',
    activo:          1,
    _netlist:        netlist ?? [],  
  };

  overrides.created.push(registro);
  writeOverrides(overrides);
  return { id };
}

/**
 * Edita un circuito existente.
*/
async function editarCircuito({ id, circuito, netlist, miniatura_svg }) {
  await new Promise((r) => setTimeout(r, 200));
  const numId = Number(id);
  const overrides = readOverrides();

  const datos = {
    nombre_circuito: circuito.nombre_circuito,
    descripcion:     circuito.descripcion,
    dificultad:      circuito.dificultad,
    materia:         circuito.materia,
    unidad_tematica: circuito.unidad_tematica,
    tema:            circuito.tema,
    categorias:      circuito.categorias ?? [],
    tipos_componentes: circuito.tipos_componentes ?? [],
    miniatura_svg:   miniatura_svg ?? '<svg/>',
    _netlist:        netlist ?? [],
  };

  if (numId >= LOCAL_ID_BASE) {
    // Editar uno creado localmente
    const idx = overrides.created.findIndex((c) => c.id === numId);
    if (idx === -1) {
      throw Object.assign(new Error('Circuito local no encontrado.'), { status: 404 });
    }
    overrides.created[idx] = { ...overrides.created[idx], ...datos };
  } else {
    // Override sobre uno real
    overrides.edited[numId] = datos;
  }
  writeOverrides(overrides);
  return { mensaje: 'Circuito actualizado correctamente.' };
}

/**
 * Elimina un circuito.s
 */
async function eliminarCircuito({ id }) {
  await new Promise((r) => setTimeout(r, 150));
  const numId = Number(id);
  const overrides = readOverrides();

  if (numId >= LOCAL_ID_BASE) {
    overrides.created = overrides.created.filter((c) => c.id !== numId);
  } else {
    if (!overrides.deleted.includes(numId)) overrides.deleted.push(numId);
    delete overrides.edited[numId];
  }
  writeOverrides(overrides);
  return { mensaje: 'Circuito eliminado correctamente.' };
}

/* ── Helper de debug (útil durante desarrollo) ───────────────── */

export function _resetMockOverrides() {
  try { localStorage.removeItem(OVERRIDES_KEY); }
  catch { /* ignore */ }
}

/* ── Export ──────────────────────────────────────────────────── */

export const circuitosAdminService = {
  obtenerCircuitos,
  obtenerCircuitoPorId,
  crearCircuito,
  editarCircuito,
  eliminarCircuito,
  obtenerCatalogos,
};

// Suppress "unused" warning de apiClient para futuro uso real
export { apiClient as _futureApiClient };
