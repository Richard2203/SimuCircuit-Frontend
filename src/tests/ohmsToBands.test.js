/**
 * PRUEBAS UNITARIAS — ohmsToBands (codigo de color de resistencias)
 
 * ¿Qué se prueba?
 *   - Que la funcion convierte valores en Ohms a las 4 bandas correctas
 *   - Valores estandar de la serie E12/E24 mas usados en clase
 *   - Casos borde: 0, negativos, valores extremos del rango permitido
 */

import { describe, it, expect } from 'vitest';

// ── Copia de la logica a testear ─────────────────────────────────────────────
const BAND_NAMES = [
  'black', 'brown', 'red', 'orange', 'yellow',
  'green', 'blue', 'violet', 'grey', 'white',
];

function ohmsToBands(ohms) {
  if (!ohms || ohms <= 0) return ['black', 'black', 'black', 'gold'];
  const exp    = Math.floor(Math.log10(ohms)) - 1;
  const base   = Math.round(ohms / Math.pow(10, exp));
  const digit1 = Math.floor(base / 10) % 10;
  const digit2 = base % 10;
  const mult   = exp;
  return [
    BAND_NAMES[digit1],
    BAND_NAMES[digit2],
    mult >= 0 ? BAND_NAMES[mult] : 'silver',
    'gold',
  ];
}
// ─────────────────────────────────────────────────────────────────────────────

describe('ohmsToBands — valores estandar de serie E12', () => {
  it('1 kΩ → brown, black, red, gold', () => {
    expect(ohmsToBands(1000)).toEqual(['brown', 'black', 'red', 'gold']);
  });

  it('10 kΩ → brown, black, orange, gold', () => {
    expect(ohmsToBands(10_000)).toEqual(['brown', 'black', 'orange', 'gold']);
  });

  it('100 kΩ → brown, black, yellow, gold', () => {
    expect(ohmsToBands(100_000)).toEqual(['brown', 'black', 'yellow', 'gold']);
  });

  it('1 MΩ → brown, black, green, gold', () => {
    expect(ohmsToBands(1_000_000)).toEqual(['brown', 'black', 'green', 'gold']);
  });

  it('330 Ω → orange, orange, brown, gold', () => {
    expect(ohmsToBands(330)).toEqual(['orange', 'orange', 'brown', 'gold']);
  });

  it('4.7 kΩ → yellow, violet, red, gold', () => {
    expect(ohmsToBands(4700)).toEqual(['yellow', 'violet', 'red', 'gold']);
  });

  it('22 kΩ → red, red, orange, gold', () => {
    expect(ohmsToBands(22_000)).toEqual(['red', 'red', 'orange', 'gold']);
  });

  it('siempre tiene banda 4 = gold (tolerancia ±5%)', () => {
    [100, 470, 1000, 10000, 100000].forEach((ohms) => {
      expect(ohmsToBands(ohms)[3]).toBe('gold');
    });
  });
});

describe('ohmsToBands — casos borde', () => {
  it('0 Ω retorna bandas negras (caso borde seguro)', () => {
    expect(ohmsToBands(0)).toEqual(['black', 'black', 'black', 'gold']);
  });

  it('valor negativo retorna bandas negras', () => {
    expect(ohmsToBands(-100)).toEqual(['black', 'black', 'black', 'gold']);
  });

  it('null retorna bandas negras', () => {
    expect(ohmsToBands(null)).toEqual(['black', 'black', 'black', 'gold']);
  });

  it('retorna siempre un array de 4 elementos', () => {
    [1, 100, 1000, 1e6].forEach((ohms) => {
      expect(ohmsToBands(ohms)).toHaveLength(4);
    });
  });

  it('todos los valores retornados existen en colorCodeMap', () => {
    const validColors = [
      'black','brown','red','orange','yellow',
      'green','blue','violet','grey','white','gold','silver',
    ];
    [100, 470, 1000, 4700, 10000, 100000, 1000000].forEach((ohms) => {
      ohmsToBands(ohms).forEach((band) => {
        expect(validColors).toContain(band);
      });
    });
  });
});
