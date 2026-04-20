import CircuitoCuatroMallas from '../CircuitoCuatroMallas';
import CircuitoUnaMalla     from '../Circuito';

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
 *  3. Muestra un placeholder con el nombre.
 *
 * @param {{ circuit: object, preview?: boolean }} props
 */
export function CircuitSVG({ circuit, preview = false }) {
  if (!circuit) return null;

  const h = preview ? '120' : '300';

  // 1. SVG inline de la API
  if (circuit.miniatura_svg) {
    return (
      <div
        style={{
          width: '100%',
          height: h,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a1a1a',
          borderRadius: 8,
          overflow: 'hidden',
        }}
        dangerouslySetInnerHTML={{ __html: circuit.miniatura_svg }}
      />
    );
  }

  // 2. Componente local registrado
  const Component = CIRCUIT_MAP[circuit.id];
  if (Component) {
    return <Component preview={preview} />;
  }

  // 3. Placeholder
  const label = circuit.name ?? circuit.nombre_circuito ?? circuit.nombre ?? '';
  return (
    <svg
      width="100%"
      height={h}
      style={{ background: '#1a1a1a', borderRadius: 8 }}
    >
      <text
        x="50%" y="50%"
        textAnchor="middle" dominantBaseline="middle"
        fill="#444" fontSize="12" fontFamily="monospace"
      >
        {preview ? label : `"${label}" aún no tiene diagrama`}
      </text>
    </svg>
  );
}