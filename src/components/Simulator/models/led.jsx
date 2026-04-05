// LED.jsx
import { COMPONENT_SCALE } from '../ConfigComponents/circuitConfig.js'

export const LED = ({
  nodeA = 'anodo1',
  nodeB = 'catodo1',
  x = 0,
  y = 0,
  orientation = 'vertical',
  scale = COMPONENT_SCALE.led,
}) => {
  const rotate = orientation === 'horizontal' ? -90 : 0

  const pinA = orientation === 'vertical'
    ? { x: x - 15 * scale, y: y + 95 * scale }
    : { x: x - 95 * scale, y: y - 15 * scale }

  const pinB = orientation === 'vertical'
    ? { x: x + 18 * scale, y: y + 95 * scale }
    : { x: x + 95 * scale, y: y + 18 * scale }

  return (
    <g data-node-a={nodeA} data-node-b={nodeB}>
      <g transform={`translate(${x}, ${y}) rotate(${rotate}) scale(${scale})`}>
        <path d="M 14.5,45 V 55 Q 14.5,60 18,63.5 L 20,65.5 Q 23.5,69 23.5,74 V 85"
          fill="none" stroke="#9f9f9f" strokeWidth="6"
          strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M -14.5,45 V 85"
          fill="none" stroke="#9f9f9f" strokeWidth="6" strokeLinecap="round"/>
        <path d="M -30,42 V 45 A 30,6.5 0 0 0 30,45 V 42" fill="#3a6cac"/>
        <ellipse cx="0" cy="42" rx="30" ry="6.5" fill="#4688ca"/>
        <path d="M -30,42 V -15 A 30,30 0 0 1 30,-15 V 42 Z" fill="#2b538e"/>
        <text x="35" y="0" fontSize="11" fill="#777" fontFamily="monospace"
          transform={`rotate(${-rotate})`}>LED</text>
      </g>
      <circle cx={pinA.x} cy={pinA.y} r="4" fill="transparent" data-pin="a"/>
      <circle cx={pinB.x} cy={pinB.y} r="4" fill="transparent" data-pin="b"/>
    </g>
  )
}