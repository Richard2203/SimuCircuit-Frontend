/**
 * Por que importa
 *   Circuit es el contrato entre la API y toda la UI. Si fromApiList,
 *   fromApiDetail o withNetlist producen datos incorrectos, el simulador,
 *   el canvas SVG y las llamadas al backend reciben basura.
 *
 * Pruebas
 *   - Que cada factory (fromApiList / fromApiDetail / fromAny) mapea
 *     correctamente los campos del backend al modelo interno.
 *   - Que tieneMiniaturaSvgReal distingue SVG real de placeholder.
 *   - Que withNetlist es inmutable (no muta la instancia original).
 *   - Que componentCounts cuenta bien cada tipo de componente.
 */

import { describe, it, expect } from 'vitest';
import { Circuit } from '../domain/Circuit';

// Fixtures 

/** Payload tipo "lista" que devuelve GET /api/circuitos */
const API_LIST_RAW = {
  id: 2,
  nombre_circuito: 'Fuentes Independientes',
  descripcion: 'Circuito con múltiples fuentes.',
  dificultad: 'Intermedio',
  materia: 'Circuitos Eléctricos',
  unidad_tematica: 'Fundamentos',
  tema: 'Análisis de Nodos',
  miniatura_svg: '',
  netlist: [],
  activo: 1,
};

/** Payload tipo "detalle" que devuelve GET /api/circuitos/:id */
const API_DETAIL_RAW = {
  circuito: {
    id: 19,
    nombre_circuito: 'Circuito BJT',
    descripcion: 'BJT como interruptor',
    dificultad: 'Intermedio',
    materia: 'Electrónica',
    unidad_tematica: 'Semiconductores',
    tema: 'Transistores',
  },
  netlist: [
    {
      id: 'R1',
      type: 'resistencia',
      value: '220',
      nodes: { n1: { nodo: '1', x: 0, y: 0 }, n2: { nodo: '2', x: 100, y: 0 } },
      position: { x: 100, y: 20 },
      rotation: 0,
      params: {},
    },
    {
      id: 'Q1',
      type: 'transistor_bjt',
      value: '2N2222A',
      nodes: {
        ne: { nodo: '0', x: 100, y: 150 },
        nc: { nodo: '3', x: 150, y: 0 },
        nb: { nodo: '5', x: 125, y: 50 },
      },
      position: { x: 225, y: 50 },
      rotation: 0,
      params: { tipo: 'NPN', beta: '100' },
    },
  ],
};

// Circuit.fromApiList

describe('Circuit.fromApiList — mapeo desde la API de lista', () => {
  it('asigna id correctamente', () => {
    expect(Circuit.fromApiList(API_LIST_RAW).id).toBe(2);
  });

  it('asigna nombre desde nombre_circuito', () => {
    expect(Circuit.fromApiList(API_LIST_RAW).nombre).toBe('Fuentes Independientes');
  });

  it('asigna dificultad', () => {
    expect(Circuit.fromApiList(API_LIST_RAW).dificultad).toBe('Intermedio');
  });

  it('acepta null sin lanzar error y devuelve Circuit vacío', () => {
    expect(() => Circuit.fromApiList(null)).not.toThrow();
    expect(Circuit.fromApiList(null).id).toBeNull();
  });

  it('la netlist vacía del payload genera un array vacío', () => {
    expect(Circuit.fromApiList(API_LIST_RAW).netlist).toHaveLength(0);
  });
});

// Circuit.fromApiDetail

describe('Circuit.fromApiDetail — mapeo desde la API de detalle', () => {
  it('extrae id desde circuito.id', () => {
    expect(Circuit.fromApiDetail(API_DETAIL_RAW).id).toBe(19);
  });

  it('extrae nombre desde circuito.nombre_circuito', () => {
    expect(Circuit.fromApiDetail(API_DETAIL_RAW).nombre).toBe('Circuito BJT');
  });

  it('construye la netlist con el número de componentes correcto', () => {
    expect(Circuit.fromApiDetail(API_DETAIL_RAW).netlist).toHaveLength(2);
  });

  it('el primer componente de netlist tiene el id R1', () => {
    const circuit = Circuit.fromApiDetail(API_DETAIL_RAW);
    expect(circuit.netlist[0].id).toBe('R1');
  });
});

// Circuit.fromAny — enrutado automatico

describe('Circuit.fromAny — factory polimórfica', () => {
  it('devuelve la misma instancia si ya es Circuit', () => {
    const c = Circuit.fromApiList(API_LIST_RAW);
    expect(Circuit.fromAny(c)).toBe(c);
  });

  it('enruta a fromApiDetail cuando el payload tiene { circuito, netlist }', () => {
    const c = Circuit.fromAny(API_DETAIL_RAW);
    expect(c.id).toBe(19);
    expect(c.netlist).toHaveLength(2);
  });

  it('enruta a fromApiList cuando el payload es plano', () => {
    const c = Circuit.fromAny(API_LIST_RAW);
    expect(c.id).toBe(2);
  });

  it('devuelve Circuit vacío para null', () => {
    expect(Circuit.fromAny(null).id).toBeNull();
  });
});

// tieneMiniaturaSvgReal

describe('Circuit.tieneMiniaturaSvgReal — detección de SVG real', () => {
  const real = '<svg xmlns="http://www.w3.org/2000/svg" width="300"><rect x="10" fill="#aaa"/></svg>';

  it('devuelve false para miniatura_svg vacía', () => {
    expect(Circuit.fromApiList({ ...API_LIST_RAW, miniatura_svg: '' }).tieneMiniaturaSvgReal).toBe(false);
  });

  it('devuelve false para el placeholder <svg>...</svg>', () => {
    const c = new Circuit({ miniatura_svg: '<svg>...</svg>' });
    expect(c.tieneMiniaturaSvgReal).toBe(false);
  });

  it('devuelve true para SVG real con contenido', () => {
    const c = new Circuit({ miniatura_svg: real });
    expect(c.tieneMiniaturaSvgReal).toBe(true);
  });

  it('devuelve false para un string corto que no es SVG', () => {
    const c = new Circuit({ miniatura_svg: '<svg/>' });
    expect(c.tieneMiniaturaSvgReal).toBe(false);
  });
});

// withNetlist — inmutabilidad

describe('Circuit.withNetlist — inmutabilidad', () => {
  it('devuelve una nueva instancia de Circuit', () => {
    const original = Circuit.fromApiDetail(API_DETAIL_RAW);
    const copia    = original.withNetlist([]);
    expect(copia).not.toBe(original);
    expect(copia).toBeInstanceOf(Circuit);
  });

  it('la nueva instancia tiene la netlist proporcionada', () => {
    const original = Circuit.fromApiDetail(API_DETAIL_RAW);
    const copia    = original.withNetlist([]);
    expect(copia.netlist).toHaveLength(0);
  });

  it('la instancia original NO se muta', () => {
    const original = Circuit.fromApiDetail(API_DETAIL_RAW);
    original.withNetlist([]);
    expect(original.netlist).toHaveLength(2);
  });

  it('preserva id y nombre en la copia', () => {
    const original = Circuit.fromApiDetail(API_DETAIL_RAW);
    const copia    = original.withNetlist([]);
    expect(copia.id).toBe(original.id);
    expect(copia.nombre).toBe(original.nombre);
  });
});

// componentCounts

describe('Circuit.componentCounts — conteo por tipo', () => {
  it('cuenta resistencias correctamente', () => {
    const c = Circuit.fromApiDetail(API_DETAIL_RAW);
    expect(c.componentCounts.R).toBe(1); // solo R1
  });

  it('cuenta transistores BJT correctamente', () => {
    const c = Circuit.fromApiDetail(API_DETAIL_RAW);
    expect(c.componentCounts.Q).toBe(1); // solo Q1
  });

  it('devuelve 0 para tipos no presentes', () => {
    const c = Circuit.fromApiDetail(API_DETAIL_RAW);
    expect(c.componentCounts.C).toBe(0);
    expect(c.componentCounts.F).toBe(0);
  });
});
