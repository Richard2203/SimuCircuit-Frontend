/**
 * Control de velocidad + pause/play para la animacion transitoria.
 */
import { formatValue } from '../components/Simulator/models/ComponentValueLabel.jsx';

const LOG_MIN     = -3;   // 10^-3 = 0.001
const LOG_DECADES =  3;

function speedToSlider(speed) {
  return Math.round((Math.log10(speed) - LOG_MIN) / LOG_DECADES * 100);
}
function sliderToSpeed(slider) {
  return Math.pow(10, (slider / 100) * LOG_DECADES + LOG_MIN);
}
function speedLabel(speed) {
  const factor = 1 / speed;
  if (speed >= 0.5)  return `Tiempo real (×${speed.toFixed(2)})`;
  if (speed >= 0.1)  return `Lento (${factor.toFixed(0)}× más lento)`;
  if (speed >= 0.01) return `Muy lento (${factor.toFixed(0)}× más lento)`;
  return `Cámara lenta (${factor.toFixed(0)}× más lento)`;
}

export function TRANControlPanel({ tranResults, speed, paused, onSpeedChange, onTogglePause }) {
  const tMin = tranResults[0]?.tiempo ?? 0;
  const tMax = tranResults[tranResults.length - 1]?.tiempo ?? 0;
  const simDuration      = tMax - tMin;
  const playbackDuration = simDuration / speed;

  return (
    <div style={{
      marginTop: 10, padding: '10px 12px',
      background: '#1a1f2e', border: '1px solid #2d3748', borderRadius: 6,
    }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>
          ⏱ Animación transitoria — {tranResults.length} muestras · {(simDuration * 1000).toFixed(2)} ms simulados
        </span>
        <button
          onClick={onTogglePause}
          className="control-btn"
          style={{ fontSize: 11, padding: '3px 10px' }}
        >
          {paused ? '▶ Reanudar' : '⏸ Pausar'}
        </button>
      </div>

      {/* Slider de velocidad */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, color: '#888', minWidth: 80 }}>Velocidad:</span>
        <input
          type="range" min={0} max={100} step={1}
          value={speedToSlider(speed)}
          onChange={(e) => onSpeedChange(sliderToSpeed(Number(e.target.value)))}
          style={{ flex: 1, accentColor: '#5fb3ff' }}
          title="Izquierda = cámara lenta; derecha = tiempo real."
        />
        <span style={{ fontSize: 11, color: '#5fb3ff', fontFamily: 'monospace', minWidth: 100, textAlign: 'right' }}>
          {speedLabel(speed)}
        </span>
      </div>

      <div style={{ marginTop: 4, fontSize: 10, color: '#666', fontFamily: 'monospace', textAlign: 'right' }}>
        Un ciclo completo en pantalla:{' '}
        {playbackDuration >= 1
          ? `${playbackDuration.toFixed(2)} s`
          : `${(playbackDuration * 1000).toFixed(0)} ms`}
      </div>
    </div>
  );
}