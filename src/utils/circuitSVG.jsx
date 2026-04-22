import CircuitoCuatroMallas from '../CircuitoCuatroMallas';
import CircuitoUnaMalla     from '../Circuito';
import { NetlistRenderer }  from '../components/Simulator/NetlistRenderer.jsx';

const CIRCUIT_MAP = {
  'cuatro-mallas': CircuitoCuatroMallas,
  'una-malla':     CircuitoUnaMalla,
};

/**
 * CircuitSVG — Renderiza el diagrama visual de un circuito.
 *
 * Estrategia (en orden de prioridad):
 *  1. Si el circuito tiene `miniatura_svg` (string SVG de la API), lo inyecta inline.
 *  2. Si hay un componente React registrado en CIRCUIT_MAP para ese id, lo usa.
 *  3. Si tiene `netlist` (array), renderiza con NetlistRenderer.
 *  4. Muestra un placeholder con el nombre.
 *
 * @param {{ circuit: object, preview?: boolean }} props
 */
export function CircuitSVG({ circuit, preview = false }) {
  if (!circuit) return null;

  const h = preview ? 120 : 300;

  // 1. SVG inline de la API (miniatura_svg guardada en BD)
  if (circuit.miniatura_svg && circuit.miniatura_svg !== '<svg>...</svg>') {
    return (
      <div
        style={{
          width: '100%',
          height: h,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#16181d',
          borderRadius: 8,
          overflow: 'hidden',
        }}
        dangerouslySetInnerHTML={{ __html: circuit.miniatura_svg }}
      />
    );
  }

  // 2. Componente React local registrado (circuitos preconstruidos)
  const Component = CIRCUIT_MAP[circuit.id];
  if (Component) {
    return <Component preview={preview} />;
  }

  // 3. Netlist de la API → renderizado dinámico con NetlistRenderer
  if (Array.isArray(circuit.netlist) && circuit.netlist.length > 0) {
    return (
      <div style={{ width: '100%', height: preview ? h : '100%', minHeight: h }}>
        <NetlistRenderer netlist={circuit.netlist} preview={preview} />
      </div>
    );
  }

  // 4. Placeholder
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