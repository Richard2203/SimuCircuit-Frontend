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

// ─── DC voltajes ───────────────────────────────────────────────────────────────

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

// ─── DC corrientes ─────────────────────────────────────────────────────────────

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

// ─── AC magnitud ───────────────────────────────────────────────────────────────

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

// ─── AC fase ───────────────────────────────────────────────────────────────────

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

// ─── Sintetico ─────────────────────────────────────────────────────────────────

const WAVEFORMS_MOCK = [
  { label: 'V(t)', color: '#6c63ff', freq: 1.0 },
  { label: 'I(t)', color: '#4ade80', freq: 0.6 },
  { label: 'P(t)', color: '#fbbf24', freq: 1.4, amplitudeScale: 0.7 },
];

function SyntheticCanvas({ isActive }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const phaseRef  = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr  = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;
    const amplitude = H / 2 - 20;

    function frame() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#16181d'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#252830'; ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
      ctx.strokeStyle = '#323540'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke();

      WAVEFORMS_MOCK.forEach(({ label, color, freq, amplitudeScale = 1 }, idx) => {
        ctx.beginPath();
        ctx.strokeStyle = isActive ? color : '#2e3139';
        ctx.lineWidth = isActive ? 2 : 1.5;
        for (let px = 0; px < W; px++) {
          const t = (px / W) * 4 * Math.PI + phaseRef.current;
          const y = H/2 - amplitude * 0.55 * amplitudeScale * Math.sin(freq * t);
          px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
        }
        ctx.stroke();
        ctx.fillStyle = isActive ? color : '#3a3f4e';
        ctx.font = '11px monospace';
        ctx.fillText(label, 8, 16 + idx * 18);
      });

      if (isActive) { phaseRef.current += 0.04; animRef.current = requestAnimationFrame(frame); }
    }

    frame();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isActive]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: 200, borderRadius: 8, display: 'block', background: '#16181d' }} />;
}

// ─── SubTabPill ────────────────────────────────────────────────────────────────

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

// ─── WaveformChart ─────────────────────────────────────────────────────────────

/**
 * WaveformChart — Grafica de formas de onda.
 *
 * Modos (en orden de prioridad):
 *  1. acData  → Bode magnitud + fase (lineas, Chart.js).
 *               acData debe llegar ya transformado por SimulacionService: 
 *               Array de { frecuencia, voltages: { nodo: { magnitud, fase } } }
 *  2. dcData  → Voltajes nodales + corrientes de rama (lineas de puntos, Chart.js)
 *  3. Animación sintetica con Canvas API
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
      : isActive
        ? 'Simulación activa — forma de onda en tiempo real'
        : 'Ejecuta ⚡ Simular DC o ∿ Simular AC para ver las gráficas';

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

      {!hasAC && !hasDC && <SyntheticCanvas isActive={isActive} />}
    </div>
  );
}