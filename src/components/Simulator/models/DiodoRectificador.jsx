import React from 'react';

export const DiodoRectificador = ({
  nodeA = 'anodo1',
  nodeB = 'catodo1',
  x = 0,
  y = 0,
}) => {
  // Puntos de conexión en los extremos de las patas
  const pinA = { x: x - 85, y: y }; // Lado ánodo (derecha en el dibujo según flujo)
  const pinB = { x: x + 85, y: y }; // Lado cátodo (donde está la banda)

  return (
    <g data-node-a={nodeA} data-node-b={nodeB}>
      <g transform={`translate(${x}, ${y})`}>
        
        {/* 1. PINES (Renderizados al fondo) */}
        <g id="pins">
          {/* Pata Izquierda */}
          <rect x="-85" y="-4" width="30" height="8" rx="4" fill="#9f9f9f" />
          {/* Pata Derecha */}
          <rect x="55" y="-4" width="30" height="8" rx="4" fill="#9f9f9f" />
        </g>

        {/* 2. CUERPO PRINCIPAL (Cápsula) */}
        <rect 
          x="-60" 
          y="-25" 
          width="120" 
          height="50" 
          rx="8" 
          fill="#2a2a2a" 
        />

        {/* 3. BANDA DE CÁTODO (Gris) */}
        {/* Posicionada hacia la izquierda según tu imagen de referencia */}
        <rect 
          x="-40" 
          y="-25" 
          width="15" 
          height="50" 
          fill="#66747d" 
        />
        
      </g>

      {/* Puntos de conexión invisibles para interacción */}
      <circle cx={pinA.x} cy={pinA.y} r="5" fill="transparent" data-pin="a" style={{cursor: 'crosshair'}}/>
      <circle cx={pinB.x} cy={pinB.y} r="5" fill="transparent" data-pin="b" style={{cursor: 'crosshair'}}/>
    </g>
  );
};