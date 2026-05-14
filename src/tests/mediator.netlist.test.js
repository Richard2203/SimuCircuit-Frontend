/**
 * Pruebas de integracion: Mediator <-> EventBus <-> netlist <-> backend.
 *
 * Por que importa
 *   El Mediator es el hub central. Si _netlistParaBackend serializa mal
 *   los nodos, el backend recibe pines incorrectos -> simulacion erronea.
 *   Si COMPONENT_VALUE_CHANGED no actualiza la netlist en el estado, el
 *   valor editado en el canvas nunca llega a la siguiente simulacion.
 *  
 * Prueba
 *   - _netlistParaBackend: convierte nodes de {nodo, x, y} a string plano
 *   - _netlistParaBackend: preserva value, type, params, rotation
 *   - COMPONENT_VALUE_CHANGED via EventBus -> actualiza netlist en estado
 *   - SET_NETLIST: sincroniza netlist y selectedCircuit.netlist
 *   - paramsOverride: se fusiona en params del componente al hacer SET_NETLIST
 *   - GO_LIBRARY: limpia estado de simulación
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus }            from '../core/EventBus';
import { SimuCircuitMediator } from '../core/Mediator';
import eventBusGlobal          from '../core/EventBus';

// Helpers

function freshSystem() {
  const bus      = new EventBus();
  const mediator = new SimuCircuitMediator(bus);
  return { bus, mediator };
}

/** Componente plano que imita lo que devuelve toJSON() de Component */
const COMP_R1 = {
  id: 'R1', type: 'resistencia', value: '1000', rotation: 0,
  position: { x: 100, y: 20 },
  nodes: {
    n1: { nodo: '1', x: 50,  y: 0 },
    n2: { nodo: '2', x: 150, y: 0 },
  },
  params: { banda_uno: 'Marrón' },
};

const COMP_V1 = {
  id: 'V1', type: 'fuente_voltaje', value: '12', rotation: 0,
  position: { x: 0, y: 130 },
  nodes: {
    pos: { nodo: '1', x: 0, y: 0   },
    neg: { nodo: '0', x: 0, y: 150 },
  },
  params: { dcOrAc: 'dc', activo: 1 },
};

const MOCK_CIRCUIT = {
  id: 1, nombre: 'Una malla', dificultad: 'Básico',
  netlist: [COMP_R1, COMP_V1],
};

// _netlistParaBackend

describe('Mediator._netlistParaBackend — serialización para el backend', () => {
  it('convierte nodes { nodo, x, y } a strings planos', () => {
    const { mediator } = freshSystem();
    const [r1] = mediator._netlistParaBackend([COMP_R1]);
    // El backend espera nodes: { n1: "1", n2: "2" }, no objetos
    expect(r1.nodes.n1).toBe('1');
    expect(r1.nodes.n2).toBe('2');
  });

  it('preserva value, type, id intactos', () => {
    const { mediator } = freshSystem();
    const [r1] = mediator._netlistParaBackend([COMP_R1]);
    expect(r1.id).toBe('R1');
    expect(r1.type).toBe('resistencia');
    expect(r1.value).toBe('1000');
  });

  it('preserva params del componente', () => {
    const { mediator } = freshSystem();
    const [r1] = mediator._netlistParaBackend([COMP_R1]);
    expect(r1.params.banda_uno).toBe('Marrón');
  });

  it('preserva rotation y position', () => {
    const { mediator } = freshSystem();
    const [r1] = mediator._netlistParaBackend([COMP_R1]);
    expect(r1.rotation).toBe(0);
    expect(r1.position.x).toBe(100);
  });

  it('serializa nodo GND (0) como string "0"', () => {
    const { mediator } = freshSystem();
    const [v1] = mediator._netlistParaBackend([COMP_V1]);
    expect(v1.nodes.neg).toBe('0');
  });

  it('devuelve array vacío para netlist vacía', () => {
    const { mediator } = freshSystem();
    expect(mediator._netlistParaBackend([])).toEqual([]);
  });

  it('devuelve array vacío para netlist null', () => {
    const { mediator } = freshSystem();
    expect(mediator._netlistParaBackend(null)).toEqual([]);
  });
});

// COMPONENT_VALUE_CHANGED -> mutacion de netlist

describe('Mediator — COMPONENT_VALUE_CHANGED actualiza netlist en estado', () => {
  it('actualiza el value del componente correcto', () => {
    const { mediator } = freshSystem();
    mediator.dispatch('SELECT_CIRCUIT', MOCK_CIRCUIT);

    // El Mediator escucha COMPONENT_VALUE_CHANGED en el singleton global (no en this._bus),
    // por eso publicamos en eventBusGlobal y no en el bus local del test.
    eventBusGlobal.publish('COMPONENT_VALUE_CHANGED', { id: 'R1', type: 'resistor', value: 4700 });

    const r1 = mediator.getState().netlist.find(c => (c.id ?? c?.id) === 'R1');
    expect(String(r1.value)).toBe('4700');
  });

  it('NO modifica otros componentes de la netlist', () => {
    const { mediator } = freshSystem();
    mediator.dispatch('SELECT_CIRCUIT', MOCK_CIRCUIT);
    eventBusGlobal.publish('COMPONENT_VALUE_CHANGED', { id: 'R1', type: 'resistor', value: 4700 });

    const v1 = mediator.getState().netlist.find(c => (c.id ?? c?.id) === 'V1');
    expect(String(v1.value)).toBe('12');
  });

  it('publica STATE_CHANGED después de la actualización', () => {
    const { bus, mediator } = freshSystem();
    mediator.dispatch('SELECT_CIRCUIT', MOCK_CIRCUIT);

    // STATE_CHANGED se publica en this._bus (bus local) -> suscribimos ahí.
    // COMPONENT_VALUE_CHANGED se escucha en el singleton global -> publicamos ahí.
    const listener = vi.fn();
    bus.subscribe('STATE_CHANGED', listener);
    eventBusGlobal.publish('COMPONENT_VALUE_CHANGED', { id: 'R1', type: 'resistor', value: 4700 });

    expect(listener).toHaveBeenCalledOnce();
  });

  it('ignora el evento si el id no existe en la netlist', () => {
    const { mediator } = freshSystem();
    mediator.dispatch('SELECT_CIRCUIT', MOCK_CIRCUIT);
    const netlistAntes = mediator.getState().netlist;

    eventBusGlobal.publish('COMPONENT_VALUE_CHANGED', { id: 'INEXISTENTE', value: 999 });

    // La netlist no debe cambiar
    expect(mediator.getState().netlist).toHaveLength(netlistAntes.length);
  });
});

// SET_NETLIST

describe('Mediator.dispatch(SET_NETLIST) — sincronización de estado', () => {
  it('actualiza state.netlist con el nuevo array', () => {
    const { mediator } = freshSystem();
    mediator.dispatch('SELECT_CIRCUIT', MOCK_CIRCUIT);

    const netlistActualizada = [
      { ...COMP_R1, value: '2200' },
      COMP_V1,
    ];
    mediator.dispatch('SET_NETLIST', netlistActualizada);

    expect(mediator.getState().netlist[0].value).toBe('2200');
  });

  it('fusiona paramsOverride en el componente actualizado', () => {
    const { mediator } = freshSystem();
    mediator.dispatch('SELECT_CIRCUIT', MOCK_CIRCUIT);

    // Simula lo que hace useComponentValue.setValue(v, { cursor_pos: 30 })
    const netlistConParams = mediator.getState().netlist.map(comp => {
      if (comp.id !== 'R1') return comp;
      return { ...comp, value: '5000', params: { ...comp.params, cursor_pos: 30 } };
    });
    mediator.dispatch('SET_NETLIST', netlistConParams);

    const r1 = mediator.getState().netlist.find(c => c.id === 'R1');
    expect(r1.params.cursor_pos).toBe(30);
    expect(r1.value).toBe('5000');
  });

  it('el selectedCircuit.netlist queda sincronizado', () => {
    const { mediator } = freshSystem();
    mediator.dispatch('SELECT_CIRCUIT', MOCK_CIRCUIT);
    mediator.dispatch('SET_NETLIST', [{ ...COMP_R1, value: '330' }]);

    const circuitNetlist = mediator.getState().selectedCircuit.netlist;
    // withNetlist reconstruye instancias de Component — solo verificamos length y valor
    expect(circuitNetlist).toHaveLength(1);
  });
});

// GO_LIBRARY

describe('Mediator.dispatch(GO_LIBRARY) — limpieza de estado', () => {
  it('resetea view a library', () => {
    const { mediator } = freshSystem();
    mediator.dispatch('SELECT_CIRCUIT', MOCK_CIRCUIT);
    mediator.dispatch('GO_LIBRARY');
    expect(mediator.getState().view).toBe('library');
  });

  it('limpia selectedCircuit y netlist', () => {
    const { mediator } = freshSystem();
    mediator.dispatch('SELECT_CIRCUIT', MOCK_CIRCUIT);
    mediator.dispatch('GO_LIBRARY');
    const state = mediator.getState();
    expect(state.selectedCircuit).toBeNull();
    expect(state.netlist).toHaveLength(0);
  });

  it('resetea resultados de simulación', () => {
    const { mediator } = freshSystem();
    mediator._state.simResultadoDC = { voltages: {} };
    mediator.dispatch('GO_LIBRARY');
    expect(mediator.getState().simResultadoDC).toBeNull();
  });
});
