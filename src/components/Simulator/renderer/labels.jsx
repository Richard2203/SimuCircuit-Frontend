/**
 * Capa de etiquetas superpuesta sobre el canvas del simulador:
 *
 *   <CompLabels>   — ID del componente (R1, V1...) + pines de transistores/reguladores
 *   <NodeLabels>   — Numeros de nodo electrico en cada pin (para analisis nodal)
 *
 * Se renderiza despues de los componentes para quedar siempre visible.
 * No contiene logica de enrutado ni de modelos visuales.
 */

import { toSVG, rotPt, getPins, resolvePin, getNodoNum } from './geometry.js';
import { scaleFor } from './constants.js';

/* Mapas de etiquetas de pin */

/** BJT: claves de pin -> letra de terminal */
const BJT_PIN_LABELS = {
  ne: 'E', nb: 'B', nc: 'C',
  e: 'E',  b: 'B',  c: 'C',
  emisor: 'E', base: 'B', colector: 'C',
  emitter: 'E', collector: 'C',
};

/** FET: claves de pin -> letra de terminal */
const FET_PIN_LABELS = {
  ng: 'G', ns: 'S', nd: 'D',
  g: 'G',  s: 'S',  d: 'D',
  gate: 'G', source: 'S', drain: 'D',
};

/** Regulador de voltaje: claves de pin -> etiqueta de terminal */
const VREG_PIN_LABELS = {
  nin: 'Vin', vin: 'Vin', in: 'Vin', entrada: 'Vin',
  nout: 'Vout', vout: 'Vout', out: 'Vout', salida: 'Vout',
  nadj: 'GND', ngnd: 'GND', adj: 'GND', ref: 'GND', tierra: 'GND',
};

/* Posicionamiento de etiquetas */

/**
 * Calcula la posicion SVG de la etiqueta de ID de un componente.
 * Se coloca por encima del cuerpo visual, respetando escala y rotacion.
 *
 * Los offsets estan en unidades LOCALES (pre-scale) para que sean
 * correctos independientemente de la escala visual del componente.
 *
 * @param {object} comp  Componente normalizado de la netlist
 * @returns {{ x: number, y: number }}
 */
function getIdLabelPos(comp) {
  const { x, y } = toSVG(comp.position);
  const rot = comp.rotation ?? 0;
  const s   = scaleFor(comp.type);

  switch (comp.type) {
    case 'resistencia':
      return rotPt(x, y, 0, -(28 + 10) * s, rot);

    case 'resistencia_variable':
      return rotPt(x, y, 0, -(28 + 12) * s, rot);

    case 'bobina':
      return rotPt(x, y, 0, -(56 + 10) * s, rot);

    case 'capacitor': {
      const tipoD = (comp.params?.tipo_dioelectrico || '').toLowerCase();
      return tipoD.includes('ceram') || tipoD.includes('cerám')
        ? rotPt(x, y, 0, -(42.9 + 48) * s, rot)
        : rotPt(x, y, 0, -(35  + 12) * s, rot);
    }

    case 'fuente_voltaje': {
      const esAC = (comp.params?.dcOrAc || '').toLowerCase() === 'ac';
      return esAC
        ? rotPt(x, y, 0, -(60 + 12) * s, rot)
        : { x: x + 20, y: y - 72 };   // DC PowerSource: cuerpo desplazado
    }

    case 'fuente_corriente':
      return rotPt(x, y, 0, -50, rot);

    case 'diodo': {
      const esLED = (comp.params?.tipo || '').toLowerCase().startsWith('led');
      return esLED
        ? rotPt(x, y, 0, -(20 + 12) * s, rot)
        : rotPt(x, y, 0, -(20 + 10) * s, rot);
    }

    case 'transistor_bjt':
    case 'transistor_fet':
      return rotPt(x, y, 0, -(15 + 12) * s, rot);

    case 'regulador_voltaje':
      return rotPt(x, y, 0, -(55 + 12) * s, rot);

    default:
      return rotPt(x, y, 0, -30, rot);
  }
}

/**
 * posicionamiento en V para etiquetado de reguladores de voltaje
 * @param {{ x: number, y: number }} pin  Posicion SVG del pin
 * @param {'Vin'|'GND'|'Vout'|string} label
 * @returns {{ x: number, y: number, anchor: string }}
 */
function getVregPinLabelAttrs(pin, label) {
  switch (label) {
    case 'Vin':  return { x: pin.x - 1, y: pin.y + 10, anchor: 'end'    };
    case 'GND':
    case 'ADJ':  return { x: pin.x,     y: pin.y + 26, anchor: 'middle' };
    case 'Vout': return { x: pin.x + 1, y: pin.y + 10, anchor: 'start'  };
    default:     return { x: pin.x,     y: pin.y + 16, anchor: 'middle' };
  }
}

/* Estilos compartidos */

const ID_TEXT_PROPS = {
  textAnchor:  'middle',
  fontSize:    11,
  fill:        '#a78bfa',
  fontFamily:  "'JetBrains Mono','Fira Code',monospace",
  fontWeight:  '600',
  paintOrder:  'stroke',
  stroke:      'rgba(22,24,29,0.9)',
  strokeWidth: 2.5,
  style:       { pointerEvents: 'none', userSelect: 'none' },
};

const PIN_TEXT_PROPS = {
  fontSize:    9,
  fill:        '#fbbf24',
  fontFamily:  "'JetBrains Mono',monospace",
  fontWeight:  '700',
  paintOrder:  'stroke',
  stroke:      'rgba(22,24,29,0.85)',
  strokeWidth: 2,
  style:       { pointerEvents: 'none', userSelect: 'none' },
};

const NODE_TEXT_PROPS = {
  textAnchor:  'start',
  fontSize:    10,
  fill:        '#60a5fa',
  fontFamily:  'monospace',
  fontWeight:  '600',
  paintOrder:  'stroke',
  stroke:      'rgba(22,24,29,0.8)',
  strokeWidth: 2,
  opacity:     0.85,
  style:       { pointerEvents: 'none', userSelect: 'none' },
};

/* Componentes de capa de etiquetas */

/**
 * Renderiza el ID de cada componente y, en transistores y reguladores,
 * tambien las etiquetas de cada pin (B/E/C, G/D/S, Vin/GND/Vout).
 *
 * @param {{ netlist: object[] }} props
 */
export function CompLabels({ netlist }) {
  return (
    <>
      {netlist.map((comp) => {
        const pos          = getIdLabelPos(comp);
        const isTransistor = comp.type === 'transistor_bjt' || comp.type === 'transistor_fet';
        const isRegulator  = comp.type === 'regulador_voltaje';
        const isFET        = comp.type === 'transistor_fet';
        const needsPins    = isTransistor || isRegulator;

        const codigoComercial = String(comp.value || '').toUpperCase();
        const tipoRegulador   = String(comp.params?.tipo || '').toLowerCase();
        const esAjustable     = isRegulator && (
          /^LM(317|337|338|350)/.test(codigoComercial) ||
          tipoRegulador.includes('ajustable')
        );

        const pinLabelMap = isRegulator ? VREG_PIN_LABELS
                          : isFET       ? FET_PIN_LABELS
                          :               BJT_PIN_LABELS;

        const pins = needsPins ? getPins(comp) : null;

        return (
          <g key={`${comp.id}-lbl`}>
            {/* Etiqueta del ID del componente */}
            <text x={pos.x} y={pos.y} {...ID_TEXT_PROPS}>
              {comp.id}
            </text>

            {/* Etiquetas de pines: solo para transistores y reguladores */}
            {needsPins && Object.entries(comp.nodes ?? {}).map(([pinKey]) => {
              let label = pinLabelMap[pinKey.toLowerCase()];
              if (!label) return null;

              if (esAjustable && label === 'GND') {
                label = 'ADJ';
              }

              const pin = resolvePin(pins, pinKey);
              if (!pin)  return null;

              const { x: lx, y: ly, anchor } = isRegulator
                ? getVregPinLabelAttrs(pin, label)
                : { x: pin.x, y: pin.y + 16, anchor: 'middle' };

              return (
                <text key={`${comp.id}-pin-${pinKey}`}
                  x={lx} y={ly} textAnchor={anchor} {...PIN_TEXT_PROPS}>
                  {label}
                </text>
              );
            })}
          </g>
        );
      })}
    </>
  );
}

/**
 * Renderiza los numeros de nodo electrico en cada pin (analisis nodal).
 * Solo muestra nodos distintos de GND (nodo 0).
 *
 * @param {{ netlist: object[] }} props
 */
export function NodeLabels({ netlist }) {
  return (
    <>
      {netlist.map((comp) => {
        const pins = getPins(comp);
        return Object.entries(comp.nodes ?? {}).map(([pinKey, pinData]) => {
          const nodo = getNodoNum(pinData);
          if (!nodo || nodo === '0') return null;
          const p = resolvePin(pins, pinKey);
          if (!p) return null;
          return (
            <text key={`${comp.id}-${pinKey}-nodo`}
              x={p.x + 5} y={p.y - 5} {...NODE_TEXT_PROPS}>
              {nodo}
            </text>
          );
        });
      })}
    </>
  );
}