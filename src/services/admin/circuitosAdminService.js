import { apiClient }                  from '../simulator/apiClient';
import { CircuitosService }           from '../simulator/CircuitosService';
import { catalogoComponentesService } from './catalogoComponentesService';
import { Circuit }                    from '../../domain';

/**
 * circuitosAdminService — Capa de servicios para el CRUD admin de circuitos.
 */

// LOCAL_ID_BASE se mantiene solo para que obtenerCircuitos / obtenerCircuitoPorId
// puedan distinguir IDs reales de IDs legacy guardados en localStorage.
const LOCAL_ID_BASE = 100000;

/* Storage helpers (solo lectura de overrides legacy — escritura migrada al backend) */

function readOverrides() {
  try {
    const raw = localStorage.getItem('admin_mock_circuitos_overrides');
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

  // Caso B: circuito real
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

/* API: ESCRITURAS */

/**
 * Resuelve `categorias` a un array de IDs numericos.
 * El payload de toBackendPayload() lleva circuit.categorias que puede ser:
 *   - array de números  [2, 5]               -> ya listo
 *   - array de strings con nombres de temas  -> buscar en catalogo
 *   - array de objetos { id, nombre }        -> extraer id
 *
 * @param {Array} categorias
 * @param {Array<{id:number, nombre:string}>} catalogoCategorias
 * @returns {number[]}
 */
function resolverCategoriasIds(categorias, catalogoCategorias = []) {
  if (!Array.isArray(categorias) || categorias.length === 0) return [];
  return categorias
    .map((cat) => {
      if (typeof cat === 'number') return cat;
      if (typeof cat === 'string') {
        const found = catalogoCategorias.find((c) => c.nombre === cat);
        return found ? found.id : null;
      }
      if (cat && typeof cat === 'object' && cat.id != null) return Number(cat.id);
      return null;
    })
    .filter((id) => id != null && !Number.isNaN(id));
}

/**
 * Obtiene el catalogo de categorias (con cache inline para no hacer 2 fetches
 * en la misma operacion crear/editar).
 */
async function fetchCatalogoCategorias() {
  try {
    const raw = await catalogoComponentesService.fetchCatalogoCrudo();
    return raw?.catalogos?.categorias ?? [];
  } catch {
    return [];
  }
}

/**
 * Normaliza el arg al payload { circuito, componentes, nodos } que espera el backend.
 * Resuelve las categorias a IDs numericos.
 *
 * @param {{ circuito: object, componentes: Array, nodos: Array } | Circuit} arg
 * @param {Array<{id:number, nombre:string}>} catalogoCategorias
 * @returns {object}
 */
function normalizarPayload(arg, catalogoCategorias) {
  const payload = arg instanceof Circuit ? arg.toBackendPayload() : arg;
  return {
    ...payload,
    circuito: {
      ...payload.circuito,
      categorias: resolverCategoriasIds(
        payload.circuito?.categorias ?? [],
        catalogoCategorias
      ),
    },
  };
}

/**
 * Crea un circuito en el backend.
 *
 * @param {{ circuito: object, componentes: Array, nodos: Array } | Circuit} arg
 * @returns {Promise<{ id: number }>}
 */
async function crearCircuito(arg) {
  const catalogoCategorias = await fetchCatalogoCategorias();
  const payload = normalizarPayload(arg, catalogoCategorias);
  const res = await apiClient.post('/api/admin/crearCircuito', payload);
  return { id: res?.circuito_id ?? res?.id ?? null };
}

/**
 * Edita un circuito existente en el backend.
 *
 * @param {{ id: number|string, circuito: object, componentes: Array, nodos: Array } | (Circuit & { id: number|string })} arg
 * @returns {Promise<{ mensaje: string }>}
 */
async function editarCircuito(arg) {
  const numId = Number(arg.id);
  if (!numId || numId <= 0) {
    throw Object.assign(new Error('ID de circuito inválido para editar.'), { status: 400 });
  }

  const catalogoCategorias = await fetchCatalogoCategorias();
  const payload = normalizarPayload(arg, catalogoCategorias);

  // Quitar id del payload raiz (ya va en la URL)
  const { id: _id, ...payloadSinId } = payload;

  const res = await apiClient.put(`/api/admin/modificarCircuito/${numId}`, payloadSinId);
  return { mensaje: res?.mensaje ?? 'Circuito actualizado correctamente.' };
}

/**
 * Elimina un circuito.
 *
 * @param {{ id: number|string }} arg
 */
async function eliminarCircuito({ id }) {
  const numId     = Number(id);
  const overrides = readOverrides();

  // Caso A: circuito creado localmente con el mock legacy -> quitar de localStorage
  if (numId >= LOCAL_ID_BASE) {
    overrides.created = overrides.created.filter((c) => c.id !== numId);
    try { localStorage.setItem('admin_mock_circuitos_overrides', JSON.stringify(overrides)); }
    catch { /* ignore */ }
    return { mensaje: 'Circuito eliminado correctamente.' };
  }

  // Caso B: circuito real -> endpoint del backend.
  await apiClient.delete(`/api/admin/eliminarCircuito/${numId}`);

  // Limpiar cualquier edit-override mock viejo para ese id.
  if (overrides.edited[numId]) {
    delete overrides.edited[numId];
    try { localStorage.setItem('admin_mock_circuitos_overrides', JSON.stringify(overrides)); }
    catch { /* ignore */ }
  }

  return { mensaje: 'Circuito eliminado correctamente.' };
}

/* Helper de debug: limpia overrides legacy del localStorage */

export function _resetMockOverrides() {
  try { localStorage.removeItem('admin_mock_circuitos_overrides'); }
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