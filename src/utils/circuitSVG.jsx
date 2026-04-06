import CircuitoCuatroMallas from '../CircuitoCuatroMallas'
import CircuitoUnaMalla     from '../Circuito'

const CIRCUIT_MAP = {
  'cuatro-mallas': CircuitoCuatroMallas,
  'una-malla':     CircuitoUnaMalla,
}

export function CircuitSVG({ circuit, preview = false }) {
  if (!circuit) return null

  const Component = CIRCUIT_MAP[circuit.id]

  if (!Component) {
    return (
      <svg
        width="100%"
        height={preview ? '120' : '300'}
        style={{ background: '#1a1a1a', borderRadius: 8 }}
      >
        <text
          x="50%" y="50%"
          textAnchor="middle" dominantBaseline="middle"
          fill="#444" fontSize="12" fontFamily="monospace"
        >
          {preview ? circuit.name : `"${circuit.name}" aún no tiene diagrama`}
        </text>
      </svg>
    )
  }

  return <Component preview={preview} />
}
