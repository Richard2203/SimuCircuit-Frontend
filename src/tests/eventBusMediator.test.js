/**
 * Por que importa
 *   El Mediator utiliza el EventBus para notificar a todos los componentes
 *   cuando el estado cambia. Si el bus pierde suscriptores o el Mediator 
 *   emite el estado equivocado, la UI queda desincronizada del estado real.
 *
 * Pruebas
 *   - EventBus: desuscripcion efectiva
 *   - EventBus: aislamiento entre eventos (A no activa listeners de B)
 *   - Mediator: transiciones de estado correctas
 *   - Mediator -> EventBus: STATE_CHANGED lleva el estado ya actualizado
 *   - Mediator: filtros hacen merge, no sobreescriben todo
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus }            from '../core/EventBus';
import { SimuCircuitMediator } from '../core/Mediator';

function freshSystem() {
  const bus      = new EventBus();
  const mediator = new SimuCircuitMediator(bus);
  return { bus, mediator };
}

const MOCK_CIRCUIT = {
  id: 'una-malla', nombre: 'Circuito de Una Malla',
  dificultad: 'Básico', netlist: [],
};

// EventBus — garantias de Observer

describe('EventBus — garantías del patrón Observer', () => {
  it('la función de desuscripción detiene la recepción de eventos', () => {
    const { bus } = freshSystem();
    const callback = vi.fn();
    const unsub = bus.subscribe('TEST', callback);
    unsub();
    bus.publish('TEST', 'dato');
    expect(callback).not.toHaveBeenCalled();
  });

  it('eventos distintos están aislados — A no activa listeners de B', () => {
    const { bus } = freshSystem();
    const cbA = vi.fn();
    bus.subscribe('EVENTO_A', cbA);
    bus.publish('EVENTO_B', 'dato');
    expect(cbA).not.toHaveBeenCalled();
  });

  it('publicar sin suscriptores no lanza error', () => {
    const { bus } = freshSystem();
    expect(() => bus.publish('SIN_LISTENERS', {})).not.toThrow();
  });

  it('múltiples suscriptores del mismo evento reciben el mismo payload', () => {
    const { bus } = freshSystem();
    const cb1 = vi.fn(), cb2 = vi.fn();
    bus.subscribe('EV', cb1);
    bus.subscribe('EV', cb2);
    bus.publish('EV', { val: 42 });
    expect(cb1).toHaveBeenCalledWith({ val: 42 });
    expect(cb2).toHaveBeenCalledWith({ val: 42 });
  });
});

// Mediator — transiciones de estado

describe('SimuCircuitMediator — transiciones de estado', () => {
  it('SELECT_CIRCUIT establece view=simulator y guarda el circuito', () => {
    const { mediator } = freshSystem();
    mediator.dispatch('SELECT_CIRCUIT', MOCK_CIRCUIT);
    const state = mediator.getState();
    expect(state.view).toBe('simulator');
    expect(state.selectedCircuit).not.toBeNull();
  });

  it('SELECT_CIRCUIT resetea tiempo y resultados de simulación previos', () => {
    const { mediator } = freshSystem();
    mediator._state.simTime = 30;
    mediator._state.simResultadoDC = { voltages: {} };
    mediator.dispatch('SELECT_CIRCUIT', MOCK_CIRCUIT);
    const state = mediator.getState();
    expect(state.simTime).toBe(0);
    expect(state.simResultadoDC).toBeNull();
  });

  it('SIM_INICIAR → SIM_PAUSAR → SIM_REINICIAR transiciona correctamente', () => {
    const { mediator } = freshSystem();
    mediator.dispatch('SELECT_CIRCUIT', MOCK_CIRCUIT);
    mediator.dispatch('SIM_INICIAR');
    expect(mediator.getState().simStatus).toBe('activo');
    mediator.dispatch('SIM_PAUSAR');
    expect(mediator.getState().simStatus).toBe('pausado');
    mediator.dispatch('SIM_REINICIAR');
    expect(mediator.getState().simStatus).toBe('detenido');
    expect(mediator.getState().simTime).toBe(0);
  });

  it('SET_FILTER hace merge — no borra filtros existentes', () => {
    const { mediator } = freshSystem();
    mediator.dispatch('SET_FILTER', { difficulty: 'Básico', components: [] });
    mediator.dispatch('SET_FILTER', { search: 'malla', components: [] });
    const { filters } = mediator.getState();
    expect(filters.difficulty).toBe('Básico');
    expect(filters.search).toBe('malla');
  });

  it('CLEAR_FILTERS deja todos los campos vacíos', () => {
    const { mediator } = freshSystem();
    mediator.dispatch('SET_FILTER', { search: 'test', difficulty: 'Básico', components: [] });
    mediator.dispatch('CLEAR_FILTERS');
    const { filters } = mediator.getState();
    expect(filters.search).toBe('');
    expect(filters.difficulty).toBe('');
    expect(filters.components).toEqual([]);
  });
});

// Mediator -> EventBus: STATE_CHANGED lleva estado actualizado

describe('Integración — STATE_CHANGED lleva el estado ya actualizado', () => {
  it('al seleccionar circuito, el suscriptor recibe view=simulator', () => {
    const { bus, mediator } = freshSystem();
    let receivedState = null;
    bus.subscribe('STATE_CHANGED', (s) => { receivedState = s; });
    mediator.dispatch('SELECT_CIRCUIT', MOCK_CIRCUIT);
    expect(receivedState.view).toBe('simulator');
    expect(receivedState.selectedCircuit).not.toBeNull();
  });

  it('al aplicar filtro, STATE_CHANGED refleja el filtro nuevo', () => {
    const { bus, mediator } = freshSystem();
    let receivedState = null;
    bus.subscribe('STATE_CHANGED', (s) => { receivedState = s; });
    mediator.dispatch('SET_FILTER', { search: 'bjt', components: [] });
    expect(receivedState.filters.search).toBe('bjt');
  });

  it('STATE_CHANGED no se emite para acciones desconocidas', () => {
    const { bus, mediator } = freshSystem();
    const listener = vi.fn();
    bus.subscribe('STATE_CHANGED', listener);
    mediator.dispatch('ACCION_INVENTADA', {});
    expect(listener).not.toHaveBeenCalled();
  });
});
