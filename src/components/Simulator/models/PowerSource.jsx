import React from 'react';

const PowerSource = ({ x = 0, y = 0, width = 160, redNodeId, blackNodeId }) => {
  const w = parseFloat(width);
  const h = w * 0.6; // Altura de la cara superior
  const sideH = w * 0.35; // Altura del grosor (profundidad)

  // Nodos de conexión (exactamente en las puntas de los cables)
  const redNodePos = { x: x + w + 50, y: y + sideH + 10 };
  const blackNodePos = { x: x + w + 35, y: y + sideH + 45 };

  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        {/* Material Negro Mate con textura de luz */}
        <linearGradient id="topGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3a3d40" />
          <stop offset="100%" stopColor="#1a1c1e" />
        </linearGradient>

        {/* Cara frontal (más oscura para profundidad) */}
        <linearGradient id="frontGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#232629" />
          <stop offset="100%" stopColor="#0a0b0c" />
        </linearGradient>

        {/* Brillo en los bordes para realismo industrial */}
        <linearGradient id="edgeHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>

      {/* 1. SOMBRA PROYECTADA (Sutil y difusa) */}
      <path
        d={`M 10 ${h + 20} L ${w + 10} ${h + sideH + 20} L ${w + 60} ${h + sideH} L 50 ${h - 10} Z`}
        fill="rgba(0,0,0,0.2)"
        filter="blur(8px)"
      />

      {/* 2. CUERPO - CARA FRONTAL IZQUIERDA */}
      <path
        d={`M 0 ${h/2} L 0 ${h/2 + sideH} L ${w/2} ${h + sideH} L ${w/2} ${h} Z`}
        fill="#121416"
      />

      {/* 3. CUERPO - CARA FRONTAL DERECHA */}
      <path
        d={`M ${w/2} ${h} L ${w/2} ${h + sideH} L ${w} ${h/2 + sideH} L ${w} ${h/2} Z`}
        fill="url(#frontGrad)"
      />

      {/* 4. CARA SUPERIOR (El rombo principal) */}
      <path
        d={`M 0 ${h/2} L ${w/2} 0 L ${w} ${h/2} L ${w/2} ${h} Z`}
        fill="url(#topGrad)"
        stroke="#000"
        strokeWidth="0.5"
      />

      {/* 5. BISEL/BORDE DE LUZ (Lo que le da el toque "Apple") */}
      <path
        d={`M 0 ${h/2} L ${w/2} ${h} L ${w} ${h/2}`}
        fill="none"
        stroke="url(#edgeHighlight)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* ETIQUETA - Centrada en perspectiva */}
      <text
        x={w / 2}
        y={h / 2}
        fill="rgba(255,255,255,0.4)"
        fontFamily="sans-serif"
        fontWeight="bold"
        fontSize={w / 12}
        textAnchor="middle"
        transform={`skewY(15) translate(0, -5)`}
        style={{ pointerEvents: 'none', letterSpacing: '1px' }}
      >
        POWER SOURCE
      </text>

      {/* TORNILLOS/ARANDELAS */}
      <circle cx={w * 0.5} cy={h * 0.15} r={w/30} fill="#111" stroke="#444" />
      <circle cx={w * 0.5} cy={h * 0.85} r={w/30} fill="#111" stroke="#444" />

      {/* 6. CABLES CON CURVATURA NATURAL */}
      <g>
        {/* Cable Negro */}
        <path
          d={`M ${w * 0.9} ${h * 0.4} C ${w + 20} ${h * 0.4}, ${w + 40} ${h + 20}, ${blackNodePos.x - x} ${blackNodePos.y - y}`}
          fill="none"
          stroke="#111"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Cable Rojo */}
        <path
          d={`M ${w * 0.85} ${h * 0.35} C ${w + 30} ${h * 0.35}, ${w + 60} ${h}, ${redNodePos.x - x} ${redNodePos.y - y}`}
          fill="none"
          stroke="#d32f2f"
          strokeWidth="6"
          strokeLinecap="round"
        />
        
        {/* Puntas de cobre */}
        <circle cx={blackNodePos.x - x} cy={blackNodePos.y - y} r="3" fill="#cd7f32" />
        <circle cx={redNodePos.x - x} cy={redNodePos.y - y} r="3" fill="#cd7f32" />

        {/* NODOS INVISIBLES DE CONEXIÓN */}
        <circle id={redNodeId} cx={redNodePos.x - x} cy={redNodePos.y - y} r="8" fill="transparent" style={{cursor: 'crosshair'}} />
        <circle id={blackNodeId} cx={blackNodePos.x - x} cy={blackNodePos.y - y} r="8" fill="transparent" style={{cursor: 'crosshair'}} />
      </g>
    </g>
  );
};

export default PowerSource; 