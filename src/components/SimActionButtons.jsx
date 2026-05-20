/**
 * Botones de simulación (DC / AC / Transitorio).
 * Cada boton encapsula su propio estado de configuracion
 */
import { useState } from 'react';
import { INPUT_STYLE } from './primitives.jsx';

const SELECT_STYLE = { ...INPUT_STYLE, fontSize: 11 };

// DC

export function DCButton({ isActive, isRunning, onSimulate }) {
  return (
    <button
      className="control-btn primary"
      onClick={onSimulate}
      disabled={!isActive || isRunning}
      title="Análisis DC: calcula el punto de operación en régimen estable. Capacitores → abierto, bobinas → cortocircuito."
    >
      {isRunning ? '⏳ Simulando…' : '⚡ Simular DC'}
    </button>
  );
}

// AC

const AC_DEFAULTS = { barrido: 'log', fInicial: '10', fFinal: '100000', puntos: '50' };

export function ACButton({ isActive, isRunning, onSimulate }) {
  const [cfg, setCfg] = useState(AC_DEFAULTS);
  const set = (key) => (e) => setCfg((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSimulate = () =>
    onSimulate({
      configuracion_ac: {
        f_inicial: Number(cfg.fInicial),
        f_final:   Number(cfg.fFinal),
        puntos:    Number(cfg.puntos),
        barrido:   cfg.barrido,
      },
    });

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      <select style={SELECT_STYLE} value={cfg.barrido} onChange={set('barrido')}>
        <option value="log">Logarítmico</option>
        <option value="lineal">Lineal</option>
        <option value="decada">Década</option>
        <option value="octava">Octava</option>
      </select>
      <input style={{ ...SELECT_STYLE, width: 70 }} value={cfg.fInicial} onChange={set('fInicial')} placeholder="f ini (Hz)" />
      <input style={{ ...SELECT_STYLE, width: 70 }} value={cfg.fFinal}   onChange={set('fFinal')}   placeholder="f fin (Hz)" />
      <input style={{ ...SELECT_STYLE, width: 45 }} value={cfg.puntos}   onChange={set('puntos')}   placeholder="pts" />
      <button
        className="control-btn"
        disabled={!isActive || isRunning}
        title="Barrido en frecuencia. Solo válido para circuitos lineales (RC/RL/RLC)."
        onClick={handleSimulate}
      >
        {isRunning ? '⏳ Simulando…' : '∿ Simular AC'}
      </button>
    </div>
  );
}

// Transitorio
// Defaults para 60 Hz: t_stop=50 ms (aprox 3 ciclos), delta_t=100 us (arpox 167 muestras/ciclo).

const TRAN_DEFAULTS = { tStopMs: '50', deltaTUs: '100' };

// Rango permitido (en las unidades del input: ms y us respectivamente).
// Cubre desde 1 ns (1e-6 ms) hasta aprox 16 min (1e6 ms).
const TRAN_RANGE_MIN = 1e-6;
const TRAN_RANGE_MAX = 1e6;

function validateTranField(value, label) {
  if (value.trim() === '')        return `${label}: requerido`;
  const n = Number(value);
  if (!Number.isFinite(n))        return `${label}: número inválido`;
  if (n <= 0)                     return `${label}: debe ser positivo`;
  if (n < TRAN_RANGE_MIN)         return `${label}: por debajo del mínimo (${TRAN_RANGE_MIN})`;
  if (n > TRAN_RANGE_MAX)         return `${label}: por encima del máximo (${TRAN_RANGE_MAX.toExponential(0)})`;
  return null;
}

function validateTranCross(tStopMs, deltaTUs) {
  const tStopSec  = Number(tStopMs)  / 1_000;
  const deltaTSec = Number(deltaTUs) / 1_000_000;
  if (deltaTSec >= tStopSec)              return 'Δt debe ser menor que t_stop';
  if (tStopSec / deltaTSec > 200_000)     return `Demasiados pasos (>${(tStopSec / deltaTSec).toExponential(0)}). Aumenta Δt o reduce t_stop`;
  return null;
}

export function TRANButton({ isActive, isRunning, onSimulate }) {
  const [cfg, setCfg] = useState(TRAN_DEFAULTS);
  const set = (key) => (e) => setCfg((prev) => ({ ...prev, [key]: e.target.value }));

  const errTStop  = validateTranField(cfg.tStopMs,  't_stop');
  const errDeltaT = validateTranField(cfg.deltaTUs, 'Δt');
  const errCross  = !errTStop && !errDeltaT ? validateTranCross(cfg.tStopMs, cfg.deltaTUs) : null;
  const errorMsg  = errTStop ?? errDeltaT ?? errCross;
  const hasError  = errorMsg !== null;

  const handleSimulate = () =>
    onSimulate({
      configuracion_transitorio: {
        t_stop:  Number(cfg.tStopMs)  / 1_000,
        delta_t: Number(cfg.deltaTUs) / 1_000_000,
      },
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          style={{ ...SELECT_STYLE, width: 60, borderColor: errTStop ? '#c0392b' : '#444' }}
          value={cfg.tStopMs}
          onChange={set('tStopMs')}
          placeholder="t_stop"
          title={`Tiempo total de simulación en ms. Rango: ${TRAN_RANGE_MIN} a ${TRAN_RANGE_MAX.toExponential(0)} ms.`}
        />
        <span style={{ fontSize: 11, color: '#888', fontFamily: 'monospace' }}>ms</span>
        <input
          style={{ ...SELECT_STYLE, width: 60, borderColor: errDeltaT ? '#c0392b' : '#444' }}
          value={cfg.deltaTUs}
          onChange={set('deltaTUs')}
          placeholder="Δt"
          title={`Paso de integración en µs. Rango: ${TRAN_RANGE_MIN} a ${TRAN_RANGE_MAX.toExponential(0)} µs.`}
        />
        <span style={{ fontSize: 11, color: '#888', fontFamily: 'monospace' }}>µs</span>
        <button
          className="control-btn"
          disabled={!isActive || isRunning || hasError}
          title={hasError
            ? errorMsg
            : 'Análisis en el dominio del tiempo. Correcto para circuitos con BJT, diodos, LEDs (gran señal).'}
          onClick={handleSimulate}
        >
          {isRunning ? '⏳ Simulando…' : '⏱ Simular Transitorio'}
        </button>
      </div>

      {hasError && (
        <p style={{ fontSize: 11, color: '#e74c3c', margin: '2px 0 0', fontFamily: 'monospace' }}>
          ⚠ {errorMsg}
        </p>
      )}
    </div>
  );
}