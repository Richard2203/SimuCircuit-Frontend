// ZenerDiode.jsx
export const ZenerDiode = ({
  nodeA = 'anode1', nodeB = 'cathode1',
  x = 0, y = 0,
  bodyColor = '#FF6622',
  orientation = 'horizontal',
}) => {
  const id = `zener-${x}-${y}`
  const rotate = orientation === 'vertical' ? 90 : 0

  const pinA = orientation === 'horizontal'
    ? { x: x - 80, y: y }
    : { x: x, y: y - 80 }

  const pinB = orientation === 'horizontal'
    ? { x: x + 80, y: y }
    : { x: x, y: y + 80 }

  return (
    <g data-node-a={nodeA} data-node-b={nodeB}>
      <defs>
        <linearGradient id={`${id}-core-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#ffaa88"/>
          <stop offset="50%"  stopColor={bodyColor}/>
          <stop offset="100%" stopColor="#cc4400"/>
        </linearGradient>
        <linearGradient id={`${id}-glass-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#fff" stopOpacity="0.6"/>
          <stop offset="40%"  stopColor="#fff" stopOpacity="0.1"/>
          <stop offset="100%" stopColor="#000" stopOpacity="0.2"/>
        </linearGradient>
        <linearGradient id={`${id}-pin-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#888"/>
          <stop offset="50%"  stopColor="#ddd"/>
          <stop offset="100%" stopColor="#888"/>
        </linearGradient>
      </defs>
      <g transform={`translate(${x}, ${y}) rotate(${rotate})`}>
        <rect x="-80" y="-3" width="40" height="6" rx="3" fill={`url(#${id}-pin-grad)`}/>
        <rect x="40"  y="-3" width="40" height="6" rx="3" fill={`url(#${id}-pin-grad)`}/>
        <rect x="-45" y="-22" width="90" height="44" rx="12"
          fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
        <rect x="-38" y="-18" width="76" height="36" rx="8" fill={`url(#${id}-core-grad)`}/>
        <rect x="-28" y="-18" width="12" height="36" fill="#000"/>
        <rect x="-45" y="-22" width="90" height="44" rx="12" fill={`url(#${id}-glass-grad)`}/>
      </g>
      <circle cx={pinA.x} cy={pinA.y} r="5" fill="transparent" data-pin="a"/>
      <circle cx={pinB.x} cy={pinB.y} r="5" fill="transparent" data-pin="b"/>
    </g>
  )
}