import { NetlistRenderer } from '../components/Simulator/NetlistRenderer.jsx';
import { Circuit }        from '../domain';

/**
 * CircuitSVG — Renderiza el diagrama visual de un circuito.
 * @param {object}  props
 * @param {Circuit|object} props.circuit  - Circuit (o JSON crudo) a renderizar.
 * @param {boolean} [props.preview]       - Modo compacto (cards/listados).
 * @param {boolean} [props.energized]     - Animacion de energizacion.
 */
export function CircuitSVG({ circuit, preview = false, energized = false }) {
  if (!circuit) return null;

  const c = circuit instanceof Circuit ? circuit : Circuit.fromAny(circuit);
  const h = preview ? 120 : 300;

  if (Array.isArray(c.netlist) && c.netlist.length > 0) {
    // NetlistRenderer espera la forma JSON; pasamos el toJSON() de cada Component.
    const netlistJSON = c.netlist.map((comp) =>
      typeof comp?.toJSON === 'function' ? comp.toJSON() : comp
    );
    return (
      <div style={{ width: '100%', height: preview ? h : '100%', minHeight: h }}>
        <NetlistRenderer
          netlist={netlistJSON}
          preview={preview}
          energized={energized}
        />
      </div>
    );
  }

  // Placeholder cuando aun no hay netlist
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
        {preview ? c.nombre : `"${c.nombre}" — sin diagrama disponible`}
      </text>
    </svg>
  );
}
