/**
 * PRUEBAS DE INTEGRACION — EventBus + Mediator (Observer + Mediator)
 *
 * ¿Que se prueba?
 *   - EventBus: suscripcion, publicacion y desuscripcion
 *   - Mediator: que cada accion produce el estado correcto
 *   - Integracion: que el Mediator notifica al bus tras cada dispatch
 *   - COMPONENT_VALUE_CHANGED: flujo completo de edicion en canvas
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from '../core/EventBus';
import { SimuCircuitMediator } from '../core/Mediator';


// ─── Helpers ─────────────────────────────────────────────────────────────────
/** Crea instancias frescas para cada prueba — evita estado compartido */
function createFreshSystem() {
  const bus      = new EventBus();
  const mediator = new SimuCircuitMediator(bus);
  return { bus, mediator };
}

const MOCK_CIRCUIT = {
  id: 'una-malla', name: 'Circuito de Una Malla',
  difficulty: 'Facil', voltage: 12, current: 0.3,
  resistance: 4, R: 3, C: 0, L: 0, F: 1, M: 1,
  unit: 'Circuitos Electricos', topic: 'Mallas DC',
  type: 'Serie', components: ['Resistencias'],
};


// ─── EventBus (Observer) ──────────────────────────────────────────────────────
describe('EventBus — patron Observer', () => {
  let bus;
  beforeEach(() => { bus = new EventBus(); });

  it('notifica al suscriptor cuando se publica un evento', () => {
    const callback = vi.fn();
    bus.subscribe('TEST_EVENT', callback);
    bus.publish('TEST_EVENT', { valor: 42 });
    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith({ valor: 42 });
  });

  it('notifica a multiples suscriptores del mismo evento', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    bus.subscribe('TEST_EVENT', cb1);
    bus.subscribe('TEST_EVENT', cb2);
    bus.publish('TEST_EVENT', 'dato');
    expect(cb1).toHaveBeenCalledOnce();
    expect(cb2).toHaveBeenCalledOnce();
  });

  it('NO notifica a suscriptores de otros eventos', () => {
    const callback = vi.fn();
    bus.subscribe('EVENTO_A', callback);
    bus.publish('EVENTO_B', 'dato');
    expect(callback).not.toHaveBeenCalled();
  });

  it('la funcion de desuscripcion elimina al listener correctamente', () => {
    const callback = vi.fn();
    const unsubscribe = bus.subscribe('TEST_EVENT', callback);
    unsubscribe();
    bus.publish('TEST_EVENT', 'dato');
    expect(callback).not.toHaveBeenCalled();
  });

  it('no lanza error al publicar un evento sin suscriptores', () => {
    expect(() => bus.publish('EVENTO_SIN_LISTENERS', {})).not.toThrow();
  });

  it('pasa los datos correctamente al suscriptor', () => {
    const callback = vi.fn();
    bus.subscribe('COMPONENT_VALUE_CHANGED', callback);
    bus.publish('COMPONENT_VALUE_CHANGED', { id: 'r1', type: 'resistor', value: 1000 });
    expect(callback).toHaveBeenCalledWith({ id: 'r1', type: 'resistor', value: 1000 });
  });
});


// ─── Mediator — acciones individuales ────────────────────────────────────────
describe('SimuCircuitMediator — estado inicial', () => {
  it('inicia con view = library', () => {
    const { mediator } = createFreshSystem();
    expect(mediator.getState().view).toBe('library');
  });

  it('inicia con simStatus = detenido', () => {
    const { mediator } = createFreshSystem();
    expect(mediator.getState().simStatus).toBe('detenido');
  });

  it('inicia sin circuito seleccionado', () => {
    const { mediator } = createFreshSystem();
    expect(mediator.getState().selectedCircuit).toBeNull();
  });
});

describe('SimuCircuitMediator — SELECT_CIRCUIT', () => {
  it('cambia view a simulator', () => {
    const { mediator } = createFreshSystem();
    mediator.dispatch('SELECT_CIRCUIT', MOCK_CIRCUIT);
    expect(mediator.getState().view).toBe('simulator');
  });

  it('guarda el circuito seleccionado en el estado', () => {
    const { mediator } = createFreshSystem();
    mediator.dispatch('SELECT_CIRCUIT', MOCK_CIRCUIT);
    expect(mediator.getState().selectedCircuit.id).toBe('una-malla');
  });

  it('resetea simTime a 0 al seleccionar un nuevo circuito', () => {
    const { mediator } = createFreshSystem();
    mediator.dispatch('SELECT_CIRCUIT', MOCK_CIRCUIT);
    expect(mediator.getState().simTime).toBe(0);
  });
});

describe('SimuCircuitMediator — simulacion (INICIAR / PAUSAR / REINICIAR)', () => {
  it('SIM_INICIAR cambia simStatus a activo', () => {
    const { mediator } = createFreshSystem();
    mediator.dispatch('SELECT_CIRCUIT', MOCK_CIRCUIT);
    mediator.dispatch('SIM_INICIAR');
    expect(mediator.getState().simStatus).toBe('activo');
    mediator.dispatch('SIM_REINICIAR'); // cleanup del timer
  });

  it('SIM_PAUSAR cambia simStatus a pausado', () => {
    const { mediator } = createFreshSystem();
    mediator.dispatch('SELECT_CIRCUIT', MOCK_CIRCUIT);
    mediator.dispatch('SIM_INICIAR');
    mediator.dispatch('SIM_PAUSAR');
    expect(mediator.getState().simStatus).toBe('pausado');
    mediator.dispatch('SIM_REINICIAR');
  });

  it('SIM_REINICIAR resetea simStatus a detenido y simTime a 0', () => {
    const { mediator } = createFreshSystem();
    mediator.dispatch('SELECT_CIRCUIT', MOCK_CIRCUIT);
    mediator.dispatch('SIM_INICIAR');
    mediator.dispatch('SIM_REINICIAR');
    const state = mediator.getState();
    expect(state.simStatus).toBe('detenido');
    expect(state.simTime).toBe(0);
  });
});

describe('SimuCircuitMediator — filtros (SET_FILTER / CLEAR_FILTERS)', () => {
  it('SET_FILTER actualiza el campo search', () => {
    const { mediator } = createFreshSystem();
    mediator.dispatch('SET_FILTER', { search: 'malla', components: [] });
    expect(mediator.getState().filters.search).toBe('malla');
  });

  it('SET_FILTER hace merge — no borra otros filtros existentes', () => {
    const { mediator } = createFreshSystem();
    mediator.dispatch('SET_FILTER', { difficulty: 'Facil', components: [] });
    mediator.dispatch('SET_FILTER', { search: 'malla', components: [] });
    const { filters } = mediator.getState();
    expect(filters.difficulty).toBe('Facil');
    expect(filters.search).toBe('malla');
  });

  it('CLEAR_FILTERS limpia todos los filtros', () => {
    const { mediator } = createFreshSystem();
    mediator.dispatch('SET_FILTER', { search: 'malla', difficulty: 'Facil', components: [] });
    mediator.dispatch('CLEAR_FILTERS');
    const { filters } = mediator.getState();
    expect(filters.search).toBe('');
    expect(filters.difficulty).toBe('');
    expect(filters.components).toEqual([]);
  });
});


// ─── Integracion: Mediator → EventBus → Suscriptor ───────────────────────────
describe('Integracion — Mediator notifica al EventBus tras cada accion', () => {
  it('publica STATE_CHANGED al seleccionar un circuito', () => {
    const { bus, mediator } = createFreshSystem();
    const listener = vi.fn();
    bus.subscribe('STATE_CHANGED', listener);
    mediator.dispatch('SELECT_CIRCUIT', MOCK_CIRCUIT);
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0].view).toBe('simulator');
  });

  it('publica STATE_CHANGED al aplicar un filtro', () => {
    const { bus, mediator } = createFreshSystem();
    const listener = vi.fn();
    bus.subscribe('STATE_CHANGED', listener);
    mediator.dispatch('SET_FILTER', { search: 'test', components: [] });
    expect(listener).toHaveBeenCalledOnce();
  });

  it('el suscriptor recibe el estado actualizado, no el anterior', () => {
    const { bus, mediator } = createFreshSystem();
    let receivedState = null;
    bus.subscribe('STATE_CHANGED', (state) => { receivedState = state; });
    mediator.dispatch('SELECT_CIRCUIT', MOCK_CIRCUIT);
    expect(receivedState.selectedCircuit.id).toBe('una-malla');
  });
});


// ─── Integracion: COMPONENT_VALUE_CHANGED a traves del bus ───────────────────
describe('Integracion — flujo de edicion de valor en canvas', () => {
  it('EventBus propaga COMPONENT_VALUE_CHANGED a todos los listeners activos', () => {
    const { bus } = createFreshSystem();
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    bus.subscribe('COMPONENT_VALUE_CHANGED', listener1);
    bus.subscribe('COMPONENT_VALUE_CHANGED', listener2);
    bus.publish('COMPONENT_VALUE_CHANGED', { id: 'uma-r1', type: 'resistor', value: 4700 });
    expect(listener1).toHaveBeenCalledWith({ id: 'uma-r1', type: 'resistor', value: 4700 });
    expect(listener2).toHaveBeenCalledWith({ id: 'uma-r1', type: 'resistor', value: 4700 });
  });

  it('un componente desuscrito NO recibe cambios posteriores', () => {
    const { bus } = createFreshSystem();
    const listener = vi.fn();
    const unsub = bus.subscribe('COMPONENT_VALUE_CHANGED', listener);
    unsub();
    bus.publish('COMPONENT_VALUE_CHANGED', { id: 'uma-r1', type: 'resistor', value: 4700 });
    expect(listener).not.toHaveBeenCalled();
  });

  it('multiples componentes pueden tener IDs distintos sin interferir', () => {
    const { bus } = createFreshSystem();
    const receivedIds = [];
    bus.subscribe('COMPONENT_VALUE_CHANGED', ({ id }) => receivedIds.push(id));
    bus.publish('COMPONENT_VALUE_CHANGED', { id: 'uma-r1', value: 1000 });
    bus.publish('COMPONENT_VALUE_CHANGED', { id: 'uma-r2', value: 2200 });
    bus.publish('COMPONENT_VALUE_CHANGED', { id: 'uma-pwr1', value: 12 });
    expect(receivedIds).toEqual(['uma-r1', 'uma-r2', 'uma-pwr1']);
  });
});
