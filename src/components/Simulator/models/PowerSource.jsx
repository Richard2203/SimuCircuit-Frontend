import React from 'react';

export const PowerSource = ({
  nodeA = 'vcc',
  nodeB = 'gnd',
  label = 'Power Source',
  x = 0,
  y = 0,
}) => {
  const id = `power-${x}-${y}`;

  // Puntos de conexión (puntas de los cables expuestas)
  // Ajustados para la nueva geometría más robusta
  const pinA = { x: x + 160, y: y + 95 }; // Cable Rojo (+)
  const pinB = { x: x + 175, y: y + 115 }; // Cable Negro (-)

  return (
    <g data-node-a={nodeA} data-node-b={nodeB} transform={`translate(${x}, ${y})`}>
      <defs>
        {/* Degradado para la cara superior, para dar volumen */}
        <linearGradient id={`${id}-top-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#333" />
          <stop offset="100%" stopColor="#111" />
        </linearGradient>
        
        {/* Degradado para la cara lateral, más oscura */}
        <linearGradient id={`${id}-side-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#222" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>

        {/* Brillo para el texto */}
        <linearGradient id={`${id}-text-grad`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ddd" />
          <stop offset="50%" stopColor="#fff" />
          <stop offset="100%" stopColor="#bbb" />
        </linearGradient>
      </defs>

      {/* 1. PLACA BASE / SOPORTES DE MONTAJE (La base sólida) */}
      <path 
        d="M -10,65 L 140,30 L 175,55 L 25,95 Z" 
        fill="#1a1a1a" 
        stroke="#000" 
        strokeWidth="0.5"
      />
      {/* Agujeros para tornillos */}
      <ellipse cx="10" cy="85" rx="3.5" ry="3.5" fill="#444" stroke="#000" strokeWidth="0.5" />
      <ellipse cx="160" cy="53" rx="3.5" ry="3.5" fill="#444" stroke="#000" strokeWidth="0.5" />

      {/* 2. CUERPO PRINCIPAL (La caja 3D robusta) */}
      {/* Cara Lateral Derecha (Visible en perspectiva) */}
      <path 
        d="M 140,-15 L 140,30 L 20,85 L 20,40 Z" 
        fill={`url(#${id}-side-grad)`} 
        stroke="#000" 
        strokeWidth="0.5"
      />
      {/* Cara Superior (Inclinada y robusta) */}
      <path 
        d="M 0,0 L 120,-45 L 140,-15 L 20,45 Q 10,25 0,0 Z" 
        fill={`url(#${id}-top-grad)`} 
        stroke="#000" 
        strokeWidth="0.5"
      />

      {/* 3. TEXTO CON PERSPECTIVA AJUSTADA */}
      {/* Inclinación sutil para que parezca que está sobre la tapa */}
      <text 
        x="65" 
        y="12" 
        fill={`url(#${id}-text-grad)`}
        fontSize="14" 
        fontWeight="bold" 
        fontFamily="Arial, sans-serif"
        transform="rotate(-26, 65, 12) skewX(8)"
        style={{ userSelect: 'none' }}
      >
        {label}
      </text>

      {/* 4. CABLES MEJORADOS (Salen del lado derecho y se curvan) */}
      {/* Cable Negro (GND) - Abajo */}
      <path 
        d="M 132,18 C 145,18 165,60 175,110" 
        fill="none" 
        stroke="#000" 
        strokeWidth="6" 
        strokeLinecap="round" 
      />
      <circle cx="175" cy="113" r="2.8" fill="#B87333" stroke="#000" strokeWidth="0.5" /> {/* Punta de cobre */}

      {/* Cable Rojo (VCC) - Arriba */}
      <path 
        d="M 137,8 C 148,8 158,55 160,90" 
        fill="none" 
        stroke="#d00" 
        strokeWidth="6" 
        strokeLinecap="round" 
      />
      <circle cx="160" cy="93" r="2.8" fill="#B87333" stroke="#000" strokeWidth="0.5" /> {/* Punta de cobre */}

      {/* 5. INDICADORES (Flechas sutiles en la caja) */}
      <path d="M 115,-35 L 122,-32 L 115,-29 Z" fill="#666" />
      <path d="M 30,60 L 37,63 L 30,66 Z" fill="#666" />

      {/* PUNTOS DE CONEXIÓN INVISIBLES (Para tu sistema de cables) */}
      <circle cx={pinA.x} cy={pinA.y + 20} r="5" fill="transparent" data-pin="a" pointerEvents="all" />
      <circle cx={pinB.x} cy={pinB.y + 20} r="5" fill="transparent" data-pin="b" pointerEvents="all" />
    </g>
  );
};