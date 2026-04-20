import { useRef, useEffect } from 'react';

const WAVEFORMS_MOCK = [
  { label: 'V(t)', color: '#6c63ff', freq: 1.0 },
  { label: 'I(t)', color: '#4ade80', freq: 0.6 },
  { label: 'P(t)', color: '#fbbf24', freq: 1.4, amplitudeScale: 0.7 },
];

/**
 * WaveformChart — Gráfica de formas de onda.
 *
 * Modos:
 *  - acData (Array): datos reales del análisis AC de la API.
 *    Dibuja magnitud de voltaje por nodo en función de la frecuencia (Bode).
 *  - Sin acData + isActive: animación sintética con Canvas API.
 *  - Sin acData + inactivo: dibuja ondas estáticas en gris.
 *
 * @param {{ circuit: object, isActive: boolean, acData: Array|null }} props
 */
export function WaveformChart({ circuit, isActive, acData }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const phaseRef  = useRef(0);

  // ── Modo Bode (datos AC reales) ─────────────────────────────────────────────
  useEffect(() => {
    if (!acData || !Array.isArray(acData) || acData.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1a1b1e';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = '#2e3139';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Extraer nodos disponibles del primer punto
    const nodos = Object.keys(acData[0]?.voltages ?? {});
    const COLORS = ['#6c63ff', '#4ade80', '#fbbf24', '#f87171', '#38bdf8'];

    nodos.forEach((nodo, idx) => {
      const magnitudes = acData.map((p) => p.voltages?.[nodo]?.magnitud ?? 0);
      const maxMag     = Math.max(...magnitudes, 1);

      ctx.beginPath();
      ctx.strokeStyle = COLORS[idx % COLORS.length];
      ctx.lineWidth = 2;

      acData.forEach((punto, i) => {
        const mag = punto.voltages?.[nodo]?.magnitud ?? 0;
        const px  = (i / (acData.length - 1)) * W;
        const py  = H - (mag / maxMag) * (H - 20) - 10;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      ctx.stroke();

      // Leyenda
      ctx.fillStyle = COLORS[idx % COLORS.length];
      ctx.font = '11px monospace';
      ctx.fillText(`V(${nodo})`, 8, 16 + idx * 18);
    });

    // Eje X — frecuencias
    const fMin = acData[0]?.frecuencia ?? 0;
    const fMax = acData[acData.length - 1]?.frecuencia ?? 0;
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.fillText(`${fMin}Hz`, 4, H - 4);
    ctx.fillText(`${fMax >= 1000 ? `${(fMax / 1000).toFixed(0)}kHz` : `${fMax}Hz`}`, W - 48, H - 4);
  }, [acData]);

  // ── Modo animación sintética ─────────────────────────────────────────────────
  useEffect(() => {
    if (acData && acData.length > 0) return; // defer a bode

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const amplitude = H / 2 - 20;

    function drawGrid() {
      ctx.strokeStyle = '#2e3139';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
    }

    function drawWaveforms() {
      WAVEFORMS_MOCK.forEach(({ label, color, freq, amplitudeScale = 1 }) => {
        ctx.beginPath();
        ctx.strokeStyle = isActive ? color : '#444';
        ctx.lineWidth = 2;
        for (let px = 0; px < W; px++) {
          const t = (px / W) * 4 * Math.PI + phaseRef.current;
          const y = H / 2 - amplitude * 0.55 * amplitudeScale * Math.sin(freq * t);
          px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
        }
        ctx.stroke();
      });
    }

    function drawLegend() {
      WAVEFORMS_MOCK.forEach(({ label, color }, i) => {
        ctx.fillStyle = isActive ? color : '#555';
        ctx.font = '11px monospace';
        ctx.fillText(label, 8, 16 + i * 18);
      });
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#1a1b1e';
      ctx.fillRect(0, 0, W, H);
      drawGrid();
      drawWaveforms();
      drawLegend();

      if (isActive) {
        phaseRef.current += 0.04;
        animRef.current = requestAnimationFrame(frame);
      }
    }

    frame();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isActive, acData]);

  const hint = acData?.length > 0
    ? `Análisis AC — ${acData.length} puntos de frecuencia`
    : isActive
      ? 'Simulación activa — ondas en tiempo real'
      : 'Inicia la simulación o ejecuta un análisis AC para ver las gráficas';

  return (
    <div>
      <p className="chart-hint">{hint}</p>
      <canvas
        ref={canvasRef}
        width={560}
        height={180}
        className="waveform"
        style={{ width: '100%', height: 180, borderRadius: 8 }}
      />
    </div>
  );
}