export const Capacitor = ({
  nodeA = 'node1',
  nodeB = 'node2',
  value = '100µF',
  voltage = '25V',
  x = 0,
  y = 0,
}) => {
  const id = `cap-${x}-${y}`

  // Posiciones absolutas de los pines para conectar cables
  const pinA = { x: x - 24, y: y + 108 }
  const pinB = { x: x + 23, y: y + 108 }

  return (
    <g data-node-a={nodeA} data-node-b={nodeB}>
      <defs>
        <linearGradient id={`${id}-body`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#111"/>
          <stop offset="15%"  stopColor="#333"/>
          <stop offset="45%"  stopColor="#3a3a3a"/>
          <stop offset="78%"  stopColor="#222"/>
          <stop offset="100%" stopColor="#0d0d0d"/>
        </linearGradient>
        <linearGradient id={`${id}-stripe`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#505050"/>
          <stop offset="50%"  stopColor="#888898"/>
          <stop offset="100%" stopColor="#505050"/>
        </linearGradient>
        <radialGradient id={`${id}-top`} cx="36%" cy="32%" r="60%">
          <stop offset="0%"   stopColor="#d8d8d8"/>
          <stop offset="40%"  stopColor="#a0a0a0"/>
          <stop offset="100%" stopColor="#505050"/>
        </radialGradient>
        <radialGradient id={`${id}-shine`} cx="30%" cy="25%" r="40%">
          <stop offset="0%"   stopColor="#fff" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#fff" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id={`${id}-rim`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#0a0a0a"/>
          <stop offset="40%"  stopColor="#1e1e1e"/>
          <stop offset="100%" stopColor="#080808"/>
        </linearGradient>
        <linearGradient id={`${id}-pin`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#3a3a3a"/>
          <stop offset="40%"  stopColor="#b0b0b0"/>
          <stop offset="100%" stopColor="#3a3a3a"/>
        </linearGradient>
        <clipPath id={`${id}-cap-shape`}>
          <path d="M -58,-85 L 58,-85 L 58,53 Q 58,90 0,90 Q -58,90 -58,53 Z"/>
        </clipPath>
        <clipPath id={`${id}-top-clip`}>
          <ellipse cx="0" cy="-85" rx="58" ry="16"/>
        </clipPath>
      </defs>

      <g transform={`translate(${x}, ${y})`}>

        {/* PINES */}
        <rect x="-28" y="83"  width="9" height="48" rx="4" fill={`url(#${id}-pin)`}/>
        <rect x="19"  y="83"  width="9" height="48" rx="4" fill={`url(#${id}-pin)`}/>
        <rect x="-25" y="83"  width="2.5" height="48" rx="1" fill="#fff" opacity="0.15"/>
        <rect x="22"  y="83"  width="2.5" height="48" rx="1" fill="#fff" opacity="0.15"/>

        {/* CUERPO */}
        <path d="M -58,-85 L 58,-85 L 58,53 Q 58,90 0,90 Q -58,90 -58,53 Z"
          fill={`url(#${id}-body)`} stroke="#0a0a0a" strokeWidth="1"/>

        {/* FRANJA gris */}
        <rect x="-40" y="-85" width="38" height="175"
          fill={`url(#${id}-stripe)`} clipPath={`url(#${id}-cap-shape)`}/>

        {/* Línea separadora franja */}
        <line x1="-2" y1="-83" x2="-2" y2="67"
          stroke="#222" strokeWidth="1.2" opacity="0.9"/>

        {/* Bordes laterales oscuros */}
        <rect x="-58" y="-85" width="9" height="175"
          fill="#000" opacity="0.55" clipPath={`url(#${id}-cap-shape)`}/>
        <rect x="49"  y="-85" width="9" height="175"
          fill="#000" opacity="0.5"  clipPath={`url(#${id}-cap-shape)`}/>

        {/* ARO inferior — solo arco frontal */}
        <path d="M -58,53 A 58,10 0 0 0 58,53"
          fill="none" stroke="#0d0d0d" strokeWidth="5" strokeLinecap="round"/>

        {/* ARO superior */}
        <ellipse cx="0" cy="-81" rx="60" ry="16"
          fill={`url(#${id}-rim)`} stroke="#050505" strokeWidth="0.5"/>

        {/* TAPA superior */}
        <ellipse cx="0" cy="-87" rx="58" ry="18"
          fill={`url(#${id}-top)`} stroke="#2a2a2a" strokeWidth="0.8"/>
        <ellipse cx="0" cy="-87" rx="58" ry="18"
          fill={`url(#${id}-shine)`}/>

        {/* CRUZ en la tapa */}
        <g clipPath={`url(#${id}-top-clip)`}>
          <line x1="-58" y1="-87" x2="58" y2="-87"
            stroke="#444" strokeWidth="3.5" strokeLinecap="round"/>
          <line x1="0" y1="-105" x2="0" y2="-69"
            stroke="#444" strokeWidth="3.5" strokeLinecap="round"/>
        </g>

        {/* Etiquetas */}
        <text x="66" y="-10" fontSize="11" fill="#777" fontFamily="monospace">{value}</text>
        <text x="66" y="6"   fontSize="10" fill="#555" fontFamily="monospace">{voltage}</text>

      </g>

      {/* Puntos de conexión invisibles — para el sistema de cables */}
      <circle cx={pinA.x} cy={pinA.y} r="3" fill="transparent" data-pin="a"/>
      <circle cx={pinB.x} cy={pinB.y} r="3" fill="transparent" data-pin="b"/>
    </g>
  )
}