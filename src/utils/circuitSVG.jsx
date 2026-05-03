import { NetlistRenderer } from '../components/Simulator/NetlistRenderer.jsx';

/**
 * CircuitSVG — Renderiza el diagrama visual de un circuito.
 *
 * Estrategia:
 *   • Si el circuito tiene netlist (array con componentes) → lo dibuja
 *     dinamicamente con NetlistRenderer 
 *   • Si no tiene netlist → muestra un placeholder con el nombre del circuito.
 *
 * @param {object}  props
 * @param {object}  props.circuit     Circuito (debe tener netlist).
 * @param {boolean} [props.preview]   Modo compacto (cards/listados).
 * @param {boolean} [props.energized] muestra de animacion si hay energizacion
 */
export function CircuitSVG({ circuit, preview = false, energized = false }) {
  if (!circuit) return null;

  const h = preview ? 120 : 300;

  // Render dinamico desde netlist
  if (Array.isArray(circuit.netlist) && circuit.netlist.length > 0) {
    return (
      <div style={{ width: '100%', height: preview ? h : '100%', minHeight: h }}>
        <NetlistRenderer
          netlist={circuit.netlist}
          preview={preview}
          energized={energized}
        />
      </div>
    );
  }

  // Placeholder cuando aun no hay netlist
  const label = circuit.name ?? circuit.nombre_circuito ?? circuit.nombre ?? '';
  return (
    <svg
      width="100%"
      height={h}
      style={{ background: '#16181d', borderRadius: 8 }}
    >
      <text
        x="50%" y="50%"
        textAnchor="middle" dominantBaseline="middle"
        fill="#2d3748" fontSize="12" fontFamily="monospace"
      >
        {preview ? label : `"${label}" — sin diagrama disponible`}
      </text>
    </svg>
  );
}