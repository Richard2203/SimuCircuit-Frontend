import { useRef, useEffect, useState } from 'react';
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

function formatHz(f) {
  if (f >= 1e6) return `${(f / 1e6).toFixed(1)}M`;
  if (f >= 1e3) return `${(f / 1e3).toFixed(0)}k`;
  return `${Number(f).toFixed(0)}`;
}

function useChart(canvasRef, config, deps) {
  const instanceRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    if (instanceRef.current) instanceRef.current.destroy();
    instanceRef.current = new Chart(canvasRef.current, config);
    return () => { if (instanceRef.current) instanceRef.current.destroy(); };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

// --- DC voltajes ----------------------------------------------------------

function DCVoltageChart({ dcData }) {
  const ref = useRef(null);
  const nodos = Object.entries(dcData.voltages ?? {}).filter(([k]) => k !== '0');

  useChart(ref, {
    type: 'line',
    data: {
      labels: nodos.map(([k]) => `Nodo ${k}`),
      datasets: nodos.map(([nodo, val], idx) => ({
        label: `V(${nodo})`,
        data: nodos.map(([n]) => n === nodo ? Number(Number(val).toFixed(4)) : null),
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
        tooltip: { ...BASE_OPTIONS.plugins.tooltip, callbacks: { label: (i) => ` ${i.dataset.label}: ${i.parsed.y} V` } },
      },
      scales: { ...BASE_SCALES, y: { ...BASE_SCALES.y, title: { display: true, text: 'Voltaje (V)', color: '#5a6278', font: { size: 10 } } } },
    },
  }, [dcData]);

  if (nodos.length === 0) return null;
  return <canvas ref={ref} style={{ width: '100%', height: 200 }} />;
}

// --- DC corrientes ----------------------------------------------------------

function DCCurrentChart({ dcData }) {
  const ref = useRef(null);
  const ramas = Object.entries(dcData.currents ?? {}).filter(([, v]) => Math.abs(v) > 1e-12);

  useChart(ref, {
    type: 'line',
    data: {
      labels: ramas.map(([k]) => `I(${k})`),
      datasets: ramas.map(([comp, val], idx) => ({
        label: `I(${comp})`,
        data: ramas.map(([c]) => c === comp ? Number(Number(val).toFixed(6)) : null),
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
        tooltip: { ...BASE_OPTIONS.plugins.tooltip, callbacks: { label: (i) => ` ${i.dataset.label}: ${i.parsed.y} A` } },
      },
      scales: { ...BASE_SCALES, y: { ...BASE_SCALES.y, title: { display: true, text: 'Corriente (A)', color: '#5a6278', font: { size: 10 } } } },
    },
  }, [dcData]);

  if (ramas.length === 0) return null;
  return <canvas ref={ref} style={{ width: '100%', height: 180 }} />;
}

// --- AC magnitud ----------------------------------------------------------

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
        data: acData.map(p => Number((p.voltages?.[nodo]?.magnitud ?? 0).toFixed(6))),
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
            title: (items) => `f = ${acData[items[0].dataIndex]?.frecuencia} Hz`,
            label: (i) => ` ${i.dataset.label}: ${i.parsed.y} V`,
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

// --- AC fase ----------------------------------------------------------

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
        data: acData.map(p => Number((p.voltages?.[nodo]?.fase ?? 0).toFixed(2))),
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
            title: (items) => `f = ${acData[items[0].dataIndex]?.frecuencia} Hz`,
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

// --- SubTabPill ----------------------------------------------------------

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

// --- WaveformChart ----------------------------------------------------------

/**
 * WaveformChart — Grafica de formas de onda.
 *
 * Modos (en orden de prioridad):
 *  1. acData  → Bode magnitud + fase (lineas, Chart.js).
 *               acData debe llegar ya transformado por SimulacionService: 
 *               Array de { frecuencia, voltages: { nodo: { magnitud, fase } } }
 *  2. dcData  → Voltajes nodales + corrientes de rama (lineas de puntos, Chart.js)
 *  3. Animacion sintetica con Canvas API
 *
 * @param {{ circuit, isActive, acData, dcData }} props
 */
export function WaveformChart({ circuit, isActive, acData, dcData }) {
  const [acSubTab, setAcSubTab] = useState('magnitud');

  const hasAC = Array.isArray(acData) && acData.length > 0;
  const hasDC = dcData && Object.keys(dcData.voltages ?? {}).filter(k => k !== '0').length > 0;

  const hint = hasAC
    ? `AC — ${acData.length} puntos · ${acData[0]?.frecuencia}Hz → ${acData[acData.length-1]?.frecuencia}Hz`
    : hasDC
      ? 'DC — voltajes nodales y corrientes de rama'
      : 'Ejecuta Simular DC o ∿ Simular AC para ver las gráficas.';

  const wrap = (children) => (
    <div style={{ background: '#16181d', borderRadius: 8, padding: '12px 8px' }}>{children}</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p className="chart-hint">{hint}</p>

      {hasAC && (
        <>
          <div style={{ display: 'flex', gap: 6 }}>
            <SubTabPill active={acSubTab === 'magnitud'} onClick={() => setAcSubTab('magnitud')}>Magnitud</SubTabPill>
            <SubTabPill active={acSubTab === 'fase'}     onClick={() => setAcSubTab('fase')}>Fase</SubTabPill>
          </div>
          {wrap(acSubTab === 'magnitud' ? <ACMagnitudChart acData={acData} /> : <ACFaseChart acData={acData} />)}
        </>
      )}

      {!hasAC && hasDC && (
        <>
          {wrap(<DCVoltageChart dcData={dcData} />)}
          {wrap(<DCCurrentChart dcData={dcData} />)}
        </>
      )}

      {!hasAC && !hasDC && (
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
          Presiona <strong>Simular DC</strong> o <strong>∿ Simular AC</strong> para generar las gráficas.
        </div>
      )}
    </div>
  );
}