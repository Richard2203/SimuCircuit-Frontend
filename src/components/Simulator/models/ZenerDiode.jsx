import React from 'react';

export const ZenerDiode = ({
  nodeA = 'anode1',
  nodeB = 'cathode1',
  x = 0,
  y = 0,
  bodyColor = '#FF6622', // Naranja intenso característico
}) => {
  const id = `zener-${x}-${y}`;

  return (
    <g data-node-a={nodeA} data-node-b={nodeB} transform={`translate(${x}, ${y})`}>
      <defs>
        {/* Degradado para el núcleo de silicio naranja */}
        <linearGradient id={`${id}-core-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffaa88" />
          <stop offset="50%" stopColor={bodyColor} />
          <stop offset="100%" stopColor="#cc4400" />
        </linearGradient>

        {/* Degradado para el efecto de cristal transparente */}
        <linearGradient id={`${id}-glass-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
        </linearGradient>

        {/* Degradado para las patas metálicas */}
        <linearGradient id={`${id}-pin-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#888" />
          <stop offset="50%" stopColor="#ddd" />
          <stop offset="100%" stopColor="#888" />
        </linearGradient>
      </defs>

      {/* 1. PATAS (Pins) */}
      <rect x="-80" y="-3" width="40" height="6" rx="3" fill={`url(#${id}-pin-grad)`} />
      <rect x="40" y="-3" width="40" height="6" rx="3" fill={`url(#${id}-pin-grad)`} />

      {/* 2. CAPSULADO DE CRISTAL (Borde Exterior Transparente) */}
      <rect 
        x="-45" y="-22" 
        width="90" height="44" 
        rx="12" 
        fill="rgba(255, 255, 255, 0.2)" 
        stroke="rgba(255, 255, 255, 0.5)" 
        strokeWidth="1"
      />

      {/* 3. NÚCLEO NARANJA */}
      <rect 
        x="-38" y="-18" 
        width="76" height="36" 
        rx="8" 
        fill={`url(#${id}-core-grad)`} 
      />

      {/* 4. BANDA NEGRA (Cátodo) */}
      <rect 
        x="-28" y="-18" 
        width="12" height="36" 
        fill="#000000" 
      />

      {/* 5. REFLEJO DE CRISTAL (Brillo superior) */}
      <rect 
        x="-45" y="-22" 
        width="90" height="44" 
        rx="12" 
        fill={`url(#${id}-glass-grad)`} 
      />

      {/* Puntos de conexión para lógica de cables */}
      <circle cx="-80" cy="0" r="5" fill="transparent" data-pin="a" style={{ cursor: 'crosshair' }} />
      <circle cx="80" cy="0" r="5" fill="transparent" data-pin="b" style={{ cursor: 'crosshair' }} />
    </g>
  );
};