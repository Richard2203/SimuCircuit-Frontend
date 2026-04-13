/**
 * PRUEBAS DE INTEGRACION — ComponentValueLabel (edicion inline en canvas)
 * Archivo: componentValueLabel.test.jsx
 *
 * ¿Que se prueba?
 *   - Que el label muestra el valor formateado correctamente
 *   - Que al hacer clic aparece el input de edicion
 *   - Que Enter confirma el valor y lo formatea
 *   - Que Escape cancela sin cambiar el valor
 *   - Que valores fuera de rango muestran feedback de error
 *   - Que se llama onChange con el valor en SI correcto
 *
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentValueLabel } from '../components/Simulator/models/ComponentValueLabel';

// Setup minimo de SVG para testing (jsdom no renderiza SVG igual que browser)
const SVGWrapper = ({ children }) => (
  <svg xmlns="http://www.w3.org/2000/svg">{children}</svg>
);

const defaultProps = {
  componentId: 'test-r1',
  type: 'resistor',
  value: 1000,       // 1kΩ
  onChange: vi.fn(),
  x: 0, y: 0,
  fontSize: 12,
  fill: '#aaa',
};

// ─── Renderizado del label ────────────────────────────────────────────────────

describe('ComponentValueLabel — renderizado inicial', () => {
  it('muestra el valor formateado como 1kΩ para 1000 Ohms', () => {
    render(<SVGWrapper><ComponentValueLabel {...defaultProps} /></SVGWrapper>);
    expect(screen.getByText('1kΩ')).toBeTruthy();
  });

  it('muestra el valor formateado como 10kΩ para 10000 Ohms', () => {
    render(<SVGWrapper>
      <ComponentValueLabel {...defaultProps} value={10000} />
    </SVGWrapper>);
    expect(screen.getByText('10kΩ')).toBeTruthy();
  });

  it('muestra µF para capacitores', () => {
    render(<SVGWrapper>
      <ComponentValueLabel
        {...defaultProps}
        componentId="test-c1"
        type="capacitor"
        value={100e-6}
      />
    </SVGWrapper>);
    expect(screen.getByText('100µF')).toBeTruthy();
  });

  it('no muestra el input de edicion en estado inicial', () => {
    render(<SVGWrapper><ComponentValueLabel {...defaultProps} /></SVGWrapper>);
    expect(screen.queryByRole('textbox')).toBeNull();
  });
});



// ─── Modo de edicion ──────────────────────────────────────────────────────────
describe('ComponentValueLabel — activar modo edicion', () => {
  it('al hacer clic en el label aparece el input', () => {
    render(<SVGWrapper><ComponentValueLabel {...defaultProps} /></SVGWrapper>);
    fireEvent.click(screen.getByText('1kΩ'));
    expect(screen.getByRole('textbox')).toBeTruthy();
  });

  it('el input se pre-carga con el valor numerico actual', () => {
    render(<SVGWrapper><ComponentValueLabel {...defaultProps} /></SVGWrapper>);
    fireEvent.click(screen.getByText('1kΩ'));
    const input = screen.getByRole('textbox');
    expect(input.value).toBe('1000');
  });

  it('al presionar Escape se cancela la edicion y vuelve el label', () => {
    render(<SVGWrapper><ComponentValueLabel {...defaultProps} /></SVGWrapper>);
    fireEvent.click(screen.getByText('1kΩ'));
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByText('1kΩ')).toBeTruthy();
  });
});


// ─── Confirmacion de valores ──────────────────────────────────────────────────
describe('ComponentValueLabel — confirmar valor con Enter', () => {
  it('llama onChange con el valor en SI al presionar Enter', () => {
    const onChange = vi.fn();
    render(<SVGWrapper>
      <ComponentValueLabel {...defaultProps} onChange={onChange} />
    </SVGWrapper>);
    fireEvent.click(screen.getByText('1kΩ'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '4700' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(4700);
  });

  it('acepta notacion k y convierte a SI (10k → 10000)', () => {
    const onChange = vi.fn();
    render(<SVGWrapper>
      <ComponentValueLabel {...defaultProps} onChange={onChange} />
    </SVGWrapper>);
    fireEvent.click(screen.getByText('1kΩ'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '10k' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(10000);
  });

  it('llama onChange al perder foco (blur)', () => {
    const onChange = vi.fn();
    render(<SVGWrapper>
      <ComponentValueLabel {...defaultProps} onChange={onChange} />
    </SVGWrapper>);
    fireEvent.click(screen.getByText('1kΩ'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '2200' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(2200);
  });
});


// ─── Validacion de rangos ─────────────────────────────────────────────────────
describe('ComponentValueLabel — validacion de rangos', () => {
  it('NO llama onChange si el valor esta fuera del rango (resistor > 10MΩ)', () => {
    const onChange = vi.fn();
    render(<SVGWrapper>
      <ComponentValueLabel {...defaultProps} onChange={onChange} />
    </SVGWrapper>);
    fireEvent.click(screen.getByText('1kΩ'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '20meg' } }); // 20MΩ > limite 10MΩ
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('NO llama onChange si el valor es menor al minimo (resistor < 1Ω)', () => {
    const onChange = vi.fn();
    render(<SVGWrapper>
      <ComponentValueLabel {...defaultProps} onChange={onChange} />
    </SVGWrapper>);
    fireEvent.click(screen.getByText('1kΩ'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '0.5' } }); // 0.5Ω < 1Ω
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('acepta el valor minimo exacto del rango (1Ω)', () => {
    const onChange = vi.fn();
    render(<SVGWrapper>
      <ComponentValueLabel {...defaultProps} onChange={onChange} />
    </SVGWrapper>);
    fireEvent.click(screen.getByText('1kΩ'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '1' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('acepta el valor maximo exacto del rango (10MΩ)', () => {
    const onChange = vi.fn();
    render(<SVGWrapper>
      <ComponentValueLabel {...defaultProps} onChange={onChange} />
    </SVGWrapper>);
    fireEvent.click(screen.getByText('1kΩ'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '10meg' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(10_000_000);
  });
});
