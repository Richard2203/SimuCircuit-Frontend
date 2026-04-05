import { useRef, useEffect } from 'react';

const WAVEFORMS = [
  { label: 'V(t)', color: '#6c63ff', freq: 1.0 },
  { label: 'I(t)', color: '#4ade80', freq: 0.6 },
  { label: 'P(t)', color: '#fbbf24', freq: 1.4, amplitudeScale: 0.7 },
];

/**
 * WaveformChart — Gráfica de ondas animadas con Canvas API.
 * Anima solo cuando isActive === true para ahorrar recursos.
 *
 * @param {{ circuit: object, isActive: boolean }} props
 */
export function WaveformChart({ circuit, isActive }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const phaseRef = useRef(0);

  useEffect(() => {
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
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
    }

    function drawWaveforms() {
      WAVEFORMS.forEach(({ label, color, freq, amplitudeScale = 1 }) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
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
      WAVEFORMS.forEach(({ label, color }, i) => {
        ctx.fillStyle = color;
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
  }, [isActive]);

  return (
    <div>
      <p className="chart-hint">
        {isActive
          ? 'Simulación activa — ondas en tiempo real'
          : 'Inicia la simulación para animar las ondas'}
      </p>
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
