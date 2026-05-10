import { useMemo } from 'react';
import { NetlistRenderer } from '../components/Simulator/NetlistRenderer.jsx';
import { Circuit }        from '../domain';

/**
 * CircuitSVG — Renderiza el diagrama visual de un circuito.
 *
 * @param {object}  props
 * @param {Circuit|object} props.circuit  - Circuit (o JSON crudo) a renderizar.
 * @param {boolean} [props.preview]       - Modo compacto (cards/listados).
 * @param {boolean} [props.energized]     - Animacion de energizacion.
 */
export function CircuitSVG({ circuit, preview = false, energized = false }) {
  if (!circuit) return null;

  const c = circuit instanceof Circuit ? circuit : Circuit.fromAny(circuit);
  const h = preview ? 120 : 300;

  /**
   * netlistJSON se memoiza dependiendo de la identidad de c.netlist.
   *
   * Sin useMemo: c.netlist.map(toJSON) crea un array NUEVO en cada render,
   * aunque los datos no hayan cambiado. React pasa ese nuevo array como prop
   * a NetlistRenderer -> los componentes hijos se desmontan y remontan, 
   * perdiendo su estado interno (maxVal, liveVal…).
   *
   * Con useMemo: el array solo se recrea cuando c.netlist cambia de verdad
   * (nueva referencia), lo que ocurre unicamente cuando el mediator despacha
   * SET_NETLIST con datos realmente distintos.
   */
  const netlistJSON = useMemo(
    () => c.netlist.map((comp) =>
      typeof comp?.toJSON === 'function' ? comp.toJSON() : comp
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [c.netlist],   // referencia del array, no contenido — React hace Object.is()
  );

  if (Array.isArray(netlistJSON) && netlistJSON.length > 0) {
    return (
      <div style={{ width: '100%', height: preview ? h : '100%', minHeight: h }}>
        <NetlistRenderer
          netlist={netlistJSON}
          preview={preview}
          energized={energized}
        />
      </div>
    );
  }

  // Placeholder cuando aun no hay netlist
  return (
    <svg width="100%" height={h} style={{ background: '#16181d', borderRadius: 8 }}>
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
        fill="#2d3748" fontSize="12" fontFamily="monospace">
        {preview ? c.nombre : `"${c.nombre}" — sin diagrama disponible`}
      </text>
    </svg>
  );
}
