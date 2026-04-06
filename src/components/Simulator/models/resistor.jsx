// Resistor.jsx
import { COMPONENT_SCALE } from '../ConfigComponents/circuitConfig.js'

const colorCodeMap = {
  black:  { color: '#000000' }, brown:  { color: '#8B4513' },
  red:    { color: '#FF0000' }, orange: { color: '#FFA500' },
  yellow: { color: '#FFFF00' }, green:  { color: '#008000' },
  blue:   { color: '#0000FF' }, violet: { color: '#EE82EE' },
  grey:   { color: '#808080' }, white:  { color: '#FFFFFF' },
  gold:   { color: '#CFB53B' }, silver: { color: '#C0C0C0' },
}

const getSVGColor = (c) => colorCodeMap[c?.toLowerCase()]?.color || c || 'transparent'

export const Resistor = ({
  nodeA = 'node1',
  nodeB = 'node2',
  band1 = 'red', band2 = 'red', band3 = 'brown', band4 = 'gold',
  bodyColor = '#e1c18e',
  x = 0, y = 0,
  orientation = 'horizontal',
  scale = COMPONENT_SCALE.resistor,
}) => {
  const id = `resistor-${x}-${y}`
  const rotate = orientation === 'vertical' ? 90 : 0
  
  // Longitud de la pata recta desde el centro
  const armLength = 100; 

  // Puntos de conexión: ahora están en el mismo eje Y (o X si es vertical)
  const pinA = orientation === 'horizontal'
    ? { x: x - armLength * scale, y: y }
    : { x: x, y: y - armLength * scale }

  const pinB = orientation === 'horizontal'
    ? { x: x + armLength * scale, y: y }
    : { x: x, y: y + armLength * scale }

  const resistorPath = `
    M -60,0 C -60,-28 -40,-25 -20,-18 L 20,-18
    C 40,-25 60,-28 60,0
    C 60,28 40,25 20,18 L -20,18
    C -40,25 -60,28 -60,0 Z
  `

  return (
    <g data-node-a={nodeA} data-node-b={nodeB}>
      <defs>
        <linearGradient id={`${id}-body-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#fff" stopOpacity="0.5"/>
          <stop offset="35%"  stopColor={bodyColor}/>
          <stop offset="65%"  stopColor={bodyColor}/>
          <stop offset="100%" stopColor="#5d4a2a" stopOpacity="0.4"/>
        </linearGradient>
        <linearGradient id={`${id}-pin-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#666"/>
          <stop offset="50%"  stopColor="#ccc"/>
          <stop offset="100%" stopColor="#666"/>
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d={resistorPath}/>
        </clipPath>
      </defs>

      <g transform={`translate(${x}, ${y}) rotate(${rotate}) scale(${scale})`}>
        {/* Pata Izquierda Recta */}
        <rect x="-100" y="-3" width="45" height="6" rx="2" fill={`url(#${id}-pin-grad)`}/>
        {/* Pata Derecha Recta */}
        <rect x="55" y="-3" width="45" height="6" rx="2" fill={`url(#${id}-pin-grad)`}/>
        
        {/* Cuerpo de la resistencia */}
        <path d={resistorPath} fill={`url(#${id}-body-grad)`}/>
        
        {/* Bandas de color */}
        <g clipPath={`url(#${id}-clip)`}>
          <rect x="-52" y="-30" width="10" height="60" fill={getSVGColor(band1)}/>
          <rect x="-35" y="-30" width="8"  height="60" fill={getSVGColor(band2)}/>
          <rect x="-15" y="-30" width="8"  height="60" fill={getSVGColor(band3)}/>
          <rect x="35"  y="-30" width="10" height="60" fill={getSVGColor(band4)}/>
        </g>
        
        {/* Brillo del cuerpo */}
        <path d="M -45,-12 Q 0,-18 45,-12"
          fill="none" stroke="#fff" strokeWidth="5" opacity="0.25" strokeLinecap="round"/>
        
        {/* Texto descriptivo centrado */}
        <text x="0" y="40" fontSize="12" fill="#777"
          fontFamily="monospace" textAnchor="middle"
          transform={`rotate(${-rotate})`}>{band1}-{band2}-{band3}</text>
      </g>

      {/* Hitboxes invisibles en los extremos exactos de las patas */}
      <circle cx={pinA.x} cy={pinA.y} r="5" fill="transparent" data-pin="a"/>
      <circle cx={pinB.x} cy={pinB.y} r="5" fill="transparent" data-pin="b"/>
    </g>
  )
}