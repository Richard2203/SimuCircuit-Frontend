/**
 * modelosCatalog.js - Transformaciones y helpers para los catalogos de componentes.
 * Los componentes consumen el catalogo via useCatalogoComponentes().
 */

/* Helpers */

/**
 * Extrae el codigo entre el ultimo par de parentesis del nombre.
 */
function extraerCodigo(nombre) {
  if (!nombre) return '';
  const matches = [...String(nombre).matchAll(/\(([^()]+)\)/g)];
  return matches.length > 0 ? matches[matches.length - 1][1].trim() : '';
}

/**
 * Para LEDs, deriva un value desde el nombre.
 */
function extraerValueLED(nombre, fallbackId) {
  if (!nombre) return `LED_${fallbackId ?? ''}`;
  const limpio = String(nombre).replace(/^LED\s+/i, '').trim();
  const palabras = limpio.split(/\s+/);
  const primera = (palabras[0] ?? '').toUpperCase();
  if (primera === 'BLANCO' && palabras[1]?.toLowerCase().startsWith('ultra')) {
    return 'BLANCO UB';
  }
  return primera || `LED_${fallbackId ?? ''}`;
}

/** parseFloat seguro (devuelve 0 si no es numero). */
function num(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

/** Categoriza los diodos: ¿es LED (cualquier subtipo)? */
function esTipoLED(tipo) {
  return tipo === 'LED' || tipo === 'LED_Ultrabrillante' || tipo === 'LED_IR';
}

/* Constructores por tipo */

function construirModelosBJT(bjts = []) {
  return bjts.map((b) => ({
    value: extraerCodigo(b.componente_nombre) || `BJT_${b.id}`,
    label: (b.componente_nombre ?? '').replace(/^Transistor\s+/i, ''),
    params: {
      tipo:                   b.tipo,
      configuracion:          b.configuracion,
      beta:                   num(b.beta),
      vbe_saturacion:         num(b.vbe_saturacion),
      vce_saturacion:         num(b.vce_saturacion),
      corriente_colector_max: num(b.corriente_colector_max),
      potencia_maxima:        num(b.potencia_maxima),
      frecuencia_transicion:  num(b.frecuencia_transicion),
      modo_operacion:         b.modo_operacion,
    },
  }));
}

function construirModelosFET(fets = []) {
  return fets.map((f) => ({
    value: extraerCodigo(f.componente_nombre) || `FET_${f.id}`,
    label: (f.componente_nombre ?? '').replace(/^Transistor\s+/i, ''),
    params: {
      tipo:           f.tipo,
      idss:           num(f.idss),
      vp:             num(f.vp),
      gm:             num(f.gm),
      rd:             num(f.rd),
      configuracion:  f.configuracion,
      modo_operacion: f.modo_operacion,
    },
  }));
}

function construirModelosRegulador(regs = []) {
  return regs.map((r) => ({
    value: extraerCodigo(r.componente_nombre) || `REG_${r.id}`,
    label: (r.componente_nombre ?? '').replace(/^Regulador\s+/i, ''),
    params: {
      tipo:                r.tipo,
      voltaje_salida:      num(r.voltaje_salida),
      corriente_maxima:    num(r.corriente_maxima),
      voltaje_entrada_min: num(r.voltaje_entrada_min),
      voltaje_entrada_max: num(r.voltaje_entrada_max),
      dropout_voltage:     num(r.dropout_voltage),
      disipacion_maxima:   num(r.disipacion_maxima),
      tolerancia:          num(r.tolerancia),
    },
  }));
}

function construirModelosDiodo(diodos = []) {
  return diodos
    .filter((d) => !esTipoLED(d.tipo))
    .map((d) => ({
      value: extraerCodigo(d.componente_nombre) || `DIODO_${d.id}`,
      label: (d.componente_nombre ?? '').replace(/^Diodo\s+/i, ''),
      params: {
        tipo:            d.tipo,
        corriente_max:   num(d.corriente_max),
        voltaje_inv_max: num(d.voltaje_inv_max),
        caida_tension:   num(d.caida_tension),
        rz:              num(d.rz),
        is_saturacion:   d.is_saturacion ?? '1e-14',
      },
    }));
}

function construirModelosLED(diodos = []) {
  return diodos
    .filter((d) => esTipoLED(d.tipo))
    .map((d) => ({
      value: extraerValueLED(d.componente_nombre, d.id),
      label: d.componente_nombre ?? '',
      params: {
        tipo:            d.tipo,
        corriente_max:   num(d.corriente_max),
        voltaje_inv_max: num(d.voltaje_inv_max),
        caida_tension:   num(d.caida_tension),
        rz:              num(d.rz),
        is_saturacion:   d.is_saturacion ?? '1e-14',
      },
    }));
}

/* API pública del modulo */

/**
 * El admin elige una unidad sin filtrado por materia (decision de producto).
 * El dropdown de "tema" filtra las categorías por:
 *   - materia seleccionada
 *   - prefijo numerico de la unidad tematica
 */
const UNIDADES_TEMATICAS_FALLBACK = [
  { nombre: '1. Fundamentos de Circuitos Eléctricos' },
  { nombre: '2. Análisis de Circuitos en Corriente Directa' },
  { nombre: '3. Análisis del Circuito en el Dominio de la Frecuencia' },
  { nombre: '1. Dispositivos Semiconductores' },
];

/**
 * Punto de entrada: transforma el JSON crudo del endpoint
 *   GET /api/admin/circuitos-lista/componentes
 * en la estructura de catálogos que consume el frontend.
 *
 * @param {object} raw - JSON crudo del backend
 * @returns {{
 *   MODELOS_BJT: Array,
 *   MODELOS_FET: Array,
 *   MODELOS_REGULADOR: Array,
 *   MODELOS_DIODO: Array,
 *   MODELOS_LED: Array,
 *   categorias: Array<{id:number, nombre:string, materia:string}>,
 *   unidades_tematicas: Array<{nombre:string}>,
 *   unidades_medida: Array,
 *   fuentes: object,
 * }}
 */
export function construirCatalogosDesdeAPI(raw) {
  const componentes = raw?.componentes ?? {};
  const semis       = componentes.semiconductores ?? {};
  const catalogos   = raw?.catalogos ?? {};

  // El backend envia unidad_tematica  como array.
  // Internamente lo guardamos como unidades_tematicas por claridad.
  const unidadesDelBackend = catalogos.unidad_tematica;

  return {
    MODELOS_BJT:       construirModelosBJT(semis.transistores_bjt),
    MODELOS_FET:       construirModelosFET(semis.transistores_fet),
    MODELOS_REGULADOR: construirModelosRegulador(componentes.reguladores_voltaje),
    MODELOS_DIODO:     construirModelosDiodo(semis.diodos),
    MODELOS_LED:       construirModelosLED(semis.diodos),

    categorias:         Array.isArray(catalogos.categorias) ? catalogos.categorias : [],
    unidades_tematicas: Array.isArray(unidadesDelBackend) && unidadesDelBackend.length > 0
                          ? unidadesDelBackend
                          : UNIDADES_TEMATICAS_FALLBACK,
    unidades_medida:    Array.isArray(catalogos.unidades_medida) ? catalogos.unidades_medida : [],
    fuentes:            componentes.fuentes ?? {},
  };
}

/**
 * Devuelve los params de un modelo dado su value.
 *
 * @param {Array<{ value: string, params: object }>} catalogo
 * @param {string} value
 * @returns {object | null}
 */
export function paramsDeModelo(catalogo, value) {
  if (!value) return null;
  const found = (catalogo ?? []).find((m) => m.value === value);
  return found ? { ...found.params } : null;
}

/**
 * Verifica si un value corresponde a un LED.
 *
 * @param {Array} modelosLED - El array MODELOS_LED del catalogo cargado
 * @param {string} value
 * @returns {boolean}
 */
export function esModeloLED(modelosLED, value) {
  if (!value || !Array.isArray(modelosLED)) return false;
  return modelosLED.some((m) => m.value === value);
}

/**
 * Catalogo vacio inicial (placeholder mientras se carga).
 */
export const CATALOGO_VACIO = {
  MODELOS_BJT:        [],
  MODELOS_FET:        [],
  MODELOS_REGULADOR:  [],
  MODELOS_DIODO:      [],
  MODELOS_LED:        [],
  categorias:         [],
  unidades_tematicas: [],
  unidades_medida:    [],
  fuentes:            {},
};