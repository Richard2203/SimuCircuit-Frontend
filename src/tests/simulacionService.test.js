/**
 * Pruebas del contrato entre SimulacionService y el backend.
 *
 * Por que importa
 *   SimulacionService es el unico punto donde la respuesta cruda del backend
 *   se transforma al formato que consume WaveformChart. Si transformarAC
 *   calcula magnitud o fase incorrectamente, los graficos Bode mostraran
 *   valores equivocados aunque el backend sea correcto.
 *
 * Pruebas
 *   - transformarAC: conversion correcta de fasores (re, im) -> (magnitud, fase)
 *   - transformarAC: estructura del array de salida que espera WaveformChart
 *   - simularDC: lanza error con netlist vacia (validacion de contrato)
 *   - simularAC: lanza error sin configuracion_ac
 *   - simularAC: lanza error con tipo de barrido invalido
 *   - simularAC: acepta datos ya transformados (array) sin reprocesarlos
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SimulacionService } from '../services/simulator/SimulacionService';

// Helpers de mock

/**
 * Crea un mock de fetch que devuelve el body dado.
 */
function mockFetch(payload, ok = true, status = 200) {
  const body = Array.isArray(payload) ? { data: payload } : { data: payload };
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok,
    status,
    json: async () => body,
  });
}

const NETLIST_MINIMA = [
  {
    id: 'V1', type: 'fuente_voltaje', value: '12',
    nodes: { pos: '1', neg: '0' },
    params: { dcOrAc: 'dc' }, position: { x: 0, y: 0 }, rotation: 0,
  },
  {
    id: 'R1', type: 'resistencia', value: '1000',
    nodes: { n1: '1', n2: '0' },
    params: {}, position: { x: 100, y: 0 }, rotation: 0,
  },
];

const CONFIG_AC_VALIDA = {
  f_inicial: 1,
  f_final:   1000,
  puntos:    10,
  barrido:   'lineal',
};

// transformarAC (funcion interna, testeable via simularAC)
// La testeamos indirectamente: mockeamos fetch con respuesta cruda (phasors)
// y verificamos que el output ya esta transformado correctamente.

describe('SimulacionService.simularAC — transformación de respuesta cruda', () => {
  afterEach(() => vi.restoreAllMocks());

  it('calcula magnitud correctamente desde (re, im)', async () => {
    // re=3, im=4 -> magnitud = sqrt(3^2+4^2) = 5
    mockFetch({
      frequencySweep: [60],
      phasorVoltages: { '1': [{ re: 3, im: 4 }] },
      phasorCurrents: {},
    });

    const { resultado } = await SimulacionService.simularAC({
      netlist: NETLIST_MINIMA,
      configuracion_ac: CONFIG_AC_VALIDA,
    });

    expect(resultado[0].voltages['1'].magnitud).toBeCloseTo(5);
  });

  it('calcula fase correctamente desde (re, im)', async () => {
    // re=1, im=0 -> fase = atan2(0,1) × (180/pi) = 0°
    mockFetch({
      frequencySweep: [60],
      phasorVoltages: { '1': [{ re: 1, im: 0 }] },
      phasorCurrents: {},
    });

    const { resultado } = await SimulacionService.simularAC({
      netlist: NETLIST_MINIMA,
      configuracion_ac: CONFIG_AC_VALIDA,
    });

    expect(resultado[0].voltages['1'].fase).toBeCloseTo(0);
  });

  it('preserva re e im en el objeto de salida', async () => {
    mockFetch({
      frequencySweep: [100],
      phasorVoltages: { '1': [{ re: 3, im: 4 }] },
      phasorCurrents: {},
    });

    const { resultado } = await SimulacionService.simularAC({
      netlist: NETLIST_MINIMA,
      configuracion_ac: CONFIG_AC_VALIDA,
    });

    expect(resultado[0].voltages['1'].re).toBeCloseTo(3);
    expect(resultado[0].voltages['1'].im).toBeCloseTo(4);
  });

  it('produce un punto por frecuencia en frequencySweep', async () => {
    mockFetch({
      frequencySweep: [1, 10, 100, 1000],
      phasorVoltages: { '1': [
        { re: 1, im: 0 }, { re: 1, im: 0 },
        { re: 1, im: 0 }, { re: 1, im: 0 },
      ]},
      phasorCurrents: {},
    });

    const { resultado } = await SimulacionService.simularAC({
      netlist: NETLIST_MINIMA,
      configuracion_ac: CONFIG_AC_VALIDA,
    });

    expect(resultado).toHaveLength(4);
    expect(resultado[0].frecuencia).toBe(1);
    expect(resultado[3].frecuencia).toBe(1000);
  });

  it('devuelve el array tal cual si la respuesta ya está transformada', async () => {
    const yaTransformado = [
      { frecuencia: 60, voltages: { '1': { magnitud: 5, fase: 0, re: 3, im: 4 } }, currents: {} },
    ];
    mockFetch(yaTransformado);

    const { resultado } = await SimulacionService.simularAC({
      netlist: NETLIST_MINIMA,
      configuracion_ac: CONFIG_AC_VALIDA,
    });

    expect(resultado).toEqual(yaTransformado);
  });
});

// Validaciones de entrada

describe('SimulacionService — validación de contrato de entrada', () => {
  it('simularDC lanza error con netlist vacía', async () => {
    await expect(SimulacionService.simularDC({ netlist: [] }))
      .rejects.toThrow(/netlist/i);
  });

  it('simularDC lanza error con netlist null', async () => {
    await expect(SimulacionService.simularDC({ netlist: null }))
      .rejects.toThrow(/netlist/i);
  });

  it('simularAC lanza error sin configuracion_ac', async () => {
    await expect(SimulacionService.simularAC({
      netlist: NETLIST_MINIMA,
      configuracion_ac: null,
    })).rejects.toThrow(/configuracion_ac/i);
  });

  it('simularAC lanza error con tipo de barrido inválido', async () => {
    await expect(SimulacionService.simularAC({
      netlist: NETLIST_MINIMA,
      configuracion_ac: { ...CONFIG_AC_VALIDA, barrido: 'cuadratico' },
    })).rejects.toThrow(/barrido/i);
  });

  it('simularAC lanza error cuando faltan campos de configuracion_ac', async () => {
    await expect(SimulacionService.simularAC({
      netlist: NETLIST_MINIMA,
      configuracion_ac: { f_inicial: 1 },
    })).rejects.toThrow();
  });

  it('simularAC acepta todos los tipos de barrido válidos sin lanzar', async () => {
    for (const barrido of ['lineal', 'log', 'decada', 'octava']) {
      mockFetch({ frequencySweep: [], phasorVoltages: {}, phasorCurrents: {} });
      await expect(SimulacionService.simularAC({
        netlist: NETLIST_MINIMA,
        configuracion_ac: { ...CONFIG_AC_VALIDA, barrido },
      })).resolves.toBeDefined();
      vi.restoreAllMocks();
    }
  });
});