import { Component }            from './Component';
import { Resistencia }          from './components/Resistencia';
import { ResistenciaVariable }  from './components/ResistenciaVariable';
import { Capacitor }            from './components/Capacitor';
import { Bobina }               from './components/Bobina';
import { Diodo }                from './components/Diodo';
import { FuenteVoltaje }        from './components/FuenteVoltaje';
import { FuenteCorriente }      from './components/FuenteCorriente';
import { TransistorBJT }        from './components/TransistorBJT';
import { TransistorFET }        from './components/TransistorFET';
import { ReguladorVoltaje }     from './components/ReguladorVoltaje';

/**
 * Mapa tipo -> constructor.
 * @type {Readonly<Record<string, typeof Component>>}
 */
const REGISTRO = Object.freeze({
  resistencia:          Resistencia,
  resistencia_variable: ResistenciaVariable,
  capacitor:            Capacitor,
  bobina:               Bobina,
  diodo:                Diodo,
  fuente_voltaje:       FuenteVoltaje,
  fuente_corriente:     FuenteCorriente,
  transistor_bjt:       TransistorBJT,
  transistor_fet:       TransistorFET,
  regulador_voltaje:    ReguladorVoltaje,
});

export class ComponentFactory {
  /**
   * Devuelve la clase concreta para un tipo dado.
   * Si el tipo no existe en el registro, devuelve la base Component.
   * @param {string} tipo
   * @returns {typeof Component}
   */
  static getClass(tipo) {
    return REGISTRO[tipo] ?? Component;
  }

  /**
   * Construye un Component (subclase) desde el JSON del backend
   * (formato de /api/circuitos/:id, con nodes y pines canonicos).
   *
   * @param {object} raw
   * @returns {Component}
   */
  static fromBackend(raw) {
    if (raw instanceof Component) return raw;
    const Klass = ComponentFactory.getClass(raw?.type);
    return new Klass({
      id:       raw.id,
      type:     raw.type,
      value:    raw.value,
      position: raw.position,
      rotation: raw.rotation,
      nodes:    raw.nodes,
      params:   raw.params,
    });
  }

  /**
   * Construye un Component (subclase) desde el JSON del panel admin
   * (formato del ConstructorNetlist, con nodos y pines amigables).
   *
   * @param {object} raw
   * @returns {Component}
   */
  static fromAdmin(raw) {
    if (raw instanceof Component) return raw;
    const Klass = ComponentFactory.getClass(raw?.type);
    return new Klass({
      id:       raw.id,
      type:     raw.type,
      value:    raw.value,
      position: raw.position ?? { x: 0, y: 0 },
      rotation: raw.rotation,
      nodes:    raw.nodos ?? raw.nodes ?? {},   // tolera ambos
      params:   raw.params,
    });
  }

  /**
   * Auto-detecta el formato y construye la subclase correcta.
   *  • Si tiene nodes ->backend.
   *  • Si tiene nodos -> admin.
   *  • Si ya es Component -> se devuelve tal cual.
   *
   * @param {object|Component} raw
   * @returns {Component}
   */
  static from(raw) {
    if (!raw) return null;
    if (raw instanceof Component) return raw;
    if ('nodes' in raw && !('nodos' in raw)) return ComponentFactory.fromBackend(raw);
    if ('nodos' in raw) return ComponentFactory.fromAdmin(raw);
    return ComponentFactory.fromBackend(raw);
  }

  /**
   * Construye un componente NUEVO (sin nodos asignados todavia) con los
   * valores por defecto del tipo.
   *
   * @param {string} tipo
   * @param {{ id?: string, value?: string, rotation?: number }} [opts]
   * @returns {Component}
   */
  static crearVacio(tipo, opts = {}) {
    const Klass = ComponentFactory.getClass(tipo);
    return new Klass({
      id:       opts.id       ?? '',
      type:     tipo,
      value:    opts.value    ?? '',
      rotation: opts.rotation ?? 0,
      nodes:    {},
      params:   {},
    });
  }

  /**
   * Convierte una netlist completa al formato canonico (subclases tipadas).
   * @param {Iterable<object|Component>} rawList
   * @returns {Component[]}
   */
  static fromNetlist(rawList) {
    return Array.from(rawList ?? [], ComponentFactory.from);
  }
}
