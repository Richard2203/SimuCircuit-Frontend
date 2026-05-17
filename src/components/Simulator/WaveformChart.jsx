import { useRef, useEffect, useState } from 'react';
import { formatValue } from './models/ComponentValueLabel.jsx';
import {
  Chart,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const PALETTE = ['#6c63ff', '#4ade80', '#fbbf24', '#f87171', '#38bdf8', '#fb923c'];

const BASE_SCALES = {
  x: {
    ticks: { color: '#5a6278', font: { size: 10, family: 'monospace' }, maxTicksLimit: 10 },
    grid:  { color: '#252830' },
  },
  y: {
    ticks: { color: '#5a6278', font: { size: 10, family: 'monospace' } },
    grid:  { color: '#252830' },
  },
};

const BASE_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 500, easing: 'easeOutQuart' },
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      position: 'top',
      labels: { color: '#94a3b8', font: { size: 11, family: 'monospace' }, boxWidth: 12, padding: 12 },
    },
    tooltip: {
      backgroundColor: '#252830',
      borderColor: '#323540',
      borderWidth: 1,
      titleColor: '#e2e8f0',
      bodyColor: '#94a3b8',
      padding: 10,
    },
  },
  scales: BASE_SCALES,
};

/** Frecuencia en Hz con sufijo k/M */
function formatHz(f) {
  return formatValue(Number(f), 'Hz');
}
/** Voltaje con sufijo m/µ/n/p/k/M */
const fmtV = (v) => formatValue(Number(v), 'V');
/** Corriente con sufijo m/µ/n/p/k/M */
const fmtA = (v) => formatValue(Number(v), 'A');

function useChart(canvasRef, config, deps) {
  const instanceRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    if (instanceRef.current) instanceRef.current.destroy();
    instanceRef.current = new Chart(canvasRef.current, config);
    return () => { if (instanceRef.current) instanceRef.current.destroy(); };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

// DC voltajes

function DCVoltageChart({ dcData }) {
  const ref = useRef(null);
  const nodos = Object.entries(dcData.voltages ?? {}).filter(([k]) => k !== '0');

  useChart(ref, {
    type: 'line',
    data: {
      labels: nodos.map(([k]) => `Nodo ${k}`),
      datasets: nodos.map(([nodo, val], idx) => ({
        label: `V(${nodo})`,
        data: nodos.map(([n]) => n === nodo ? Number(val) : null),
        borderColor: PALETTE[idx % PALETTE.length],
        backgroundColor: PALETTE[idx % PALETTE.length] + '33',
        borderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        spanGaps: false,
        fill: false,
      })),
    },
    options: {
      ...BASE_OPTIONS,
      plugins: {
        ...BASE_OPTIONS.plugins,
        title: { display: true, text: 'Voltajes nodales (DC)', color: '#94a3b8', font: { size: 12, family: 'monospace' } },
        tooltip: { ...BASE_OPTIONS.plugins.tooltip, callbacks: { label: (i) => ` ${i.dataset.label}: ${fmtV(i.parsed.y)}` } },
      },
      scales: { ...BASE_SCALES, y: { ...BASE_SCALES.y, title: { display: true, text: 'Voltaje (V)', color: '#5a6278', font: { size: 10 } } } },
    },
  }, [dcData]);

  if (nodos.length === 0) return null;
  return <canvas ref={ref} style={{ width: '100%', height: 200 }} />;
}

// DC corrientes

function DCCurrentChart({ dcData }) {
  const ref = useRef(null);
  const ramas = Object.entries(dcData.currents ?? {}).filter(([, v]) => Math.abs(v) > 1e-12);

  useChart(ref, {
    type: 'line',
    data: {
      labels: ramas.map(([k]) => `I(${k})`),
      datasets: ramas.map(([comp, val], idx) => ({
        label: `I(${comp})`,
        data: ramas.map(([c]) => c === comp ? Number(val) : null),
        borderColor: PALETTE[(idx + 2) % PALETTE.length],
        backgroundColor: PALETTE[(idx + 2) % PALETTE.length] + '33',
        borderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        spanGaps: false,
        fill: false,
      })),
    },
    options: {
      ...BASE_OPTIONS,
      plugins: {
        ...BASE_OPTIONS.plugins,
        title: { display: true, text: 'Corrientes de rama (DC)', color: '#94a3b8', font: { size: 12, family: 'monospace' } },
        tooltip: { ...BASE_OPTIONS.plugins.tooltip, callbacks: { label: (i) => ` ${i.dataset.label}: ${fmtA(i.parsed.y)}` } },
      },
      scales: { ...BASE_SCALES, y: { ...BASE_SCALES.y, title: { display: true, text: 'Corriente (A)', color: '#5a6278', font: { size: 10 } } } },
    },
  }, [dcData]);

  if (ramas.length === 0) return null;
  return <canvas ref={ref} style={{ width: '100%', height: 180 }} />;
}

// AC magnitud

function ACMagnitudChart({ acData }) {
  const ref = useRef(null);
  const nodos = Object.keys(acData[0]?.voltages ?? {}).filter(n => n !== '0');
  const labels = acData.map(p => formatHz(p.frecuencia));

  useChart(ref, {
    type: 'line',
    data: {
      labels,
      datasets: nodos.map((nodo, idx) => ({
        label: `|V(${nodo})|`,
        data: acData.map(p => p.voltages?.[nodo]?.magnitud ?? 0),
        borderColor: PALETTE[idx % PALETTE.length],
        backgroundColor: idx === 0 ? PALETTE[0] + '22' : 'transparent',
        borderWidth: 2,
        pointRadius: acData.length > 30 ? 0 : 3,
        pointHoverRadius: 5,
        tension: 0.3,
        fill: idx === 0,
      })),
    },
    options: {
      ...BASE_OPTIONS,
      plugins: {
        ...BASE_OPTIONS.plugins,
        title: { display: true, text: 'Bode — Magnitud', color: '#94a3b8', font: { size: 12, family: 'monospace' } },
        tooltip: {
          ...BASE_OPTIONS.plugins.tooltip,
          callbacks: {
            title: (items) => `f = ${formatHz(acData[items[0].dataIndex]?.frecuencia)}`,
            label: (i) => ` ${i.dataset.label}: ${fmtV(i.parsed.y)}`,
          },
        },
      },
      scales: {
        x: { ...BASE_SCALES.x, title: { display: true, text: 'Frecuencia (Hz)', color: '#5a6278', font: { size: 10 } } },
        y: { ...BASE_SCALES.y, title: { display: true, text: '|V| (V)', color: '#5a6278', font: { size: 10 } } },
      },
    },
  }, [acData]);

  return <canvas ref={ref} style={{ width: '100%', height: 220 }} />;
}

// AC fase

function ACFaseChart({ acData }) {
  const ref = useRef(null);
  const nodos = Object.keys(acData[0]?.voltages ?? {}).filter(n => n !== '0');
  const labels = acData.map(p => formatHz(p.frecuencia));

  useChart(ref, {
    type: 'line',
    data: {
      labels,
      datasets: nodos.map((nodo, idx) => ({
        label: `∠V(${nodo})`,
        data: acData.map(p => p.voltages?.[nodo]?.fase ?? 0),
        borderColor: PALETTE[idx % PALETTE.length],
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: acData.length > 30 ? 0 : 3,
        pointHoverRadius: 5,
        tension: 0.3,
        fill: false,
        borderDash: [4, 3],
      })),
    },
    options: {
      ...BASE_OPTIONS,
      plugins: {
        ...BASE_OPTIONS.plugins,
        title: { display: true, text: 'Bode — Fase', color: '#94a3b8', font: { size: 12, family: 'monospace' } },
        tooltip: {
          ...BASE_OPTIONS.plugins.tooltip,
          callbacks: {
            title: (items) => `f = ${formatHz(acData[items[0].dataIndex]?.frecuencia)}`,
            label: (i) => ` ${i.dataset.label}: ${i.parsed.y}°`,
          },
        },
      },
      scales: {
        x: { ...BASE_SCALES.x, title: { display: true, text: 'Frecuencia (Hz)', color: '#5a6278', font: { size: 10 } } },
        y: { ...BASE_SCALES.y, title: { display: true, text: 'Fase (°)', color: '#5a6278', font: { size: 10 } } },
      },
    },
  }, [acData]);

  return <canvas ref={ref} style={{ width: '100%', height: 180 }} />;
}

// Graficas TRANSITORIAS
//
// Reciben tranData: array de snapshots con shape
//   { tiempo: number, voltajes: { nodoId: V }, corrientes: { compId: I | {Ib,Ic,Ie} } }
// y opcionalmente netlist para identificar nodos especiales (base BJT, colector,
// anodo/catado de LED) y poner etiquetas didacticas.

/** Tiempo en segundos con sufijo automatico us/ms/s */
const fmtT = (t) => formatValue(Number(t), 's');

/**
 * Extrae metadatos utiles de la netlist para que las leyendas tengan nombres
 * legibles
 */
function extraerMetadatos(netlist) {
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
      const tipo = esLED ? 'LED' : 'diodo';
      const n1 = c.nodes?.n1?.nodo ?? c.nodes?.n1;
      const n2 = c.nodes?.n2?.nodo ?? c.nodes?.n2;
      if (n1) meta.nodos.set(String(n1), `ánodo ${c.id}`);
      if (n2 && String(n2) !== '0') meta.nodos.set(String(n2), `cátodo ${c.id}`);
      meta.corrientes.set(c.id, `I(${c.id}) — ${tipo}`);
    }
    if (c.type === 'fuente_voltaje') {
      const dcAc = (c.params?.dcOrAc || '').toLowerCase();
      meta.corrientes.set(c.id, `I(${c.id}) — fuente ${dcAc.toUpperCase()}`);
    }
  }
  return meta;
}

/** Saca el valor real de una corriente, que puede ser numero o {Ib,Ic,Ie} para BJT */
function corrienteEscalar(i, preferencia = 'Ic') {
  if (i == null) return 0;
  if (typeof i === 'number') return i;
  if (typeof i === 'object') {
    if (preferencia in i) return Number(i[preferencia]) || 0;
    return Number(i.Ic ?? i.Ib ?? i.Ie ?? 0) || 0;
  }
  return Number(i) || 0;
}

/**
 * Grafica de voltajes vs tiempo 
 * Por defecto muestra todos los nodos excepto GND.
 */
function TRANVoltageChart({ tranData, meta }) {
  const ref = useRef(null);
  // Tomar la lista de nodos del primer snapshot (excluyendo GND)
  const nodos = Object.keys(tranData[0]?.voltajes ?? {}).filter(n => n !== '0').sort();
  const labels = tranData.map(s => s.tiempo);

  useChart(ref, {
    type: 'line',
    data: {
      labels,
      datasets: nodos.map((nodo, idx) => ({
        label: meta.nodos.has(nodo) ? `V(${nodo}) — ${meta.nodos.get(nodo)}` : `V(${nodo})`,
        data: tranData.map(s => {
          const v = s.voltajes?.[nodo];
          if (typeof v === 'number') return v;
          if (v && typeof v === 'object' && 're' in v) return v.re;
          return 0;
        }),
        borderColor: PALETTE[idx % PALETTE.length],
        backgroundColor: PALETTE[idx % PALETTE.length] + '20',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.1,
      })),
    },
    options: {
      ...BASE_OPTIONS,
      plugins: {
        ...BASE_OPTIONS.plugins,
        tooltip: {
          ...BASE_OPTIONS.plugins.tooltip,
          callbacks: {
            title: (items) => `t = ${fmtT(labels[items[0].dataIndex])}`,
            label: (ctx) => `${ctx.dataset.label} = ${fmtV(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          ...BASE_SCALES.x,
          title: { display: true, text: 'Tiempo (s)', color: '#5a6278', font: { size: 10 } },
          ticks: {
            ...BASE_SCALES.x.ticks,
            callback: function (val) { return fmtT(this.getLabelForValue(val)); },
          },
        },
        y: {
          ...BASE_SCALES.y,
          title: { display: true, text: 'Voltaje (V)', color: '#5a6278', font: { size: 10 } },
          ticks: {
            ...BASE_SCALES.y.ticks,
            callback: (v) => fmtV(v),
          },
        },
      },
    },
  }, [tranData]);

  return <canvas ref={ref} style={{ width: '100%', height: 220 }} />;
}

/** Grafica de corrientes vs tiempo (tipo osciloscopio) */
function TRANCurrentChart({ tranData, meta }) {
  const ref = useRef(null);
  // Filtramos componentes cuya corriente es aproximadamente 0 todo el tiempo (no aporta)
  const compsRelevantes = Object.keys(tranData[0]?.corrientes ?? {}).filter(id => {
    return tranData.some(s => Math.abs(corrienteEscalar(s.corrientes?.[id])) > 1e-9);
  }).sort();

  const labels = tranData.map(s => s.tiempo);

  useChart(ref, {
    type: 'line',
    data: {
      labels,
      datasets: compsRelevantes.map((id, idx) => ({
        label: meta.corrientes.get(id) ?? `I(${id})`,
        data: tranData.map(s => corrienteEscalar(s.corrientes?.[id])),
        borderColor: PALETTE[idx % PALETTE.length],
        backgroundColor: PALETTE[idx % PALETTE.length] + '20',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.1,
      })),
    },
    options: {
      ...BASE_OPTIONS,
      plugins: {
        ...BASE_OPTIONS.plugins,
        tooltip: {
          ...BASE_OPTIONS.plugins.tooltip,
          callbacks: {
            title: (items) => `t = ${fmtT(labels[items[0].dataIndex])}`,
            label: (ctx) => `${ctx.dataset.label} = ${fmtA(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          ...BASE_SCALES.x,
          title: { display: true, text: 'Tiempo (s)', color: '#5a6278', font: { size: 10 } },
          ticks: {
            ...BASE_SCALES.x.ticks,
            callback: function (val) { return fmtT(this.getLabelForValue(val)); },
          },
        },
        y: {
          ...BASE_SCALES.y,
          title: { display: true, text: 'Corriente (A)', color: '#5a6278', font: { size: 10 } },
          ticks: {
            ...BASE_SCALES.y.ticks,
            callback: (v) => fmtA(v),
          },
        },
      },
    },
  }, [tranData]);

  return <canvas ref={ref} style={{ width: '100%', height: 200 }} />;
}

// SubTabPill

function SubTabPill({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '2px 12px', fontSize: 11, fontFamily: 'monospace',
      borderRadius: 4, border: '1px solid', cursor: 'pointer',
      background: active ? '#6c63ff' : 'transparent',
      borderColor: active ? '#6c63ff' : '#323540',
      color: active ? '#fff' : '#5a6278',
      transition: 'all .15s',
    }}>
      {children}
    </button>
  );
}

// WaveformChart

/**
 * WaveformChart — Graficas de formas de onda.
 *
 * Modos (en orden de prioridad):
 *  1. tranData -> V(t) e I(t) tipo osciloscopio (Micro-Cap style).
 *                 Array de { tiempo, voltajes, corrientes }.
 *                 Es lo que el usuario realmente quiere ver para circuitos
 *                 de switching (BJT + LED + AC).
 *  2. acData   -> Bode magnitud + fase. Sirve para filtros lineales (RC/RL/RLC).
 *                 Array ya transformado: { frecuencia, voltages, currents }.
 *  3. dcData   -> Voltajes nodales y corrientes de rama (graficas estáticas).
 *  4. Mensaje vacío.
 *
 * @param {{
 *   circuit: object,
 *   isActive: boolean,
 *   acData: Array,
 *   dcData: object,
 *   tranData: Array,
 *   netlist: Array
 * }} props
 */
export function WaveformChart({ circuit, isActive, acData, dcData, tranData, netlist }) {
  const [acSubTab, setAcSubTab] = useState('magnitud');
  const [tranSubTab, setTranSubTab] = useState('voltaje');

  const hasTRAN = Array.isArray(tranData) && tranData.length > 0;
  const hasAC   = Array.isArray(acData) && acData.length > 0;
  const hasDC   = dcData && Object.keys(dcData.voltages ?? {}).filter(k => k !== '0').length > 0;

  // Metadatos para etiquetas didacticas en las leyendas
  const tranMeta = hasTRAN ? extraerMetadatos(netlist) : { nodos: new Map(), corrientes: new Map() };

  let hint;
  if (hasTRAN) {
    const tMin = tranData[0]?.tiempo ?? 0;
    const tMax = tranData[tranData.length - 1]?.tiempo ?? 0;
    hint = `Transitorio — ${tranData.length} muestras · ${fmtT(tMin)} → ${fmtT(tMax)}`;
  } else if (hasAC) {
    hint = `AC — ${acData.length} puntos · ${formatHz(acData[0]?.frecuencia)} → ${formatHz(acData[acData.length-1]?.frecuencia)}`;
  } else if (hasDC) {
    hint = 'DC — voltajes nodales y corrientes de rama';
  } else {
    hint = 'Ejecuta Simular DC, ∿ Simular AC o ⏱ Simular Transitorio para ver las gráficas.';
  }

  const wrap = (children) => (
    <div style={{ background: '#16181d', borderRadius: 8, padding: '12px 8px' }}>{children}</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p className="chart-hint">{hint}</p>

      {hasTRAN && (
        <>
          <div style={{ display: 'flex', gap: 6 }}>
            <SubTabPill active={tranSubTab === 'voltaje'}   onClick={() => setTranSubTab('voltaje')}>Voltajes V(t)</SubTabPill>
            <SubTabPill active={tranSubTab === 'corriente'} onClick={() => setTranSubTab('corriente')}>Corrientes I(t)</SubTabPill>
          </div>
          {wrap(
            tranSubTab === 'voltaje'
              ? <TRANVoltageChart tranData={tranData} meta={tranMeta} />
              : <TRANCurrentChart tranData={tranData} meta={tranMeta} />
          )}
        </>
      )}

      {!hasTRAN && hasAC && (
        <>
          <div style={{ display: 'flex', gap: 6 }}>
            <SubTabPill active={acSubTab === 'magnitud'} onClick={() => setAcSubTab('magnitud')}>Magnitud</SubTabPill>
            <SubTabPill active={acSubTab === 'fase'}     onClick={() => setAcSubTab('fase')}>Fase</SubTabPill>
          </div>
          {wrap(acSubTab === 'magnitud' ? <ACMagnitudChart acData={acData} /> : <ACFaseChart acData={acData} />)}
        </>
      )}

      {!hasTRAN && !hasAC && hasDC && (
        <>
          {wrap(<DCVoltageChart dcData={dcData} />)}
          {wrap(<DCCurrentChart dcData={dcData} />)}
        </>
      )}

      {!hasTRAN && !hasAC && !hasDC && (
        <div style={{
          background: '#1e1e2e',
          borderRadius: 8,
          padding: '32px 16px',
          textAlign: 'center',
          color: '#64748b',
          fontSize: 13,
          fontFamily: 'monospace',
        }}>
          No hay datos de simulación aún.<br />
          Presiona <strong>Simular DC</strong>, <strong>∿ Simular AC</strong> o <strong>⏱ Simular Transitorio</strong> para generar las gráficas.
        </div>
      )}
    </div>
  );
}