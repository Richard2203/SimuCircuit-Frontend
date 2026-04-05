// TransistorTO92.jsx
export const TransistorTO92 = ({
  nodeE = 'emisor1', nodeB = 'base1', nodeC = 'colector1',
  x = 0, y = 0,
  orientation = 'vertical',
}) => {
  const id = `transistor-${x}-${y}`
  const rotate = orientation === 'horizontal' ? -90 : 0

  const pins = orientation === 'vertical'
    ? { e: { x: x - 15, y: y + 60 }, b: { x: x, y: y + 60 }, c: { x: x + 15, y: y + 60 } }
    : { e: { x: x - 60, y: y - 15 }, b: { x: x - 60, y: y }, c: { x: x - 60, y: y + 15 } }

  return (
    <g data-node-e={nodeE} data-node-b={nodeB} data-node-c={nodeC}>
      <defs>
        <linearGradient id={`${id}-pin-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#ddd"/>
          <stop offset="50%"  stopColor="#fff"/>
          <stop offset="100%" stopColor="#ddd"/>
        </linearGradient>
        <linearGradient id={`${id}-body-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#222"/>
          <stop offset="50%"  stopColor="#333"/>
          <stop offset="100%" stopColor="#111"/>
        </linearGradient>
      </defs>
      <g transform={`translate(${x}, ${y}) rotate(${rotate})`}>
        <g stroke="#9f9f9f" strokeWidth="6" strokeLinecap="round">
          <line x1="-15" y1="12" x2="-15" y2="60"/>
          <line x1="0"   y1="12" x2="0"   y2="60"/>
          <line x1="15"  y1="12" x2="15"  y2="60"/>
        </g>
        <rect x="-30" y="-15" width="60" height="30" rx="4" fill={`url(#${id}-body-grad)`}/>
        <rect x="-30" y="-15" width="60" height="6"  rx="4" fill="#000" opacity="0.6"/>
        <g stroke={`url(#${id}-pin-grad)`} strokeWidth="6" strokeLinecap="round">
          <line x1="-15" y1="15" x2="-15" y2="60"/>
          <line x1="0"   y1="15" x2="0"   y2="60"/>
          <line x1="15"  y1="15" x2="15"  y2="60"/>
        </g>
        <g opacity="0.4" stroke="#fff" strokeWidth="1">
          <line x1="-10" y1="0"  x2="10" y2="0"/>
          <line x1="-10" y1="10" x2="10" y2="10"/>
        </g>
      </g>
      <circle cx={pins.e.x} cy={pins.e.y} r="5" fill="transparent" data-pin="e"/>
      <circle cx={pins.b.x} cy={pins.b.y} r="5" fill="transparent" data-pin="b"/>
      <circle cx={pins.c.x} cy={pins.c.y} r="5" fill="transparent" data-pin="c"/>
    </g>
  )
}