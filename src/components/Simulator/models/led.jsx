import React from 'react';

export const LED = ({
  nodeA = 'anodo1',
  nodeB = 'catodo1',
  x = 0,
  y = 0,
}) => {
  const id = `led-rayo-azul-${x}-${y}`;

  // Posiciones absolutas de las puntas de las patas para el motor de cables
  const pinA = { x: x - 15, y: y + 95 }; // Anodo (recto)
  const pinB = { x: x + 18, y: y + 95 }; // Catodo (rayo)

  return (
    <g data-node-a={nodeA} data-node-b={nodeB}>
      
      {/* Grupo visual principal con el transform. 
        Mantenemos la escala y traslación idénticas.
      */}
      <g transform={`translate(${x}, ${y}) scale(1.15)`}>
        
        {/* 1. PATA DERECHA (Cátodo/Rayo) - Renderizada PRIMERO (detrás) */}
        {/* Misma forma de rayo exacta */}
        <path 
          d="M 14.5,45 V 55 Q 14.5,60 18,63.5 L 20,65.5 Q 23.5,69 23.5,74 V 85" 
          fill="none" 
          stroke="#9f9f9f" // Mismo gris de la pata
          strokeWidth="6" 
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 2. PATA IZQUIERDA (Ánodo/Recta) */}
        {/* Misma pata recta */}
        <path 
          d="M -14.5,45 V 85" 
          fill="none" 
          stroke="#9f9f9f" // Mismo gris de la pata
          strokeWidth="6" 
          strokeLinecap="round"
        />

        {/* 3. BASE ISOMÉTRICA (El aro) - CAMBIO DE COLOR A AZUL */}
        {/* Parte frontal y lateral visible de la base (Tono Azul Medio) */}
        <path 
          d="M -30,42 V 45 A 30,6.5 0 0 0 30,45 V 42" 
          fill="#3a6cac" // Equivalente azul al #ac3a3a rojo original
        />
        {/* Parte superior visible de la base (Tono Azul Claro) */}
        <ellipse cx="0" cy="42" rx="30" ry="6.5" fill="#4688ca" // Equivalente azul al #ca4646 rojo original
        />

        {/* 4. CUERPO DEL LED (Plano, sin brillos) - CAMBIO DE COLOR A AZUL */}
        {/* Color oscuro del cuerpo plano (Tono Azul Oscuro) */}
        <path 
          d="M -30,42 V -15 A 30,30 0 0 1 30,-15 V 42 Z" 
          fill="#2b538e" // Equivalente azul al #8e2b2b rojo original
        />
      </g>

      {/* Puntos de conexión invisibles para los cables (basados en pinA/pinB) */}
      <circle cx={pinA.x} cy={pinA.y} r="4" fill="transparent" data-pin="a" style={{cursor: 'crosshair'}}/>
      <circle cx={pinB.x} cy={pinB.y} r="4" fill="transparent" data-pin="b" style={{cursor: 'crosshair'}}/>
    </g>
  );
};