
/** Tabla maestra de colores. */
export const RESISTOR_COLORS = [
  { es: 'Negro',    en: 'black',  digit: 0,    factor: 1,         tolerance: null,    hex: '#000000' },
  { es: 'Marrón',   en: 'brown',  digit: 1,    factor: 10,        tolerance: '±1%',   hex: '#8B4513' },
  { es: 'Rojo',     en: 'red',    digit: 2,    factor: 100,       tolerance: '±2%',   hex: '#FF0000' },
  { es: 'Naranja',  en: 'orange', digit: 3,    factor: 1_000,     tolerance: null,    hex: '#FFA500' },
  { es: 'Amarillo', en: 'yellow', digit: 4,    factor: 10_000,    tolerance: null,    hex: '#FFFF00' },
  { es: 'Verde',    en: 'green',  digit: 5,    factor: 100_000,   tolerance: '±0.5%', hex: '#008000' },
  { es: 'Azul',     en: 'blue',   digit: 6,    factor: 1_000_000, tolerance: '±0.25%',hex: '#0000FF' },
  { es: 'Morado',   en: 'violet', digit: 7,    factor: 10_000_000,tolerance: '±0.1%', hex: '#EE82EE' },
  { es: 'Gris',     en: 'grey',   digit: 8,    factor: 100_000_000, tolerance: '±0.05%', hex: '#808080' },
  { es: 'Blanco',   en: 'white',  digit: 9,    factor: 1_000_000_000, tolerance: null,  hex: '#FFFFFF' },
  { es: 'Dorado',   en: 'gold',   digit: null, factor: 0.1,       tolerance: '±5%',   hex: '#CFB53B' },
  { es: 'Plateado', en: 'silver', digit: null, factor: 0.01,      tolerance: '±10%',  hex: '#C0C0C0' },
];

/** Solo colores que pueden ser digito significativo (bandas 1 y 2). */
export const DIGIT_COLORS = RESISTOR_COLORS.filter((c) => c.digit !== null);

/** Solo colores que pueden ser multiplicador (banda 3). */
export const MULTIPLIER_COLORS = RESISTOR_COLORS.filter((c) =>
  ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'gold', 'silver'].includes(c.en)
);

/** Solo colores que pueden ser banda de tolerancia. */
export const TOLERANCE_COLORS = RESISTOR_COLORS.filter((c) => c.tolerance !== null);

/** Vector de nombres en ingles indexado por digito (0..9) — uso interno del simulador. */
export const BAND_COLORS = DIGIT_COLORS.map((c) => c.en);

/** Mapa { en: { color: hex } } — formato legacy compatible con resistor.jsx. */
export const colorCodeMap = RESISTOR_COLORS.reduce((acc, c) => {
  acc[c.en] = { color: c.hex };
  return acc;
}, {});

/** Busca un color por su nombre (es o en), case-insensitive. */
export function colorByName(name) {
  if (!name) return null;
  const n = String(name).toLowerCase();
  return RESISTOR_COLORS.find(
    (c) => c.es.toLowerCase() === n || c.en.toLowerCase() === n
  );
}

/** Obtiene el hex de un color por nombre (es o en). */
export function getHex(name) {
  return colorByName(name)?.hex ?? 'transparent';
}

/** Convierte nombre español → ingles */
export function esToEn(es) {
  return colorByName(es)?.en ?? null;
}

/** Convierte nombre ingles → español*/
export function enToEs(en) {
  return colorByName(en)?.es ?? null;
}

/**
 * ohms → bandas (en ingles por defecto, para uso del simulador).
 */
export function ohmsToBands(ohms, lang = 'en') {
  if (!ohms || ohms <= 0) {
    return lang === 'es'
      ? ['Negro', 'Negro', 'Negro', 'Dorado']
      : ['black', 'black', 'black', 'gold'];
  }

  const exp  = Math.floor(Math.log10(ohms)) - 1;
  const base = Math.round(ohms / Math.pow(10, exp));

  const digit1 = Math.floor(base / 10) % 10;
  const digit2 = base % 10;
  const multiplier = exp;

  const bandEn = [
    BAND_COLORS[digit1],
    BAND_COLORS[digit2],
    multiplier >= 0 ? BAND_COLORS[multiplier] : 'silver',
    'gold',
  ];

  return lang === 'es' ? bandEn.map(enToEs) : bandEn;
}

export function bandsToOhms(banda1, banda2, banda3) {
  const c1 = colorByName(banda1);
  const c2 = colorByName(banda2);
  const c3 = colorByName(banda3);
  if (!c1 || !c2 || !c3) return 0;
  if (c1.digit === null || c2.digit === null) return 0;
  return (c1.digit * 10 + c2.digit) * c3.factor;
}
