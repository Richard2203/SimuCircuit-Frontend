// DiodoRectificador.jsx
import { COMPONENT_SCALE } from '../ConfigComponents/circuitConfig.js'

export const DiodoRectificador = ({
  nodeA = 'anodo1',
  nodeB = 'catodo1',
  x = 0,
  y = 0,
  orientation = 'horizontal',
  scale = COMPONENT_SCALE.diodoRectificador,
}) => {
  const rotate = orientation === 'vertical' ? 90 : 0

  const pinA = orientation === 'horizontal'
    ? { x: x - 85 * scale, y: y }
    : { x: x, y: y - 85 * scale }

  const pinB = orientation === 'horizontal'
    ? { x: x + 85 * scale, y: y }
    : { x: x, y: y + 85 * scale }

  return (
    <g data-node-a={nodeA} data-node-b={nodeB}>
      <g transform={`translate(${x}, ${y}) rotate(${rotate}) scale(${scale})`}>
        <rect x="-85" y="-4" width="30"  height="8" rx="4" fill="#9f9f9f"/>
        <rect x="55"  y="-4" width="30"  height="8" rx="4" fill="#9f9f9f"/>
        <rect x="-60" y="-25" width="120" height="50" rx="8" fill="#2a2a2a"/>
        <rect x="-40" y="-25" width="15"  height="50" fill="#66747d"/>
      </g>
      <circle cx={pinA.x} cy={pinA.y} r="5" fill="transparent" data-pin="a"/>
      <circle cx={pinB.x} cy={pinB.y} r="5" fill="transparent" data-pin="b"/>
    </g>
  )
}