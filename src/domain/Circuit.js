import { ComponentFactory } from './ComponentFactory';

/**
 * Conteo de componentes por tipo.
 * @typedef {object} ComponentCounts
 * @property {number} R - Resistencias y resistencias variables
 * @property {number} C - Capacitores
 * @property {number} L - Bobinas
 * @property {number} F - Fuentes (voltaje y corriente)
 * @property {number} D - Diodos
 * @property {number} Q - Transistores BJT
 * @property {number} J - Transistores FET
 * @property {number} U - Reguladores
 */

export class Circuit {
  /**
   * @param {object} args
   * @param {number|string|null} [args.id]
   * @param {string} [args.nombre]
   * @param {string} [args.descripcion]
   * @param {string} [args.dificultad]
   * @param {string} [args.materia]
   * @param {string} [args.unidad_tematica]
   * @param {string} [args.tema]
   * @param {string[]} [args.categorias]
   * @param {string[]} [args.tipos_componentes]
   * @param {string} [args.miniatura_svg]
   * @param {Array} [args.netlist]
   * @param {boolean|number} [args.activo]
   * @param {object} [args.layout_data]
   */
  constructor({
    id              = null,
    nombre          = '',
    descripcion     = '',
    dificultad      = '',
    materia         = '',
    unidad_tematica = '',
    tema            = '',
    categorias      = [],
    tipos_componentes = [],
    miniatura_svg   = '',
    netlist         = [],
    activo          = 1,
    layout_data     = null,
  } = {}) {
    /** @type {number|string|null} */
    this.id = id;
    /** @type {string} */
    this.nombre = nombre ?? '';
    /** @type {string} */
    this.descripcion = descripcion ?? '';
    /** @type {string} */
    this.dificultad = dificultad ?? '';
    /** @type {string} */
    this.materia = materia ?? '';
    /** @type {string} */
    this.unidad_tematica = unidad_tematica ?? '';
    /** @type {string} */
    this.tema = tema ?? '';
    /** @type {string[]} */
    this.categorias = Array.isArray(categorias) ? [...categorias] : [];
    /** @type {string[]} */
    this.tipos_componentes = Array.isArray(tipos_componentes) ? [...tipos_componentes] : [];
    /** @type {string} */
    this.miniatura_svg = miniatura_svg ?? '';
    /** @type {import('./Component').Component[]} */
    this.netlist = ComponentFactory.fromNetlist(netlist);
    /** @type {boolean} */
    this.activo = Boolean(activo);
    /** @type {object|null} */
    this.layout_data = layout_data ?? null;
  }

  // --- Factories ------------------------------------------------------

  /**
   * Construye desde el formato "lista" de la API
   * @param {object} raw
   * @returns {Circuit}
   */
  static fromApiList(raw) {
    if (!raw) return new Circuit();
    return new Circuit({
      id:              raw.id ?? null,
      nombre:          raw.nombre ?? raw.nombre_circuito ?? '',
      descripcion:     raw.descripcion ?? '',
      dificultad:      raw.dificultad ?? '',
      materia:         raw.materia ?? '',
      unidad_tematica: raw.unidad_tematica ?? '',
      tema:            raw.tema ?? '',
      categorias:      raw.categorias ?? [],
      tipos_componentes: raw.tipos_componentes ?? [],
      miniatura_svg:   raw.miniatura_svg ?? '',
      netlist:         raw.netlist ?? [],
      activo:          raw.activo ?? 1,
      layout_data:     raw.layout_data ?? null,
    });
  }

  /**
   * Construye desde el formato "detalle" de la API
   * @param {{ circuito: object, netlist: Array }} raw
   * @returns {Circuit}
   */
  static fromApiDetail(raw) {
    if (!raw) return new Circuit();
    const c = raw.circuito ?? {};
    return new Circuit({
      id:              c.id ?? null,
      nombre:          c.nombre_circuito ?? c.nombre ?? '',
      descripcion:     c.descripcion ?? '',
      dificultad:      c.dificultad ?? '',
      materia:         c.materia ?? '',
      unidad_tematica: c.unidad_tematica ?? '',
      tema:            c.tema ?? '',
      categorias:      c.categorias ?? [],
      tipos_componentes: c.tipos_componentes ?? [],
      miniatura_svg:   c.miniatura_svg ?? raw.miniatura_svg ?? '',
      netlist:         raw.netlist ?? [],
      activo:          c.activo ?? 1,
      layout_data:     c.layout_data ?? null,
    });
  }

  /**
   * Construye desde el dataset local.
   * @param {object} raw
   * @returns {Circuit}
   */
  static fromLocal(raw) {
    if (!raw) return new Circuit();
    return new Circuit({
      id:              raw.id ?? null,
      nombre:          raw.name ?? raw.nombre ?? '',
      descripcion:     raw.description ?? raw.descripcion ?? '',
      dificultad:      raw.difficulty ?? raw.dificultad ?? '',
      materia:         raw.unit ?? raw.materia ?? '',
      unidad_tematica: raw.topic ?? raw.unidad_tematica ?? '',
      tema:            raw.tema ?? '',
      categorias:      raw.categorias ?? [],
      tipos_componentes: raw.components ?? raw.tipos_componentes ?? [],
      miniatura_svg:   raw.miniatura_svg ?? '',
      netlist:         raw.netlist ?? [],
      activo:          1,
      layout_data:     null,
    });
  }

  /**
   * Auto-deteccion: identifica el formato del input y crea la instancia.
   * @param {object|Circuit} raw
   * @returns {Circuit}
   */
  static fromAny(raw) {
    if (!raw) return new Circuit();
    if (raw instanceof Circuit) return raw;
    if (raw.circuito) return Circuit.fromApiDetail(raw);
    if ('name' in raw && !('nombre' in raw) && !('nombre_circuito' in raw)) {
      return Circuit.fromLocal(raw);
    }
    return Circuit.fromApiList(raw);
  }


  /** @returns {string} */ get name()       { return this.nombre; }
  /** @returns {string} */ get difficulty() { return this.dificultad; }
  /** @returns {string} */ get unit()       { return this.materia; }
  /** @returns {string} */ get topic()      { return this.unidad_tematica; }
  /** @returns {string} */ get description(){ return this.descripcion; }

  // --- Calculos derivados ---------------------------------------------------

  /**
   * Cuenta los componentes por categoria.
   * @returns {ComponentCounts}
   */
  get componentCounts() {
    const c = { R: 0, C: 0, L: 0, F: 0, D: 0, Q: 0, J: 0, U: 0 };
    this.netlist.forEach(({ type }) => {
      switch (type) {
        case 'resistencia':
        case 'resistencia_variable':
          c.R++; break;
        case 'capacitor':       c.C++; break;
        case 'bobina':          c.L++; break;
        case 'fuente_voltaje':
        case 'fuente_corriente':
          c.F++; break;
        case 'diodo':           c.D++; break;
        case 'transistor_bjt':  c.Q++; break;
        case 'transistor_fet':  c.J++; break;
        case 'regulador_voltaje': c.U++; break;
        default: break;
      }
    });
    return c;
  }

  /**
   * Tipos unicos de componentes presentes en la netlist.
   * @returns {string[]}
   */
  get tiposEnNetlist() {
    return [...new Set(this.netlist.map((c) => c.type))];
  }

  /**
   * true si el circuito tiene al menos una fuente AC.
   * @returns {boolean}
   */
  get tieneAC() {
    return this.netlist.some((c) =>
      (c.type === 'fuente_voltaje' || c.type === 'fuente_corriente') &&
      (c.params?.dcOrAc ?? '').toLowerCase() === 'ac'
    );
  }

  /**
   * true si el circuito tiene al menos una fuente DC.
   * @returns {boolean}
   */
  get tieneDC() {
    return this.netlist.some((c) =>
      (c.type === 'fuente_voltaje' || c.type === 'fuente_corriente') &&
      (c.params?.dcOrAc ?? 'dc').toLowerCase() === 'dc'
    );
  }

  /**
   * Voltaje principal del circuito (primera fuente de voltaje).
   * @returns {number}
   */
  get voltajePrincipal() {
    const fv = this.netlist.find((c) => c.type === 'fuente_voltaje');
    return fv ? parseFloat(fv.value) || 0 : 0;
  }

  /**
   * Corriente principal del circuito (primera fuente de corriente).
   * @returns {number}
   */
  get corrientePrincipal() {
    const fi = this.netlist.find((c) => c.type === 'fuente_corriente');
    return fi ? parseFloat(fi.value) || 0 : 0;
  }

  /**
   * Resistencia "principal" (primera resistencia)
   * @returns {number}
   */
  get resistenciaPrincipal() {
    const r = this.netlist.find((c) => c.type === 'resistencia');
    return r ? parseFloat(r.value) || 0 : 0;
  }

  
  get tieneMiniaturaSvgReal() {
    const svg = (this.miniatura_svg ?? '').trim();
    if (!svg) return false;
    if (svg === '<svg>...</svg>') return false;
    return svg.length > 30 && svg.includes('<svg');
  }

  // --- Mutadores no-destructivos ------------------------------------------

  /**
   * Devuelve una copia del circuito con la netlist reemplazada.
   * @param {Array} netlist
   * @returns {Circuit}
   */
  withNetlist(netlist) {
    return new Circuit({ ...this.toJSON(), netlist });
  }

  /**
   * Copia profunda.
   * @returns {Circuit}
   */
  clone() {
    return new Circuit(JSON.parse(JSON.stringify(this.toJSON())));
  }

  // --- Serializacion -------------------------------------------------------

  /**
   * Forma generica (canonica).
   * @returns {object}
   */
  toJSON() {
    return {
      id:                this.id,
      nombre:            this.nombre,
      descripcion:       this.descripcion,
      dificultad:        this.dificultad,
      materia:           this.materia,
      unidad_tematica:   this.unidad_tematica,
      tema:              this.tema,
      categorias:        [...this.categorias],
      tipos_componentes: [...this.tipos_componentes],
      miniatura_svg:     this.miniatura_svg,
      netlist:           this.netlist.map((c) => c.toJSON()),
      activo:            this.activo ? 1 : 0,
      layout_data:       this.layout_data,
    };
  }

  /**
   * Payload para enviar al backend al crear / editar un circuito.
   * @returns {object}
   */
  toBackendPayload() {
    return {
      circuito: {
        nombre_circuito:   this.nombre,
        descripcion:       this.descripcion,
        dificultad:        this.dificultad,
        materia:           this.materia,
        unidad_tematica:   this.unidad_tematica,
        tema:              this.tema,
        categorias:        [...this.categorias],
        tipos_componentes: [...this.tipos_componentes],
      },
      netlist:       this.netlist.map((c) => c.toBackendJSON()),
      miniatura_svg: this.miniatura_svg,
    };
  }
}
