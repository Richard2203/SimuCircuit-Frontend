import React from 'react';
import { Capacitor } from './components/Simulator/models/capacitor';
import { Resistor } from './components/Simulator/models/resistor';
import { PowerSource } from './components/Simulator/models/PowerSource';

const App = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
       <svg width="800" height="600" style={{ background: '#f5f5f5' }}>
        <Capacitor 
          x={100} 
          y={200} 
          nodeA="vcc" 
          nodeB="nodo1" 
          value="100µF" 
          voltage="25V" 
        />

        <Resistor 
          x={300} 
          y={100} 
          band1="red" 
          band2="red" 
          band3="brown" 
          nodeA="nodo1" 
          nodeB="nodo2" 
        />

        {/* Así llamas a la nueva fuente de poder */}
        <PowerSource 
          x={500} 
          y={150} 
          nodeA="vcc" 
          nodeB="gnd" 
          label="Main Supply" 
        />
        {/* puedes tener 500 componentes sin ningún problema de rendimiento */}
      </svg>
    </div>
  );
};

export default App;