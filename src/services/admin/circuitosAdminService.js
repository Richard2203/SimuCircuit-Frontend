import { apiClient }                  from '../simulator/apiClient';
import { CircuitosService }           from '../simulator/CircuitosService';
import { catalogoComponentesService } from './catalogoComponentesService';
import { Circuit }                    from '../../domain';

/**
 * circuitosAdminService — Capa de servicios para el CRUD admin de circuitos.
 */

const OVERRIDES_KEY = 'admin_mock_circuitos_overrides';
const LOCAL_ID_BASE = 100000;

/* Storage helpers (mock CRUD) */

function readOverrides() {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    if (raw) {
      const o = JSON.parse(raw);
      return {
        created: Array.isArray(o.created) ? o.created : [],
        edited:  o.edited && typeof o.edited === 'object' ? o.edited : {},
      };
    }
  } catch { /* ignore */ }
  return { created: [], edited: {} };
}

function writeOverrides(o) {
  try { localStorage.setItem(OVERRIDES_KEY, JSON.stringify(o)); }
  catch { /* ignore */ }
}

function nextLocalId(overrides) {
  const max = overrides.created.reduce((m, c) => Math.max(m, c.id ?? 0), LOCAL_ID_BASE - 1);
  return max + 1;
}

/* API: LECTURAS */

/**
 * Lista todos los circuitos (endpoint admin protegido) aplicando edits
 * del mock local sobre los circuitos reales.
 *
 * @returns {Promise<Circuit[]>}
 */
async function obtenerCircuitos() {
  const overrides = readOverrides();

  let reales = [];
  try {
    const res = await apiClient.get('/api/admin/circuitos-lista');
    const arr = Array.isArray(res?.data) ? res.data
              : Array.isArray(res)       ? res
              : [];
    reales = arr.map((c) => Circuit.fromApiList(c));
  } catch (e) {
    console.warn('[circuitosAdminService] /api/admin/circuitos-lista falló:', e.message);
    reales = [];
  }

  // Aplicar edits del mock sobre los reales 
  const realesProcesados = reales.map((c) => {
    const edit = overrides.edited[c.id];
    if (!edit) return c;
    return new Circuit({ ...c.toJSON(), ...edit });
  });

  // Circuitos creados localmente
  const locales = overrides.created.map((raw) => new Circuit(raw));

  return [...realesProcesados, ...locales];
}

/**
 * Obtiene un circuito completo con su netlist por ID.
 *
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

/* API: CATALOGOS */

/**
 * Catalogos para el formulario de creacion/edicion.
 *
 * @returns {Promise<{
 *   materias: string[],
 *   dificultades: string[],
 *   unidades_tematicas: Record<string, string[]>,
 *   categorias: Array<{id:number, nombre:string, materia:string}>,
 * }>}
 */
async function obtenerCatalogos() {
  const DIFICULTADES_DEFAULT = ['Básico', 'Intermedio', 'Avanzado'];

  let categorias = [];
  try {
    const raw = await catalogoComponentesService.fetchCatalogoCrudo();
    categorias = Array.isArray(raw?.catalogos?.categorias) ? raw.catalogos.categorias : [];
  } catch (e) {
    console.warn('[circuitosAdminService] no se pudo cargar el catalogo:', e.message);
  }

  // Derivar materias unicas
  const materias = [...new Set(categorias.map((c) => c.materia).filter(Boolean))];

  // Derivar unidades_tematicas: { [materia]: [nombre_categoria, ...] }
  const unidades_tematicas = {};
  categorias.forEach((c) => {
    if (!c.materia || !c.nombre) return;
    if (!unidades_tematicas[c.materia]) unidades_tematicas[c.materia] = [];
    if (!unidades_tematicas[c.materia].includes(c.nombre)) {
      unidades_tematicas[c.materia].push(c.nombre);
    }
  });

  return {
    materias,
    dificultades: DIFICULTADES_DEFAULT,
    unidades_tematicas,
    categorias,
  };
}

/* API: ESCRITURAS (mock) */
/**
 * Crea un circuito. Acepta tanto Circuit como JSON crudo.
 *
 * @param {{ circuito: object, netlist: Array, miniatura_svg?: string } | Circuit} arg
 */
async function crearCircuito(arg) {
  await new Promise((r) => setTimeout(r, 250));
  const overrides = readOverrides();

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

  const id   = nextLocalId(overrides);
  const json = { ...circuit.toJSON(), id };
  overrides.created.push(json);
  writeOverrides(overrides);
  return { id };
}

/**
 * Edita un circuito existente.
 *
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
 *
 * @param {{ id: number|string }} arg
 */
async function eliminarCircuito({ id }) {
  const numId     = Number(id);
  const overrides = readOverrides();

  // Caso A: circuito creado localmente con el mock -> quitar de localStorage
  if (numId >= LOCAL_ID_BASE) {
    overrides.created = overrides.created.filter((c) => c.id !== numId);
    writeOverrides(overrides);
    return { mensaje: 'Circuito eliminado correctamente.' };
  }

  // Caso B: circuito real -> endpoint del backend.
  // apiClient lanza ApiError si falla y propagamos.
  await apiClient.delete(`/api/admin/eliminarCircuito/${numId}`);

  // Limpiar cualquier edit-override mock viejo para ese id.
  if (overrides.edited[numId]) {
    delete overrides.edited[numId];
    writeOverrides(overrides);
  }

  return { mensaje: 'Circuito eliminado correctamente.' };
}

/* Helper de debug */

export function _resetMockOverrides() {
  try { localStorage.removeItem(OVERRIDES_KEY); }
  catch { /* ignore */ }
}

/* Export */

export const circuitosAdminService = {
  obtenerCircuitos,
  obtenerCircuitoPorId,
  crearCircuito,
  editarCircuito,
  eliminarCircuito,
  obtenerCatalogos,
};