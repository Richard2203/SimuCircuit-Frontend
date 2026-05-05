import { apiClient }        from '../simulator/apiClient';
import { CircuitosService } from '../simulator/CircuitosService';
import { Circuit }          from '../../domain';

const OVERRIDES_KEY = 'admin_mock_circuitos_overrides';
const LOCAL_ID_BASE = 100000;

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

/* ── Storage helpers ──────────────────────────────────────────────────── */

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

/* -- API: LECTURAS ----------------------------------------------------- */

/**
 * Lista todos los circuitos aplicando edits y filtrando deletes.
 * @returns {Promise<Circuit[]>}
 */
async function obtenerCircuitos() {
  const overrides = readOverrides();

  let reales = [];
  try {
    reales = await CircuitosService.getCircuitos();
  } catch (e) {
    console.warn('[circuitosAdminService] /api/circuitos falló:', e.message);
    reales = [];
  }

  const realesProcesados = reales
    .filter((c) => !overrides.deleted.includes(c.id))
    .map((c) => {
      const edit = overrides.edited[c.id];
      if (!edit) return c;
      // Aplicar override sobre la instancia: clonar y sobrescribir campos.
      return new Circuit({ ...c.toJSON(), ...edit });
    });

  const locales = overrides.created
    .filter((c) => !overrides.deleted.includes(c.id))
    .map((raw) => new Circuit(raw));

  return [...realesProcesados, ...locales];
}

/**
 * Obtiene un circuito completo con su netlist por ID.
 * @param {number|string} id
 * @returns {Promise<{ circuito: Circuit, netlist: import('../../domain').Component[] }>}
 */
async function obtenerCircuitoPorId(id) {
  const numId     = Number(id);
  const overrides = readOverrides();

  // Caso A: circuito creado localmente
  if (numId >= LOCAL_ID_BASE) {
    const localRaw = overrides.created.find((c) => c.id === numId);
    if (!localRaw) {
      throw Object.assign(new Error('Circuito no encontrado.'), { status: 404 });
    }
    const circuit = new Circuit(localRaw);
    return { circuito: circuit, netlist: circuit.netlist };
  }

  // Caso B: circuito real, posiblemente parchado por un edit local
  const real = await CircuitosService.getCircuitoById(numId);
  const edit = overrides.edited[numId];

  if (edit) {
    const merged = new Circuit({ ...real.toJSON(), ...edit });
    return { circuito: merged, netlist: merged.netlist };
  }
  return { circuito: real, netlist: real.netlist };
}

/* --- API: CATALOGOS ---------------------------------------------------- */

/**
 * Catalogos para el formulario de creacion/edicion.
 * @returns {Promise<{
 *   materias: string[],
 *   temas: string[],
 *   dificultades: string[],
 *   unidades_tematicas: Record<string, string[]>,
 *   categorias: string[],
 * }>}
 */
async function obtenerCatalogos() {
  const [filtrosRes, circuitosRes] = await Promise.allSettled([
    CircuitosService.getFiltros(),
    obtenerCircuitos(),
  ]);

  const filtros   = filtrosRes.status   === 'fulfilled' ? (filtrosRes.value ?? {}) : {};
  const circuitos = circuitosRes.status === 'fulfilled' ? circuitosRes.value : [];

  // Derivar { materia: [unidades_tematicas...] } a partir de los circuitos
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

/* --- API: ESCRITURAS (mock) ---------------------------------------------------- */

/**
 * Crea un circuito.  Acepta tanto Circuit como JSON crudo.
 *
 * @param {{ circuito: object, netlist: Array, miniatura_svg?: string } | Circuit} arg
 */
async function crearCircuito(arg) {
  await new Promise((r) => setTimeout(r, 250));
  const overrides = readOverrides();

  // Aceptar tanto un Circuit como el contrato { circuito, netlist, miniatura_svg }
  let circuit;
  if (arg instanceof Circuit) {
    circuit = arg;
  } else {
    circuit = new Circuit({
      ...(arg.circuito ?? {}),
      nombre:        arg.circuito?.nombre_circuito ?? arg.circuito?.nombre ?? '',
      netlist:       arg.netlist ?? [],
      miniatura_svg: arg.miniatura_svg ?? '<svg/>',
    });
  }

  const id = nextLocalId(overrides);
  const json = { ...circuit.toJSON(), id };
  overrides.created.push(json);
  writeOverrides(overrides);
  return { id };
}

/**
 * Edita un circuito existente.
 * @param {{ id: number|string, circuito: object, netlist: Array, miniatura_svg?: string } | (Circuit & { id: number|string })} arg
 */
async function editarCircuito(arg) {
  await new Promise((r) => setTimeout(r, 200));
  const overrides = readOverrides();

  const id = Number(arg.id);
  let circuit;
  if (arg instanceof Circuit) {
    circuit = arg;
  } else {
    circuit = new Circuit({
      ...(arg.circuito ?? {}),
      nombre:        arg.circuito?.nombre_circuito ?? arg.circuito?.nombre ?? '',
      netlist:       arg.netlist ?? [],
      miniatura_svg: arg.miniatura_svg ?? '<svg/>',
    });
  }
  const datos = circuit.toJSON();

  if (id >= LOCAL_ID_BASE) {
    const idx = overrides.created.findIndex((c) => c.id === id);
    if (idx === -1) {
      throw Object.assign(new Error('Circuito local no encontrado.'), { status: 404 });
    }
    overrides.created[idx] = { ...overrides.created[idx], ...datos, id };
  } else {
    overrides.edited[id] = datos;
  }
  writeOverrides(overrides);
  return { mensaje: 'Circuito actualizado correctamente.' };
}

/**
 * Elimina un circuito.
 * @param {{ id: number|string }} arg
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

/* ── Helper de debug ──────────────────────────────────────────────────── */

export function _resetMockOverrides() {
  try { localStorage.removeItem(OVERRIDES_KEY); }
  catch { /* ignore */ }
}

/* ── Export ───────────────────────────────────────────────────────────── */

export const circuitosAdminService = {
  obtenerCircuitos,
  obtenerCircuitoPorId,
  crearCircuito,
  editarCircuito,
  eliminarCircuito,
  obtenerCatalogos,
};

export { apiClient as _futureApiClient };
