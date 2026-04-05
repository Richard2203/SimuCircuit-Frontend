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
          orientation="vertical"
        />

        <Capacitor 
          x={130} 
          y={400} 
          nodeA="vcc" 
          nodeB="nodo1" 
          value="100µF" 
          voltage="25V" 
          orientation="horizontal"
        />

        <Resistor 
          x={300} 
          y={50} 
          band1="red" 
          band2="red" 
          band3="brown" 
          nodeA="nodo1" 
          nodeB="nodo2" 
          orientation='horizontal'
        />

        <Resistor 
          x={300} 
          y={170} 
          band1="red" 
          band2="red" 
          band3="brown" 
          nodeA="nodo1" 
          nodeB="nodo2" 
          orientation='vertical'
        />

        <LED
            x={600} 
            y={300} 
            nodeA="nodo_anodo"   // Pin positivo (pata larga / post interno)
            nodeB="nodo_catodo"  // Pin negativo (pata con curva / anvil interno)
            color="#2ecc71"      // Puedes cambiarlo a otro verde o color si quieres
            isOn={true}          // Opcional: para controlar si brilla o no
            orientation='horizontal'
        />

        <LED
            x={750} 
            y={300} 
            nodeA="nodo_anodo"   // Pin positivo (pata larga / post interno)
            nodeB="nodo_catodo"  // Pin negativo (pata con curva / anvil interno)
            color="#2ecc71"      // Puedes cambiarlo a otro verde o color si quieres
            isOn={true}          // Opcional: para controlar si brilla o no
            orientation='vertical'
        />

        <DiodoRectificador
          x={500} 
          y={100} 
          nodeA="anodo_diodo" 
          nodeB="catodo_diodo"
          orientation='horizontal'
        />

        <DiodoRectificador
          x={650} 
          y={100} 
          nodeA="anodo_diodo" 
          nodeB="catodo_diodo"
          orientation='vertical'
        />

        <ZenerDiode
          x={600} 
          y={200} 
          nodeA="anodo_zener" 
          nodeB="catodo_zener"
          orientation='horizontal'  
        />

        <ZenerDiode
          x={525} 
          y={300} 
          nodeA="anodo_zener" 
          nodeB="catodo_zener"
          orientation='vertical'
        />

        <Transistor 
          x={350} 
          y={300} 
          nodeAdj="linea_ajuste" 
          nodeOut="v_out_regulada" 
          nodeIn="v_in_fuente" 
          orientation='horizontal'
        />

        <Transistor 
          x={450} 
          y={300} 
          nodeAdj="linea_ajuste" 
          nodeOut="v_out_regulada" 
          nodeIn="v_in_fuente" 
          orientation='vertical'

        />

        <TransistorTO92 
          x={100} 
          y={525} 
          nodeE="linea_emisor"   // Pata Izquierda
          nodeB="señal_base"     // Pata Central
          nodeC="vcc_colector"   // Pata Derecha
          orientation='horizontal'
        />

        <TransistorTO92 
          x={40} 
          y={500} 
          nodeE="linea_emisor"   // Pata Izquierda
          nodeB="señal_base"     // Pata Central
          nodeC="vcc_colector"   // Pata Derecha
          orientacion='vertical'
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