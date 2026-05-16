/**
 * Componente principal del canvas SVG del simulador.
 * Orquesta las capas de renderizado.
 *
 *   WireLayer: cables ortogonales entre pines
 *   GndSymbol: simbolo de tierra en el pin GND mas bajo
 *   renderComponent: cuerpo visual de cada componente
 *   CompLabels: ID y etiquetas de pines (B/E/C, Vin/GND/Vout…)
 *   NodeLabels: numeros de nodo para analisis nodal
 */

import { calcViewBox, getPins, resolvePin, getNodoNum } from './renderer/geometry.js';
import { CANVAS_SCALE } from './renderer/constants.js';
import { WireLayer }          from './renderer/wireRouting.jsx';
import { renderComponent, GndSymbol } from './renderer/componentRenderer.jsx';
import { CompLabels, NodeLabels }     from './renderer/labels.jsx';

/* Helpers locales */

/** Encuentra el pin GND mas bajo de toda la netlist para anclar el simbolo de tierra. */
function findLowestGndPin(netlist) {
  const gndPins = [];
  netlist.forEach((comp) => {
    const pins = getPins(comp);
    Object.entries(comp.nodes ?? {}).forEach(([pinKey, pinData]) => {
      if (getNodoNum(pinData) === '0') {
        const p = resolvePin(pins, pinKey);
        if (p) gndPins.push(p);
      }
    });
  });
  return gndPins.length > 0
    ? gndPins.reduce((acc, p) => (p.y > acc.y ? p : acc), gndPins[0])
    : null;
}

/* Componente */

/**
 * @param {{
 *   netlist:  object[],
 *   preview:  boolean,   — true en miniaturas (admin), oculta labels y GND
 *   energized: boolean,  — true cuando la simulación está activa
 * }} props
 */
export function NetlistRenderer({ netlist, preview = false, energized = false, dcResults = null }) {
  if (!netlist?.length) {
    return (
      <svg width="100%" height={preview ? 120 : 300}
        style={{ background: '#16181d', borderRadius: 8 }}>
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
          fill="#333" fontSize={12} fontFamily="monospace">
          Sin netlist disponible
        </text>
      </svg>
    );
  }

  const viewBox   = calcViewBox(netlist);
  const gndAnchor = preview ? null : findLowestGndPin(netlist);

  return (
    <svg width="100%" height={preview ? 120 : '100%'} viewBox={viewBox}
      style={{ background: '#16181d', borderRadius: 8, minHeight: preview ? 120 : 280 }}>

      {/* Fondo de cuadricula */}
      <defs>
        <pattern id="grid" width={CANVAS_SCALE * 50} height={CANVAS_SCALE * 50}
          patternUnits="userSpaceOnUse">
          <path d={`M ${CANVAS_SCALE * 50} 0 L 0 0 0 ${CANVAS_SCALE * 50}`}
            fill="none" stroke="#1e2028" strokeWidth={0.5} />
        </pattern>
      </defs>
      <rect x="-10000" y="-10000" width="20000" height="20000" fill="url(#grid)" />

      {/* Capa 1: cables */}
      <WireLayer netlist={netlist} />

      {/* Capa 2: simbolo GND */}
      {gndAnchor && <GndSymbol x={gndAnchor.x} y={gndAnchor.y + 18} />}

      {/* Capa 3: cuerpos de componentes */}
      {netlist.map((comp) => renderComponent(comp, energized, dcResults))}

      {/* Capas 4 y 5: etiquetas */}
      {!preview && <CompLabels netlist={netlist} />}
      {!preview && <NodeLabels netlist={netlist} />}

    </svg>
  );
}
