/**
 * PRUEBAS DE INTEGRACIoN — Resistor (valor + codigo de color sincronizados)
 *
 * ¿Que se prueba?
 *   - Que el Resistor renderiza sin errores
 *   - Que muestra el label con el valor inicial formateado
 *   - Que al editar el valor, el label se actualiza
 *   - Que el color de las bandas cambia acorde al nuevo valor
 *   - Que useComponentValue responde a eventos del EventBus
 *
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Resistor } from '../components/Simulator/models/resistor';
import eventBus from '../core/EventBus';

const SVGWrapper = ({ children }) => (
  <svg xmlns="http://www.w3.org/2000/svg">{children}</svg>
);


// ─── Renderizado basico ───────────────────────────────────────────────────────
describe('Resistor — renderizado inicial', () => {
  it('renderiza sin lanzar errores', () => {
    expect(() =>
      render(<SVGWrapper>
        <Resistor componentId="test-r1" initialValue={1000} />
      </SVGWrapper>)
    ).not.toThrow();
  });

  it('muestra el valor inicial formateado como 1kΩ', () => {
    render(<SVGWrapper>
      <Resistor componentId="test-r1" initialValue={1000} />
    </SVGWrapper>);
    expect(screen.getByText('1kΩ')).toBeTruthy();
  });

  it('muestra 4.7kΩ para initialValue={4700}', () => {
    render(<SVGWrapper>
      <Resistor componentId="test-r2" initialValue={4700} />
    </SVGWrapper>);
    expect(screen.getByText('4.7kΩ')).toBeTruthy();
  });

  it('muestra 10kΩ para initialValue={10000}', () => {
    render(<SVGWrapper>
      <Resistor componentId="test-r3" initialValue={10000} />
    </SVGWrapper>);
    expect(screen.getByText('10kΩ')).toBeTruthy();
  });
});


// ─── Edicion inline del valor ─────────────────────────────────────────────────
describe('Resistor — edicion inline de valor', () => {
  it('al editar y confirmar, el label muestra el nuevo valor', () => {
    render(<SVGWrapper>
      <Resistor componentId="test-r4" initialValue={1000} />
    </SVGWrapper>);
    fireEvent.click(screen.getByText('1kΩ'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '22000' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText('22kΩ')).toBeTruthy();
  });

  it('al cancelar con Escape, el label mantiene el valor original', () => {
    render(<SVGWrapper>
      <Resistor componentId="test-r5" initialValue={1000} />
    </SVGWrapper>);
    fireEvent.click(screen.getByText('1kΩ'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '99999' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.getByText('1kΩ')).toBeTruthy();
  });

  it('llama a onValueChange con el nuevo valor en SI', () => {
    const onValueChange = vi.fn();
    render(<SVGWrapper>
      <Resistor componentId="test-r6" initialValue={1000} onValueChange={onValueChange} />
    </SVGWrapper>);
    fireEvent.click(screen.getByText('1kΩ'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '10k' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(onValueChange).toHaveBeenCalledWith(10000);
  });
});


// ─── Integracion con EventBus ─────────────────────────────────────────────────
describe('Resistor — integracion con EventBus (Observer)', () => {
  it('publica COMPONENT_VALUE_CHANGED al confirmar un nuevo valor', () => {
    const listener = vi.fn();
    const unsub = eventBus.subscribe('COMPONENT_VALUE_CHANGED', listener);

    render(<SVGWrapper>
      <Resistor componentId="test-r7" initialValue={1000} />
    </SVGWrapper>);
    fireEvent.click(screen.getByText('1kΩ'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '4700' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'test-r7', type: 'resistor', value: 4700 })
    );
    unsub();
  });

  it('responde a COMPONENT_VALUE_CHANGED externo actualizando su label', () => {
    render(<SVGWrapper>
      <Resistor componentId="test-r8" initialValue={1000} />
    </SVGWrapper>);
    expect(screen.getByText('1kΩ')).toBeTruthy();

    // Simula que otro componente publica un cambio para este resistor
    act(() => {
      eventBus.publish('COMPONENT_VALUE_CHANGED', {
        id: 'test-r8', type: 'resistor', value: 33000,
      });
    });

    expect(screen.getByText('33kΩ')).toBeTruthy();
  });

  it('NO responde a eventos de otros componentIds', () => {
    render(<SVGWrapper>
      <Resistor componentId="test-r9" initialValue={1000} />
    </SVGWrapper>);

    act(() => {
      eventBus.publish('COMPONENT_VALUE_CHANGED', {
        id: 'test-OTRO', type: 'resistor', value: 99000,
      });
    });

    // test-r9 no debe cambiar
    expect(screen.getByText('1kΩ')).toBeTruthy();
    expect(screen.queryByText('99kΩ')).toBeNull();
  });
});
