/**
 * Graficas de formas de onda. 
 *   1. tranData -> V(t) e I(t) tipo osciloscopio. Para circuitos de switching
 *                 (BJT + LED + AC) donde el resultado es una señal en el tiempo.
 *   2. acData   -> Bode magnitud + fase. Para filtros lineales (RC/RL/RLC).
 *   3. dcData   -> Voltajes nodales y corrientes de rama
 *   4. Estado vacio con instrucciones.
 */
import { useRef, useState } from 'react';
import {
  Chart,
  CategoryScale, LinearScale,
  LineElement, PointElement, LineController,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';

import { useChart }           from '../../hooks/useChart.js';
import { fmtHz, fmtT, fmtV, corrienteEscalar, extraerMetadatos } from '../../utils/Chartconfig.js';
import {
  buildDCVoltageConfig,
  buildDCCurrentConfig,
  buildACMagnitudConfig,
  buildACFaseConfig,
  buildTRANVoltageConfig,
  buildTRANCurrentConfig,
} from '../../utils/Chartconfig.js';

// Registro unico de plugins (idempotente en re-renders gracias a Chart.js)
Chart.register(
  CategoryScale, LinearScale,
  LineElement, PointElement, LineController,
  Title, Tooltip, Legend, Filler,
);

// Componentes de grafica

function DCVoltageChart({ dcData }) {
  const ref   = useRef(null);
  const nodos = Object.entries(dcData.voltages ?? {}).filter(([k]) => k !== '0');

  useChart(ref, buildDCVoltageConfig({ nodos }), [dcData]);
  if (nodos.length === 0) return null;
  return <canvas ref={ref} style={{ width: '100%', height: 200 }} />;
}

function DCCurrentChart({ dcData }) {
  const ref   = useRef(null);
  const ramas = Object.entries(dcData.currents ?? {}).filter(([, v]) => Math.abs(v) > 1e-12);

  useChart(ref, buildDCCurrentConfig({ ramas }), [dcData]);
  if (ramas.length === 0) return null;
  return <canvas ref={ref} style={{ width: '100%', height: 180 }} />;
}

function ACMagnitudChart({ acData }) {
  const ref    = useRef(null);
  const nodos  = Object.keys(acData[0]?.voltages ?? {}).filter((n) => n !== '0');
  const labels = acData.map((p) => fmtHz(p.frecuencia));

  useChart(ref, buildACMagnitudConfig({ acData, nodos, labels }), [acData]);
  return <canvas ref={ref} style={{ width: '100%', height: 220 }} />;
}

function ACFaseChart({ acData }) {
  const ref    = useRef(null);
  const nodos  = Object.keys(acData[0]?.voltages ?? {}).filter((n) => n !== '0');
  const labels = acData.map((p) => fmtHz(p.frecuencia));

  useChart(ref, buildACFaseConfig({ acData, nodos, labels }), [acData]);
  return <canvas ref={ref} style={{ width: '100%', height: 180 }} />;
}

function TRANVoltageChart({ tranData, meta }) {
  const ref   = useRef(null);
  const nodos = Object.keys(tranData[0]?.voltajes ?? {}).filter((n) => n !== '0').sort();

  useChart(ref, buildTRANVoltageConfig({ tranData, nodos, meta }), [tranData]);
  return <canvas ref={ref} style={{ width: '100%', height: 220 }} />;
}

function TRANCurrentChart({ tranData, meta }) {
  const ref  = useRef(null);
  const comps = Object.keys(tranData[0]?.corrientes ?? {})
    .filter((id) => tranData.some((s) => Math.abs(corrienteEscalar(s.corrientes?.[id])) > 1e-9))
    .sort();

  useChart(ref, buildTRANCurrentConfig({ tranData, comps, meta }), [tranData]);
  return <canvas ref={ref} style={{ width: '100%', height: 200 }} />;
}

// Primitivos de UI

function SubTabPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '2px 12px', fontSize: 11, fontFamily: 'monospace',
        borderRadius: 4, border: '1px solid', cursor: 'pointer',
        background:   active ? '#6c63ff' : 'transparent',
        borderColor:  active ? '#6c63ff' : '#323540',
        color:        active ? '#fff'    : '#5a6278',
        transition:   'all .15s',
      }}
    >
      {children}
    </button>
  );
}

function ChartWrap({ children }) {
  return (
    <div style={{ background: '#16181d', borderRadius: 8, padding: '12px 8px' }}>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{
      background: '#1e1e2e', borderRadius: 8, padding: '32px 16px',
      textAlign: 'center', color: '#64748b', fontSize: 13, fontFamily: 'monospace',
    }}>
      No hay datos de simulación aún.<br />
      Presiona <strong>Simular DC</strong>, <strong>∿ Simular AC</strong>{' '}
      o <strong>⏱ Simular Transitorio</strong> para generar las gráficas.
    </div>
  );
}

// Helpers de hint 

function buildHint({ hasTRAN, hasAC, hasDC, tranData, acData }) {
  if (hasTRAN) {
    const tMin = tranData[0]?.tiempo ?? 0;
    const tMax = tranData[tranData.length - 1]?.tiempo ?? 0;
    return `Transitorio — ${tranData.length} muestras · ${fmtT(tMin)} → ${fmtT(tMax)}`;
  }
  if (hasAC) {
    return `AC — ${acData.length} puntos · ${fmtHz(acData[0]?.frecuencia)} → ${fmtHz(acData[acData.length - 1]?.frecuencia)}`;
  }
  if (hasDC) return 'DC — voltajes nodales y corrientes de rama';
  return 'Ejecuta Simular DC, ∿ Simular AC o ⏱ Simular Transitorio para ver las gráficas.';
}

// Componente principal 

/**
 * @param {{
 *   circuit  : object,
 *   isActive : boolean,
 *   acData   : object[] | null,
 *   dcData   : object | null,
 *   tranData : object[] | null,
 *   netlist  : object[],
 * }} props
 */
export function WaveformChart({ circuit, isActive, acData, dcData, tranData, netlist }) {
  const [acSubTab,   setAcSubTab]   = useState('magnitud');
  const [tranSubTab, setTranSubTab] = useState('voltaje');

  const hasTRAN = Array.isArray(tranData) && tranData.length > 0;
  const hasAC   = Array.isArray(acData)   && acData.length > 0;
  const hasDC   = dcData != null && Object.keys(dcData.voltages ?? {}).some((k) => k !== '0');

  const tranMeta = hasTRAN
    ? extraerMetadatos(netlist)
    : { nodos: new Map(), corrientes: new Map() };

  const hint = buildHint({ hasTRAN, hasAC, hasDC, tranData, acData });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p className="chart-hint">{hint}</p>

      {/* Transitorio */}
      {hasTRAN && (
        <>
          <div style={{ display: 'flex', gap: 6 }}>
            <SubTabPill active={tranSubTab === 'voltaje'}   onClick={() => setTranSubTab('voltaje')}>Voltajes V(t)</SubTabPill>
            <SubTabPill active={tranSubTab === 'corriente'} onClick={() => setTranSubTab('corriente')}>Corrientes I(t)</SubTabPill>
          </div>
          <ChartWrap>
            {tranSubTab === 'voltaje'
              ? <TRANVoltageChart tranData={tranData} meta={tranMeta} />
              : <TRANCurrentChart tranData={tranData} meta={tranMeta} />}
          </ChartWrap>
        </>
      )}

      {/* AC */}
      {!hasTRAN && hasAC && (
        <>
          <div style={{ display: 'flex', gap: 6 }}>
            <SubTabPill active={acSubTab === 'magnitud'} onClick={() => setAcSubTab('magnitud')}>Magnitud</SubTabPill>
            <SubTabPill active={acSubTab === 'fase'}     onClick={() => setAcSubTab('fase')}>Fase</SubTabPill>
          </div>
          <ChartWrap>
            {acSubTab === 'magnitud'
              ? <ACMagnitudChart acData={acData} />
              : <ACFaseChart     acData={acData} />}
          </ChartWrap>
        </>
      )}

      {/* DC */}
      {!hasTRAN && !hasAC && hasDC && (
        <>
          <ChartWrap><DCVoltageChart dcData={dcData} /></ChartWrap>
          <ChartWrap><DCCurrentChart dcData={dcData} /></ChartWrap>
        </>
      )}

      {/* Estado vacio */}
      {!hasTRAN && !hasAC && !hasDC && <EmptyState />}
    </div>
  );
}