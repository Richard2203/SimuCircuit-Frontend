/**
 * Devuelve el elemento SVG/JSX que representa visualmente un componente.
 * Adicionalmente expone tambien los sub-componentes auxiliares GndSymbol 
 * y FallbackComp.
 */

import { Resistor }          from '../models/resistor.jsx';
import { Capacitor }         from '../models/capacitor.jsx';
import { CapacitorCeramico } from '../models/CapacitorCeramico.jsx';
import { PowerSource }       from '../models/PowerSource.jsx';
import { ACSource }          from '../models/ACSource.jsx';
import { DiodoRectificador } from '../models/DiodoRectificador.jsx';
import { Transistor }        from '../models/Transistor.jsx';
import { TransistorTO92 }    from '../models/TransistorTO92.jsx';
import { Potentiometer }     from '../models/Potentiometer.jsx';
import { CurrentSource }     from '../models/CurrentSource.jsx';
import { Bobina }            from '../models/Bobina.jsx';
import { LED, LED_COLORS }   from '../models/led.jsx';
import { parseNotation }     from '../models/ComponentValueLabel.jsx';

import { toSVG } from './geometry.js';
import { SCALE_DEFAULT, SCALE_POT, SCALE_TO220, SCALE_TO92 } from './constants.js';

/* Auxiliares */

/**
 * Simbolo de tierra (GND) estandar.
 *
 * @param {{ x: number, y: number }} props
 */
export function GndSymbol({ x, y }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <line x1={0}   y1={0}  x2={0}   y2={12} stroke="#4a5568" strokeWidth={2} />
      <line x1={-10} y1={12} x2={10}  y2={12} stroke="#4a5568" strokeWidth={2} />
      <line x1={-6}  y1={17} x2={6}   y2={17} stroke="#4a5568" strokeWidth={1.5} />
      <line x1={-2}  y1={22} x2={2}   y2={22} stroke="#4a5568" strokeWidth={1} />
    </g>
  );
}

/**
 * Componente de respaldo para tipos no reconocidos.
 * Muestra el ID y el valor en un rectangulo generico.
 *
 * @param {{ comp: object, x: number, y: number }} props
 */
export function FallbackComp({ comp, x, y }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={-28} y={-14} width={56} height={28} rx={4}
        fill="#1e2028" stroke="#4a5568" strokeWidth={1.5} />
      <text textAnchor="middle" y={-2} fontSize={9} fill="#94a3b8" fontFamily="monospace" fontWeight="600">
        {comp.id}
      </text>
      <text textAnchor="middle" y={9} fontSize={8} fill="#6b7280" fontFamily="monospace">
        {comp.value ?? ''}
      </text>
    </g>
  );
}

/* Renderizado por tipo */

/**
 * Devuelve el JSX correspondiente al componente segun su tipo.
 *
 * @param {object}  comp       Componente normalizado de la netlist
 * @param {boolean} energized  true cuando la simulacion esta activa
 * @returns {JSX.Element}
 */
export function renderComponent(comp, energized = false, dcResults = null) {
  const { x, y }   = toSVG(comp.position);
  const rotation   = comp.rotation ?? 0;
  const valueNum   = parseNotation(comp.value) || 0;
  const orientation  = (rotation === 90 || rotation === 270) ? 'vertical' : 'horizontal';
  const wrapRotation = rotation ? `rotate(${rotation}, ${x}, ${y})` : undefined;

  switch (comp.type) {

    case 'resistencia':
      return (
        <g key={comp.id} transform={wrapRotation}>
          <Resistor x={x} y={y} scale={SCALE_DEFAULT}
            componentId={comp.id} initialValue={valueNum} />
        </g>
      );

    case 'resistencia_variable':
      return (
        <g key={comp.id} transform={wrapRotation}>
          <Potentiometer x={x} y={y} scale={SCALE_POT}
            componentId={comp.id} initialValue={valueNum} />
        </g>
      );

    case 'capacitor': {
      const tipoD      = (comp.params?.tipo_dioelectrico || '').toLowerCase();
      const esCeramico = tipoD.includes('ceram') || tipoD.includes('cerám');

      return esCeramico
        ? (
          <CapacitorCeramico key={comp.id} x={x} y={y} scale={SCALE_DEFAULT}
            rotation={rotation} componentId={comp.id} initialValue={valueNum} />
        )
        : (
          <g key={comp.id}>
            <Capacitor x={x} y={y} scale={SCALE_DEFAULT} orientation={orientation}
              componentId={comp.id} initialValue={valueNum} />
          </g>
        );
    }

    case 'fuente_voltaje': {
      const esAC = (comp.params?.dcOrAc || '').toLowerCase() === 'ac';

      if (esAC) {
        const freq = parseFloat(comp.params?.frequency) || 60;
        return (
          <ACSource key={comp.id} x={x} y={y} scale={SCALE_DEFAULT} rotation={rotation}
            componentId={comp.id} initialValue={valueNum} frequency={freq} />
        );
      }
      return (
        <g key={comp.id} transform={wrapRotation}>
          <PowerSource x={x - 80} y={y - 60} scale={SCALE_DEFAULT}
            componentId={comp.id} initialValue={valueNum} />
        </g>
      );
    }

    case 'fuente_corriente':
      return (
        <CurrentSource key={comp.id} x={x} y={y} scale={SCALE_DEFAULT} rotation={rotation}
          componentId={comp.id} initialValue={valueNum} />
      );

    case 'bobina':
      return (
        <Bobina key={comp.id} x={x} y={y} scale={SCALE_DEFAULT} rotation={rotation}
          componentId={comp.id} initialValue={valueNum} />
      );

    case 'diodo': {
      const esLED = (comp.params?.tipo || '').toLowerCase().startsWith('led');

      if (esLED) {
        let ledOn = energized;

        if (energized && dcResults?.voltages) {
          const colorKey = (comp.value || 'VERDE').trim().toUpperCase();
          const colorDef = LED_COLORS.find(c => c.value === colorKey) || LED_COLORS.find(c => c.value === 'VERDE');
          const vf = colorDef?.vf ?? 2.0;

          // Leer los nodos del LED (anodo = n1, catodo = n2).
          // comp.nodes[pin] es un objeto { nodo, x, y } — hay que leer .nodo
          const nAnodo  = String(comp.nodes?.n1?.nodo ?? comp.nodes?.n1 ?? '');
          const nCatodo = String(comp.nodes?.n2?.nodo ?? comp.nodes?.n2 ?? '');
          const vAnodo  = dcResults.voltages[nAnodo]  ?? 0;
          const vCatodo = dcResults.voltages[nCatodo] ?? 0;
          const vDiodo  = vAnodo - vCatodo;
          ledOn = vDiodo >= vf;
        }
        return (
          <g key={comp.id}>
            <LED x={x} y={y} scale={SCALE_DEFAULT} rotation={rotation}
              componentId={comp.id}
              initialColor={comp.value || 'VERDE'}
              energized={ledOn} />
          </g>
        );
      }
      
      return (
        <g key={comp.id} transform={wrapRotation}>
          <DiodoRectificador x={x} y={y} scale={SCALE_DEFAULT} orientation="horizontal"
            componentId={comp.id} initialValue={comp.value} />
        </g>
      );
    }

    case 'transistor_bjt':
    case 'transistor_fet':
      return (
        <g key={comp.id} transform={wrapRotation}>
          <TransistorTO92 x={x} y={y} scale={SCALE_TO92}
            componentId={comp.id} initialValue={comp.value} />
        </g>
      );

    case 'regulador_voltaje':
      return (
        <g key={comp.id} transform={wrapRotation}>
          <Transistor x={x} y={y} scale={SCALE_TO220}
            labelType="vreg" componentId={comp.id} initialValue={comp.value} />
        </g>
      );

    default:
      return <FallbackComp key={comp.id} comp={comp} x={x} y={y} />;
  }
}