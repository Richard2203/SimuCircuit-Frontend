/**
 * Builders de configuracion para Chart.js
 */
import { formatValue } from '../components/Simulator/models/ComponentValueLabel.jsx';

// Tokens de tema

export const PALETTE = ['#6c63ff', '#4ade80', '#fbbf24', '#f87171', '#38bdf8', '#fb923c'];

const THEME = {
  tickColor:    '#5a6278',
  gridColor:    '#252830',
  legendColor:  '#94a3b8',
  tooltipBg:    '#252830',
  tooltipBorder:'#323540',
  titleColor:   '#94a3b8',
  axisColor:    '#5a6278',
  fontMono:     'monospace',
};

// Helpers de formato

export const fmtHz = (f) => formatValue(Number(f), 'Hz');
export const fmtV  = (v) => formatValue(Number(v), 'V');
export const fmtA  = (v) => formatValue(Number(v), 'A');
export const fmtT  = (t) => formatValue(Number(t), 's');

// Escalas y opciones base

const BASE_TICK = { color: THEME.tickColor, font: { size: 10, family: THEME.fontMono } };

export const BASE_SCALES = {
  x: { ticks: { ...BASE_TICK, maxTicksLimit: 10 }, grid: { color: THEME.gridColor } },
  y: { ticks: BASE_TICK,                           grid: { color: THEME.gridColor } },
};

export const BASE_OPTIONS = {
  responsive:          true,
  maintainAspectRatio: false,
  animation:           { duration: 500, easing: 'easeOutQuart' },
  interaction:         { mode: 'index', intersect: false },
  plugins: {
    legend: {
      position: 'top',
      labels: { color: THEME.legendColor, font: { size: 11, family: THEME.fontMono }, boxWidth: 12, padding: 12 },
    },
    tooltip: {
      backgroundColor: THEME.tooltipBg,
      borderColor:     THEME.tooltipBorder,
      borderWidth:     1,
      titleColor:      '#e2e8f0',
      bodyColor:       '#94a3b8',
      padding:         10,
    },
  },
  scales: BASE_SCALES,
};

// Helpers de construccion

/** Combina BASE_OPTIONS con overrides preservando plugins y scales anidados. */
function buildOptions({ title, tooltipCallbacks, xTitle, yTitle, extraScales = {} }) {
  return {
    ...BASE_OPTIONS,
    plugins: {
      ...BASE_OPTIONS.plugins,
      ...(title ? {
        title: { display: true, text: title, color: THEME.titleColor, font: { size: 12, family: THEME.fontMono } },
      } : {}),
      tooltip: {
        ...BASE_OPTIONS.plugins.tooltip,
        ...(tooltipCallbacks ? { callbacks: tooltipCallbacks } : {}),
      },
    },
    scales: {
      x: {
        ...BASE_SCALES.x,
        ...(xTitle ? { title: { display: true, text: xTitle, color: THEME.axisColor, font: { size: 10 } } } : {}),
        ...extraScales.x,
      },
      y: {
        ...BASE_SCALES.y,
        ...(yTitle ? { title: { display: true, text: yTitle, color: THEME.axisColor, font: { size: 10 } } } : {}),
        ...extraScales.y,
      },
    },
  };
}

/** Dataset base para graficas de linea finas (transitorias). */
function thinLineDataset({ label, data, colorIdx, fill = false }) {
  const color = PALETTE[colorIdx % PALETTE.length];
  return {
    label,
    data,
    borderColor:     color,
    backgroundColor: color + '20',
    borderWidth:     1.5,
    pointRadius:     0,
    tension:         0.1,
    fill,
  };
}

/** Dataset base para graficas de puntos discretos (DC). */
function discretePointDataset({ label, data, colorIdx }) {
  const color = PALETTE[colorIdx % PALETTE.length];
  return {
    label,
    data,
    borderColor:     color,
    backgroundColor: color + '33',
    borderWidth:     2,
    pointRadius:     6,
    pointHoverRadius:8,
    spanGaps:        false,
    fill:            false,
  };
}

/** Dataset base para graficas de barrido en frecuencia (AC). */
function sweepLineDataset({ label, data, colorIdx, fill = false, dashed = false }) {
  const color = PALETTE[colorIdx % PALETTE.length];
  return {
    label,
    data,
    borderColor:     color,
    backgroundColor: fill ? color + '22' : 'transparent',
    borderWidth:     2,
    pointRadius:     data.length > 30 ? 0 : 3,
    pointHoverRadius:5,
    tension:         0.3,
    fill,
    ...(dashed ? { borderDash: [4, 3] } : {}),
  };
}

// Builders publicos — uno por tipo de grafica

/**
 * Voltajes nodales DC (grafica de puntos discretos por nodo).
 * @param {{ nodos: [string, number][] }} params
 */
export function buildDCVoltageConfig({ nodos }) {
  return {
    type: 'line',
    data: {
      labels: nodos.map(([k]) => `Nodo ${k}`),
      datasets: nodos.map(([nodo, val], idx) =>
        discretePointDataset({
          label:    `V(${nodo})`,
          data:     nodos.map(([n]) => (n === nodo ? Number(val) : null)),
          colorIdx: idx,
        })
      ),
    },
    options: buildOptions({
      title:            'Voltajes nodales (DC)',
      yTitle:           'Voltaje (V)',
      tooltipCallbacks: { label: (i) => ` ${i.dataset.label}: ${fmtV(i.parsed.y)}` },
    }),
  };
}

/**
 * Corrientes de rama DC (grafica de puntos discretos por componente).
 * @param {{ ramas: [string, number][] }} params
 */
export function buildDCCurrentConfig({ ramas }) {
  return {
    type: 'line',
    data: {
      labels: ramas.map(([k]) => `I(${k})`),
      datasets: ramas.map(([comp, val], idx) =>
        discretePointDataset({
          label:    `I(${comp})`,
          data:     ramas.map(([c]) => (c === comp ? Number(val) : null)),
          colorIdx: idx + 2,
        })
      ),
    },
    options: buildOptions({
      title:            'Corrientes de rama (DC)',
      yTitle:           'Corriente (A)',
      tooltipCallbacks: { label: (i) => ` ${i.dataset.label}: ${fmtA(i.parsed.y)}` },
    }),
  };
}

/**
 * Diagrama de Bode — Magnitud.
 * @param {{ acData: object[], nodos: string[], labels: string[] }} params
 */
export function buildACMagnitudConfig({ acData, nodos, labels }) {
  return {
    type: 'line',
    data: {
      labels,
      datasets: nodos.map((nodo, idx) =>
        sweepLineDataset({
          label:    `|V(${nodo})|`,
          data:     acData.map((p) => p.voltages?.[nodo]?.magnitud ?? 0),
          colorIdx: idx,
          fill:     idx === 0,
        })
      ),
    },
    options: buildOptions({
      title:  'Bode — Magnitud',
      xTitle: 'Frecuencia (Hz)',
      yTitle: '|V| (V)',
      tooltipCallbacks: {
        title: (items) => `f = ${fmtHz(acData[items[0].dataIndex]?.frecuencia)}`,
        label: (i)     => ` ${i.dataset.label}: ${fmtV(i.parsed.y)}`,
      },
    }),
  };
}

/**
 * Diagrama de Bode — Fase.
 * @param {{ acData: object[], nodos: string[], labels: string[] }} params
 */
export function buildACFaseConfig({ acData, nodos, labels }) {
  return {
    type: 'line',
    data: {
      labels,
      datasets: nodos.map((nodo, idx) =>
        sweepLineDataset({
          label:    `∠V(${nodo})`,
          data:     acData.map((p) => p.voltages?.[nodo]?.fase ?? 0),
          colorIdx: idx,
          dashed:   true,
        })
      ),
    },
    options: buildOptions({
      title:  'Bode — Fase',
      xTitle: 'Frecuencia (Hz)',
      yTitle: 'Fase (°)',
      tooltipCallbacks: {
        title: (items) => `f = ${fmtHz(acData[items[0].dataIndex]?.frecuencia)}`,
        label: (i)     => ` ${i.dataset.label}: ${i.parsed.y}°`,
      },
      extraScales: {
        x: { ticks: {} },
      },
    }),
  };
}

/**
 * Voltajes transitorios V(t).
 * @param {{ tranData: object[], nodos: string[], meta: object }} params
 */
export function buildTRANVoltageConfig({ tranData, nodos, meta }) {
  const labels = tranData.map((s) => s.tiempo);
  return {
    type: 'line',
    data: {
      labels,
      datasets: nodos.map((nodo, idx) =>
        thinLineDataset({
          label:    meta.nodos.has(nodo) ? `V(${nodo}) — ${meta.nodos.get(nodo)}` : `V(${nodo})`,
          data:     tranData.map((s) => {
            const v = s.voltajes?.[nodo];
            if (typeof v === 'number') return v;
            if (v && typeof v === 'object' && 're' in v) return v.re;
            return 0;
          }),
          colorIdx: idx,
        })
      ),
    },
    options: buildOptions({
      xTitle: 'Tiempo (s)',
      yTitle: 'Voltaje (V)',
      tooltipCallbacks: {
        title: (items) => `t = ${fmtT(labels[items[0].dataIndex])}`,
        label: (ctx)   => `${ctx.dataset.label} = ${fmtV(ctx.parsed.y)}`,
      },
      extraScales: {
        x: { ticks: { callback: function (val) { return fmtT(this.getLabelForValue(val)); } } },
        y: { ticks: { callback: (v) => fmtV(v) } },
      },
    }),
  };
}

/**
 * Corrientes transitorias I(t).
 * @param {{ tranData: object[], comps: string[], meta: object }} params
 */
export function buildTRANCurrentConfig({ tranData, comps, meta }) {
  const labels = tranData.map((s) => s.tiempo);
  return {
    type: 'line',
    data: {
      labels,
      datasets: comps.map((id, idx) =>
        thinLineDataset({
          label:    meta.corrientes.get(id) ?? `I(${id})`,
          data:     tranData.map((s) => corrienteEscalar(s.corrientes?.[id])),
          colorIdx: idx,
        })
      ),
    },
    options: buildOptions({
      xTitle: 'Tiempo (s)',
      yTitle: 'Corriente (A)',
      tooltipCallbacks: {
        title: (items) => `t = ${fmtT(labels[items[0].dataIndex])}`,
        label: (ctx)   => `${ctx.dataset.label} = ${fmtA(ctx.parsed.y)}`,
      },
      extraScales: {
        x: { ticks: { callback: function (val) { return fmtT(this.getLabelForValue(val)); } } },
        y: { ticks: { callback: (v) => fmtA(v) } },
      },
    }),
  };
}

// Utilidades de datos

/** Extrae metadatos didacticos de la netlist para etiquetar nodos y corrientes. */
export function extraerMetadatos(netlist) {
  const meta = { nodos: new Map(), corrientes: new Map() };
  if (!Array.isArray(netlist)) return meta;

  for (const c of netlist) {
    if (c.type === 'transistor_bjt' || c.type === 'transistor_fet') {
      const nB = c.nodes?.nB?.nodo ?? c.nodes?.nB;
      const nC = c.nodes?.nC?.nodo ?? c.nodes?.nC;
      const nE = c.nodes?.nE?.nodo ?? c.nodes?.nE;
      if (nB) meta.nodos.set(String(nB), `base ${c.id}`);
      if (nC) meta.nodos.set(String(nC), `colector ${c.id}`);
      if (nE && String(nE) !== '0') meta.nodos.set(String(nE), `emisor ${c.id}`);
    }

    if (c.type === 'diodo') {
      const esLED = (c.params?.tipo || '').toLowerCase().startsWith('led');
      const n1 = c.nodes?.n1?.nodo ?? c.nodes?.n1;
      const n2 = c.nodes?.n2?.nodo ?? c.nodes?.n2;
      if (n1) meta.nodos.set(String(n1), `ánodo ${c.id}`);
      if (n2 && String(n2) !== '0') meta.nodos.set(String(n2), `cátodo ${c.id}`);
      meta.corrientes.set(c.id, `I(${c.id}) — ${esLED ? 'LED' : 'diodo'}`);
    }

    if (c.type === 'fuente_voltaje') {
      const dcAc = (c.params?.dcOrAc || '').toLowerCase();
      meta.corrientes.set(c.id, `I(${c.id}) — fuente ${dcAc.toUpperCase()}`);
    }
  }

  return meta;
}

/**
 * Extrae el valor escalar de una corriente (numero o objeto BJT {Ib, Ic, Ie}).
 * @param {number | object | null} i
 * @param {'Ic' | 'Ib' | 'Ie'} preferencia
 */
export function corrienteEscalar(i, preferencia = 'Ic') {
  if (i == null)             return 0;
  if (typeof i === 'number') return i;
  if (typeof i === 'object') {
    if (preferencia in i) return Number(i[preferencia]) || 0;
    return Number(i.Ic ?? i.Ib ?? i.Ie ?? 0) || 0;
  }
  return Number(i) || 0;
}