import React from 'react';

export const TransistorTO92 = ({
  nodeE = 'emisor1', // Pata 1 (Izquierda)
  nodeB = 'base1',   // Pata 2 (Centro)
  nodeC = 'colector1',// Pata 3 (Derecha)
  x = 0,
  y = 0,
}) => {
  const id = `transistor-${x}-${y}`;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        {/* Degradado para las patas metálicas frontales */}
        <linearGradient id={`${id}-pin-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ddd" />
          <stop offset="50%" stopColor="#fff" />
          <stop offset="100%" stopColor="#ddd" />
        </linearGradient>

        {/* Degradado para la cara plana negra */}
        <linearGradient id={`${id}-body-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#222" />
          <stop offset="50%" stopColor="#333" />
          <stop offset="100%" stopColor="#111" />
        </linearGradient>
      </defs>

      {/* 1. PATAS (Pins metálicos traseros) */}
      <g stroke="#9f9f9f" strokeWidth="6" strokeLinecap="round">
        {/* Pata 1 Trasera (E) */}
        <line x1="-15" y1="12" x2="-15" y2="60" />
        {/* Pata 2 Trasera (B) */}
        <line x1="0" y1="12" x2="0" y2="60" />
        {/* Pata 3 Trasera (C) */}
        <line x1="15" y1="12" x2="15" y2="60" />
      </g>

      {/* 2. CUERPO DE PLÁSTICO NEGRO (Cara plana) */}
      {/* Parte frontal sombreada */}
      <rect x="-30" y="-15" width="60" height="30" rx="4" fill={`url(#${id}-body-grad)`} />
      <rect x="-30" y="-15" width="60" height="6" rx="4" fill="#000" opacity="0.6" />

      {/* 3. PATAS FRONTALES (Pins metálicos con brillo) */}
      <g stroke={`url(#${id}-pin-grad)`} strokeWidth="6" strokeLinecap="round">
        {/* Pata 1 Frontal (E) */}
        <line x1="-15" y1="15" x2="-15" y2="60" />
        {/* Pata 2 Frontal (B) */}
        <line x1="0" y1="15" x2="0" y2="60" />
        {/* Pata 3 Frontal (C) */}
        <line x1="15" y1="15" x2="15" y2="60" />
      </g>

      {/* 4. TEXTO GRABADO (Simulado con líneas finas) */}
      <g opacity="0.4" stroke="#fff" strokeWidth="1">
        {/* BC16 */}
        <line x1="-10" y1="0" x2="10" y2="0" />
        {/* 2N */}
        <line x1="-15" y1="10" x2="-15" y2="10" />
        {/* 2907 */}
        <line x1="-10" y1="20" x2="10" y2="20" />
      </g>

      {/* Puntos de conexión invisibles para los cables */}
      <circle cx="-15" cy="60" r="5" fill="transparent" data-pin="e" style={{cursor: 'crosshair'}} />
      <circle cx="0" cy="60" r="5" fill="transparent" data-pin="b" style={{cursor: 'crosshair'}} />
      <circle cx="15" cy="60" r="5" fill="transparent" data-pin="c" style={{cursor: 'crosshair'}} />
    </g>
  );
};