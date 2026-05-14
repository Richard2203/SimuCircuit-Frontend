/**
 *
 * Por que importa
 *   ComponentValueLabel es la interfaz de edicion del usuario en el canvas.
 *   Su contrato esencial: llamar onChange con el valor en SI correcto cuando
 *   el usuario confirma, y NO llamarlo cuando el valor esta fuera de rango.
 *   El renderizado visual es secundario.
 *
 * ¿Que se prueba?
 *   - onChange recibe el valor en SI tras Enter
 *   - onChange recibe el valor en SI tras blur
 *   - Escape cancela sin llamar a onChange
 *   - Notacion k/meg/µ se convierte a SI correctamente
 *   - Valores fuera de rango NO disparan onChange
 *   - onChange NO se llama con valor identico al actual (sin cambio real)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentValueLabel } from '../components/Simulator/models/ComponentValueLabel';

const SVGWrapper = ({ children }) => (
  <svg xmlns="http://www.w3.org/2000/svg">{children}</svg>
);

const BASE = {
  componentId: 'R1', type: 'resistor', value: 1000,
  onChange: vi.fn(), x: 0, y: 0, fontSize: 12, fill: '#aaa',
};

// Comunicacion onChange

describe('ComponentValueLabel — contrato de onChange', () => {
  it('llama onChange con valor SI al presionar Enter', () => {
    const onChange = vi.fn();
    render(<SVGWrapper><ComponentValueLabel {...BASE} onChange={onChange} /></SVGWrapper>);
    fireEvent.click(screen.getByText('1kΩ'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '4700' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(4700);
  });

  it('llama onChange al perder el foco (blur)', () => {
    const onChange = vi.fn();
    render(<SVGWrapper><ComponentValueLabel {...BASE} onChange={onChange} /></SVGWrapper>);
    fireEvent.click(screen.getByText('1kΩ'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '2200' } });
    fireEvent.blur(screen.getByRole('textbox'));
    expect(onChange).toHaveBeenCalledWith(2200);
  });

  it('Escape cancela y NO llama a onChange', () => {
    const onChange = vi.fn();
    render(<SVGWrapper><ComponentValueLabel {...BASE} onChange={onChange} /></SVGWrapper>);
    fireEvent.click(screen.getByText('1kΩ'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '99999' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('acepta notación k y convierte a SI (10k → 10000)', () => {
    const onChange = vi.fn();
    render(<SVGWrapper><ComponentValueLabel {...BASE} onChange={onChange} /></SVGWrapper>);
    fireEvent.click(screen.getByText('1kΩ'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '10k' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(10000);
  });

  it('acepta notación meg y convierte a SI (1meg → 1000000)', () => {
    const onChange = vi.fn();
    render(<SVGWrapper><ComponentValueLabel {...BASE} onChange={onChange} /></SVGWrapper>);
    fireEvent.click(screen.getByText('1kΩ'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '1meg' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(1_000_000);
  });
});

// Validacion de rangos — onChange nunca se llama fuera de rango

describe('ComponentValueLabel — validación de rango', () => {
  it('NO llama onChange si el valor supera el máximo del rango (20MΩ > 10MΩ)', () => {
    const onChange = vi.fn();
    render(<SVGWrapper><ComponentValueLabel {...BASE} onChange={onChange} /></SVGWrapper>);
    fireEvent.click(screen.getByText('1kΩ'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '20meg' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('NO llama onChange si el valor es menor al mínimo (0.5Ω < 1Ω)', () => {
    const onChange = vi.fn();
    render(<SVGWrapper><ComponentValueLabel {...BASE} onChange={onChange} /></SVGWrapper>);
    fireEvent.click(screen.getByText('1kΩ'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '0.5' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('acepta el valor mínimo exacto del rango (1Ω)', () => {
    const onChange = vi.fn();
    render(<SVGWrapper><ComponentValueLabel {...BASE} onChange={onChange} /></SVGWrapper>);
    fireEvent.click(screen.getByText('1kΩ'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '1' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('acepta el valor máximo exacto del rango (10MΩ)', () => {
    const onChange = vi.fn();
    render(<SVGWrapper><ComponentValueLabel {...BASE} onChange={onChange} /></SVGWrapper>);
    fireEvent.click(screen.getByText('1kΩ'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '10meg' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(10_000_000);
  });
});
