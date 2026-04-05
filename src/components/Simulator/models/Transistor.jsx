import React from 'react';

export const Transistor = ({
  nodeIn = 'in',
  nodeAdj = 'adj',
  nodeOut = 'out',
  x = 0,
  y = 0,
}) => {
  const id = `reg-${x}-${y}`;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* 1. DISIPADOR DE METAL (La parte de atrás) */}
      <path 
        d="M -25,-10 L 25,-10 L 25,-45 L 15,-55 L -15,-55 L -25,-45 Z" 
        fill="#b3b3b3" 
      />
      {/* Orificio del disipador */}
      <circle cx="0" cy="-35" r="7" fill="#666" />
      <circle cx="0" cy="-35" r="5" fill="#f4f4f4" opacity="0.3" />

      {/* 2. PATAS (Pins metálicos) */}
      <g stroke="#9f9f9f" strokeWidth="6" strokeLinecap="round">
        {/* Pata 1 (Adj) */}
        <line x1="-15" y1="15" x2="-15" y2="60" />
        {/* Pata 2 (Out) */}
        <line x1="0" y1="15" x2="0" y2="60" />
        {/* Pata 3 (In) */}
        <line x1="15" y1="15" x2="15" y2="60" />
      </g>

      {/* 3. CUERPO DE PLÁSTICO NEGRO */}
      {/* Parte frontal sombreada para dar volumen */}
      <rect x="-30" y="-15" width="60" height="40" rx="2" fill="#1a1a1a" />
      <rect x="-30" y="-15" width="60" height="8" rx="2" fill="#333" />

      {/* 4. TEXTO GRABADO (Simulado con líneas) */}
      <g opacity="0.4" stroke="#fff" strokeWidth="1">
        <line x1="-10" y1="0" x2="10" y2="0" />
        <line x1="-15" y1="8" x2="15" y2="8" />
      </g>

      {/* Puntos de conexión invisibles para los cables */}
      <circle cx="-15" cy="60" r="5" fill="transparent" data-pin="adj" style={{cursor: 'crosshair'}} />
      <circle cx="0" cy="60" r="5" fill="transparent" data-pin="out" style={{cursor: 'crosshair'}} />
      <circle cx="15" cy="60" r="5" fill="transparent" data-pin="in" style={{cursor: 'crosshair'}} />
    </g>
  );
};