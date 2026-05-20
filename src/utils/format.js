/**
 * Funciones de formato centralizadas.
 */
import { formatValue } from '../components/Simulator/models/ComponentValueLabel.jsx';

export const fmtV    = (v)            => formatValue(Number(v), 'V');
export const fmtA    = (v)            => formatValue(Number(v), 'A');
export const fmtOhm  = (v)            => formatValue(Number(v), 'Ω');
export const fmtAuto = (v, unit = '') => formatValue(Number(v), unit);

/**
 * Convierte el subconjunto de LaTeX que devuelve el backend a texto plano legible.
 */
export function latexToText(str) {
  if (!str) return '';
  return str
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1) / ($2)')
    .replace(/\_\{([^}]+)\}/g,  (_, s) => s)
    .replace(/\_([a-zA-Z0-9])/g, (_, s) => s)
    .replace(/\^\{([^}]+)\}/g,  '^$1')
    .replace(/\^([a-zA-Z0-9])/g, '^$1')
    .replace(/\\text\{([^}]+)\}/g,   '$1')
    .replace(/\\mathrm\{([^}]+)\}/g, '$1')
    .replace(/\\Omega/g, 'Ω').replace(/\\omega/g, 'ω')
    .replace(/\\alpha/g, 'α').replace(/\\beta/g,  'β')
    .replace(/\\pi/g,    'π').replace(/\\infty/g, '∞')
    .replace(/\\cdot/g,  '·').replace(/\\times/g, '×')
    .replace(/\\approx/g,'≈').replace(/\\leq/g,   '≤')
    .replace(/\\geq/g,   '≥').replace(/\\neq/g,   '≠')
    .replace(/[{}]/g, '').replace(/\\/g, '').trim();
}

/** Redondea a 5 cifras significativas para suprimir ruido de punto flotante. */
export function formatNums(str) {
  return str.replace(/(-?\d+\.\d+)/g, (match) => {
    const n = parseFloat(match);
    return Number.isInteger(n) ? String(n) : parseFloat(n.toPrecision(5)).toString();
  });
}

/**
 * Normaliza el mapa de corrientes del backend a una lista plana de { label, value }.
 *
 * El backend puede devolver tres formatos distintos segun el componente:
 *   - Escalar:    { R1: 0.012 }
 *   - BJT:        { Q1: { Ib, Ic, Ie } }
 *   - FET/JFET:   { J1: { Id, Ig, Is } }
 *   - Regulador:  { U1: { I_in, I_out, I_gnd } }
 *     (LM317/337/338/350 son ajustables: I_gnd se etiqueta I_adj)
 *
 * @param {object} currents  - resultado.currents del backend
 * @param {object[]} comps   - netlist para detectar el modelo de regulador
 * @returns {{ label: string, value: number }[]}
 */
export function expandirCorrientes(currents, comps = []) {
  const rows = [];

  for (const [id, i] of Object.entries(currents ?? {})) {
    if (i == null) continue;

    if (typeof i === 'number') {
      rows.push({ label: `I(${id})`, value: i });
      continue;
    }

    if (typeof i === 'object') {
      // BJT
      if ('Ib' in i || 'Ic' in i || 'Ie' in i) {
        if ('Ib' in i) rows.push({ label: `Ib(${id})`, value: i.Ib });
        if ('Ic' in i) rows.push({ label: `Ic(${id})`, value: i.Ic });
        if ('Ie' in i) rows.push({ label: `Ie(${id})`, value: i.Ie });
        continue;
      }
      // FET / JFET
      if ('Id' in i || 'Ig' in i || 'Is' in i) {
        if ('Id' in i) rows.push({ label: `Id(${id})`, value: i.Id });
        if ('Ig' in i) rows.push({ label: `Ig(${id})`, value: i.Ig });
        if ('Is' in i) rows.push({ label: `Is(${id})`, value: i.Is });
        continue;
      }
      // Regulador de voltaje
      if ('I_in' in i || 'I_out' in i || 'I_gnd' in i) {
        const comp      = comps.find((c) => c.id === id);
        const code      = String(comp?.value || '').toUpperCase();
        const tipo      = String(comp?.params?.tipo || '').toLowerCase();
        const adjustable = /^LM(317|337|338|350)/.test(code) || tipo.includes('ajustable');
        const gndLabel  = adjustable ? 'I_adj' : 'I_gnd';

        if ('I_in'  in i) rows.push({ label: `I_in(${id})`,       value: i.I_in  });
        if ('I_out' in i) rows.push({ label: `I_out(${id})`,       value: i.I_out });
        if ('I_gnd' in i) rows.push({ label: `${gndLabel}(${id})`, value: i.I_gnd });
        continue;
      }
      // Fallback: tomar el primer valor numérico
      const first = Object.values(i).find((v) => typeof v === 'number');
      if (first !== undefined) rows.push({ label: `I(${id})`, value: first });
    }
  }

  return rows;
}

/**
 * Devuelve el indice del snapshot con la mayor actividad de corriente.
 * Usar el punto medio puede coincidir con un cruce por cero y mostrar
 * valores triviales al usuario.
 */
export function findPeakSnapshotIndex(tranResults) {
  let bestIdx = Math.floor(tranResults.length / 2);
  let bestMag = -1;

  for (let i = 0; i < tranResults.length; i++) {
    const currents = tranResults[i]?.corrientes ?? {};
    let maxMag = 0;
    for (const v of Object.values(currents)) {
      let val;
      if (typeof v === 'number') val = Math.abs(v);
      else if (v && typeof v === 'object') val = Math.abs(Number(v.Ic ?? v.Ib ?? v.Ie ?? 0));
      else val = 0;
      if (val > maxMag) maxMag = val;
    }
    if (maxMag > bestMag) { bestMag = maxMag; bestIdx = i; }
  }

  return bestIdx;
}