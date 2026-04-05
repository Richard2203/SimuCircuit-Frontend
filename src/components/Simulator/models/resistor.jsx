import React from 'react';

const colorCodeMap = {
  black:  { val: '0', color: '#000000' },
  brown:  { val: '1', color: '#8B4513' },
  red:    { val: '2', color: '#FF0000' },
  orange: { val: '3', color: '#FFA500' },
  yellow: { val: '4', color: '#FFFF00' },
  green:  { val: '5', color: '#008000' },
  blue:   { val: '6', color: '#0000FF' },
  violet: { val: '7', color: '#EE82EE' },
  grey:   { val: '8', color: '#808080' },
  white:  { val: '9', color: '#FFFFFF' },
  gold:   { val: '5%', color: '#CFB53B' },
  silver: { val: '10%',color: '#C0C0C0' },
};

const getSVGColor = (inputColor) => {
  if (!inputColor) return 'transparent';
  return colorCodeMap[inputColor.toLowerCase()]?.color || inputColor;
};

export const Resistor = ({
  nodeA = 'node1',
  nodeB = 'node2',
  band1 = 'red',
  band2 = 'red',
  band3 = 'brown',
  band4 = 'gold',
  // Color más cálido y saturado (café claro/tan)
  bodyColor = '#e1c18e', 
  x = 0,
  y = 0,
}) => {
  const id = `resistor-${x}-${y}`;
  const pinDrop = 50;

  const resistorPath = `
    M -60,0 
    C -60,-28 -40,-25 -20,-18
    L 20,-18
    C 40,-25 60,-28 60,0
    C 60,28 40,25 20,18
    L -20,18
    C -40,25 -60,28 -60,0
    Z
  `;

  return (
    <g data-node-a={nodeA} data-node-b={nodeB} transform={`translate(${x}, ${y})`}>
      <defs>
        {/* Degradado con el nuevo tono café claro */}
        <linearGradient id={`${id}-body-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.5"/>
          <stop offset="35%" stopColor={bodyColor}/>
          <stop offset="65%" stopColor={bodyColor}/>
          <stop offset="100%" stopColor="#5d4a2a" stopOpacity="0.4"/>
        </linearGradient>

        <linearGradient id={`${id}-pin-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#666"/>
          <stop offset="50%" stopColor="#ccc"/>
          <stop offset="100%" stopColor="#666"/>
        </linearGradient>

        <clipPath id={`${id}-clip`}>
          <path d={resistorPath} />
        </clipPath>
      </defs>

      {/* PINES EN L */}
      <g>
        <rect x="-78" y="-3" width="20" height="6" rx="2" fill={`url(#${id}-pin-grad)`}/>
        <rect x="58" y="-3" width="20" height="6" rx="2" fill={`url(#${id}-pin-grad)`}/>
        <circle cx="-75" cy="3" r="3" fill="#888" />
        <circle cx="75" cy="3" r="3" fill="#888" />
        <rect x="-78" y="0" width="6" height={pinDrop} rx="3" fill={`url(#${id}-pin-grad)`}/>
        <rect x="72" y="0" width="6" height={pinDrop} rx="3" fill={`url(#${id}-pin-grad)`}/>
      </g>

      {/* CUERPO PRINCIPAL */}
      <path d={resistorPath} fill={`url(#${id}-body-grad)`}/>

      {/* BANDAS DE COLORES */}
      <g clipPath={`url(#${id}-clip)`}>
        <rect x="-52" y="-30" width="10" height="60" fill={getSVGColor(band1)} />
        <rect x="-35" y="-30" width="8" height="60" fill={getSVGColor(band2)} />
        <rect x="-15" y="-30" width="8" height="60" fill={getSVGColor(band3)} />
        <rect x="35" y="-30" width="10" height="60" fill={getSVGColor(band4)} />
      </g>

      {/* Brillo Superior */}
      <path 
        d="M -45,-12 Q 0,-18 45,-12" 
        fill="none" 
        stroke="#fff" 
        strokeWidth="5" 
        opacity="0.25" 
        strokeLinecap="round"
      />

      {/* Puntos de conexión */}
      <circle cx="-75" cy={pinDrop} r="4" fill="transparent" data-pin="a" />
      <circle cx="75" cy={pinDrop} r="4" fill="transparent" data-pin="b" />
    </g>
  );
};