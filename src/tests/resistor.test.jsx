/**
 * Pruebas de integracion: Resistor <-> EventBus <-> useComponentValue.
 *
 * Por que importa 
 *   El Resistor no vive aislado: publica COMPONENT_VALUE_CHANGED cuando el
 *   usuario edita su valor, y se suscribe al mismo evento para actualizarse
 *   cuando otro componente (ej. el sidebar) cambia el valor externamente.
 *
 * Pruebas
 *   - Publicacion de COMPONENT_VALUE_CHANGED al confirmar un valor
 *   - Que el payload enviado al bus tiene { id, type, value } correctos
 *   - Que el Resistor actualiza su label al recibir un evento externo
 *   - Que NO responde a eventos de otros componentIds
 *   - Que editar y cancelar (Escape) NO publica nada al bus
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Resistor } from '../components/Simulator/models/resistor';
import eventBus from '../core/EventBus';

const SVGWrapper = ({ children }) => (
  <svg xmlns="http://www.w3.org/2000/svg">{children}</svg>
);

// Publicacion al EventBus

describe('Resistor — publica COMPONENT_VALUE_CHANGED al editar', () => {
  it('publica el evento con id, type y value correctos', () => {
    const listener = vi.fn();
    const unsub = eventBus.subscribe('COMPONENT_VALUE_CHANGED', listener);

    render(<SVGWrapper><Resistor componentId="R1" initialValue={1000} /></SVGWrapper>);
    fireEvent.click(screen.getByText('1kΩ'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '4700' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'R1', type: 'resistor', value: 4700 })
    );
    unsub();
  });

  it('Escape NO publica COMPONENT_VALUE_CHANGED', () => {
    const listener = vi.fn();
    const unsub = eventBus.subscribe('COMPONENT_VALUE_CHANGED', listener);

    render(<SVGWrapper><Resistor componentId="R2" initialValue={1000} /></SVGWrapper>);
    fireEvent.click(screen.getByText('1kΩ'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '99999' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });

    expect(listener).not.toHaveBeenCalled();
    unsub();
  });
});

// Recepcion de eventos externos

describe('Resistor — reacciona a COMPONENT_VALUE_CHANGED externo (Observer)', () => {
  it('actualiza su label cuando otro componente publica su id', () => {
    render(<SVGWrapper><Resistor componentId="R3" initialValue={1000} /></SVGWrapper>);

    act(() => {
      eventBus.publish('COMPONENT_VALUE_CHANGED', {
        id: 'R3', type: 'resistor', value: 33000,
      });
    });

    expect(screen.getByText('33kΩ')).toBeTruthy();
  });

  it('NO actualiza su label cuando el evento es de otro componentId', () => {
    render(<SVGWrapper><Resistor componentId="R4" initialValue={1000} /></SVGWrapper>);

    act(() => {
      eventBus.publish('COMPONENT_VALUE_CHANGED', {
        id: 'R_OTRO', type: 'resistor', value: 99000,
      });
    });

    expect(screen.getByText('1kΩ')).toBeTruthy();
    expect(screen.queryByText('99kΩ')).toBeNull();
  });

  it('múltiples resistores con IDs distintos no se interfieren', () => {
    render(
      <SVGWrapper>
        <Resistor componentId="RA" initialValue={1000} />
        <Resistor componentId="RB" initialValue={2200} />
      </SVGWrapper>
    );

    act(() => {
      eventBus.publish('COMPONENT_VALUE_CHANGED', {
        id: 'RA', type: 'resistor', value: 10000,
      });
    });

    // RA se actualiza, RB permanece igual
    expect(screen.getByText('10kΩ')).toBeTruthy();
    expect(screen.getByText('2.2kΩ')).toBeTruthy();
  });
});
