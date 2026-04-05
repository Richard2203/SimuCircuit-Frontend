export const Node = ({
  id = 'node1',
  x = 0,
  y = 0,
}) => {
  return (
    <g data-node-id={id}>
      <g transform={`translate(${x}, ${y})`}>

        {/* Punto visible */}
        <circle cx="0" cy="0" r="5"
          fill="#ffffff" stroke="#cccccc" strokeWidth="1"/>

        {/* Área de conexión invisible en las 4 direcciones */}
        <circle cx="0"  cy="0"  r="8" fill="transparent" data-pin="center"/>
        <circle cx="0"  cy="-20" r="4" fill="transparent" data-pin="top"/>
        <circle cx="0"  cy="20"  r="4" fill="transparent" data-pin="bottom"/>
        <circle cx="-20" cy="0"  r="4" fill="transparent" data-pin="left"/>
        <circle cx="20"  cy="0"  r="4" fill="transparent" data-pin="right"/>

      </g>
    </g>
  )
}