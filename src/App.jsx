import React from 'react';
import { Capacitor } from './components/Simulator/models/capacitor.jsx';
import { Resistor } from './components/Simulator/models/resistor.jsx';
import { PowerSource } from './components/Simulator/models/PowerSource.jsx';
import { LED } from './components/Simulator/models/led.jsx';
import { DiodoRectificador } from './components/Simulator/models/diodoRectificador.jsx';
import { ZenerDiode } from './components/Simulator/models/ZenerDiode.jsx';
import { Transistor } from './components/Simulator/models/Transistor.jsx';
import { TransistorTO92 } from './components/Simulator/models/TransistorTO92.jsx';
import { Node } from './components/Simulator/models/Node.jsx';

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

        <LED
            x={450} 
            y={300} 
            nodeA="nodo_anodo"   // Pin positivo (pata larga / post interno)
            nodeB="nodo_catodo"  // Pin negativo (pata con curva / anvil interno)
            color="#2ecc71"      // Puedes cambiarlo a otro verde o color si quieres
            isOn={true}          // Opcional: para controlar si brilla o no
        />

        <DiodoRectificador
          x={400} 
          y={200} 
          nodeA="anodo_diodo" 
          nodeB="catodo_diodo"
        />

        <ZenerDiode
          x={600} 
          y={200} 
          nodeA="anodo_zener" 
          nodeB="catodo_zener"
        />

        <Transistor 
          x={500} 
          y={300} 
          nodeAdj="linea_ajuste" 
          nodeOut="v_out_regulada" 
          nodeIn="v_in_fuente" 
        />

        <TransistorTO92 
          x={400} 
          y={200} 
          nodeE="linea_emisor"   // Pata Izquierda
          nodeB="señal_base"     // Pata Central
          nodeC="vcc_colector"   // Pata Derecha
        />

        <PowerSource 
          x={150} 
          y={370} 
          nodeA="vcc" 
          nodeB="gnd" 
          label="Fuente de Poder" 
        />

        <Node 
          id="nodo1" 
          x={200} 
          y={500} 
        />
      </svg>
    </div>
  );
};

export default App;