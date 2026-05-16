import { useMemo } from 'react';

import { calcViewBox, getPins, resolvePin, getNodoNum } from '../../Simulator/renderer/geometry.js';
import { CANVAS_SCALE } from '../../Simulator/renderer/constants.js';
import { getComponentBBox } from '../../Simulator/renderer/collision.js';
import { WireLayer } from '../../Simulator/renderer/wireRouting.jsx';
import { renderComponent, GndSymbol } from '../../Simulator/renderer/componentRenderer.jsx';
import { CompLabels, NodeLabels } from '../../Simulator/renderer/labels.jsx';

/* Helpers locales */
function findLowestGndPin(netlist) {
  const gndPins = [];
  netlist.forEach((comp) => {
    const pins = getPins(comp);
    Object.entries(comp.nodes ?? {}).forEach(([pinKey, pinData]) => {
      if (getNodoNum(pinData) === '0') {
        const p = resolvePin(pins, pinKey);
        if (p) gndPins.push(p);
      }
    });
  });
  return gndPins.length > 0
    ? gndPins.reduce((acc, p) => (p.y > acc.y ? p : acc), gndPins[0])
    : null;
}

function toRenderNetlist(componentes) {
  return componentes
    .map((c) => {
      if (c && typeof c.toJSON === 'function') return c.toJSON();
      if (c && c.nodos && !c.nodes) {
        const nodes = {};
        Object.entries(c.nodos).forEach(([k, v]) => {
          nodes[k] = { nodo: String(v ?? ''), x: null, y: null };
        });
        return { ...c, nodes };
      }
      return c;
    })
    .filter(Boolean);
}

/**
 * Calcula un "key" unico que cambia cuando algo relevante para el render
 * cambia. Esto fuerza el remontaje de los modelos del simulador (que usan
 * useState(initialValue) y por tanto no responden a cambios posteriores
 * de initialValue).
 */
function makeNetlistKey(netlist) {
  return netlist
    .map((c) => {
      const pos = c.position ?? {};
      const params = c.params ?? {};
      return [
        c.id, c.type, c.value, c.rotation,
        pos.x, pos.y,
        params.tipo, params.dcOrAc, params.frequency,
        params.tipo_dioelectrico,
      ].join(':');
    })
    .join('|');
}

/* Hover / selection ring */

function FocusRing({ comp, variant = 'hover' }) {
  if (!comp) return null;
  const bbox = getComponentBBox(comp);
  const PAD = 8;
  const stroke = variant === 'selected' ? '#fbbf24' : 'rgba(167,139,250,0.7)';
  const fill = variant === 'selected' ? 'rgba(251,191,36,0.06)' : 'rgba(167,139,250,0.06)';
  return (
    <rect
      x={bbox.minX - PAD}
      y={bbox.minY - PAD}
      width={bbox.maxX - bbox.minX + PAD * 2}
      height={bbox.maxY - bbox.minY + PAD * 2}
      rx={5}
      fill={fill}
      stroke={stroke}
      strokeWidth={1.6}
      strokeDasharray={variant === 'selected' ? undefined : '4 3'}
      pointerEvents="none"
    />
  );
}

/* Hitbox transparente para click-to-edit */

function ClickHitbox({ comp, onClick }) {
  const bbox = getComponentBBox(comp);
  const PAD = 6;
  return (
    <rect
      x={bbox.minX - PAD}
      y={bbox.minY - PAD}
      width={bbox.maxX - bbox.minX + PAD * 2}
      height={bbox.maxY - bbox.minY + PAD * 2}
      rx={4}
      fill="transparent"
      pointerEvents="all"
      style={{ cursor: 'pointer' }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(comp.id);
      }}
    />
  );
}

/* Componente principal */

/**
 * PreviewSVG — Vista previa del circuito (read-only + click-to-edit).
 *
 * @param {{
 *   componentes: Array,
 *   hoveredId?: string,
 *   selectedId?: string,
 *   onHoverComp?: (id: string|null) => void,
 *   onEditComp?: (id: string) => void,
 * }} props
 */
export function PreviewSVG({
  componentes = [],
  hoveredId,
  selectedId,
  onHoverComp,
  onEditComp,
}) {
  const netlist = useMemo(() => toRenderNetlist(componentes), [componentes]);
  const viewBox = useMemo(() => calcViewBox(netlist), [netlist]);
  const gndAnchor = useMemo(() => findLowestGndPin(netlist), [netlist]);
  const netlistKey = useMemo(() => makeNetlistKey(netlist), [netlist]);

  const hoveredComp  = hoveredId  ? netlist.find((c) => c.id === hoveredId)  : null;
  const selectedComp = selectedId ? netlist.find((c) => c.id === selectedId) : null;

  if (componentes.length === 0) {
    return (
      <div className="admin-preview">
        <p className="admin-preview__label">Vista previa del circuito</p>
        <div className="admin-preview__canvas">
          <div className="admin-preview__empty">
            <p style={{ fontSize: 13, color: 'var(--text-hint)', textAlign: 'center' }}>
              Agrega componentes para ver la vista previa
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-preview">
      <p className="admin-preview__label">Vista previa del circuito</p>

      <div className="admin-preview__canvas admin-canvas">
        <svg
          width="100%"
          height="100%"
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          style={{ background: '#16181d', display: 'block', userSelect: 'none' }}
          onClick={() => onEditComp?.(null)}
        >
          {/* Grilla de fondo */}
          <defs>
            <pattern
              id="admin-canvas-grid"
              width={CANVAS_SCALE * 50}
              height={CANVAS_SCALE * 50}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${CANVAS_SCALE * 50} 0 L 0 0 0 ${CANVAS_SCALE * 50}`}
                fill="none"
                stroke="#1e2028"
                strokeWidth={0.5}
              />
            </pattern>
          </defs>
          <rect x="-10000" y="-10000" width="20000" height="20000" fill="url(#admin-canvas-grid)" />

          {/* Cables */}
          <WireLayer netlist={netlist} />

          {/* Tierra */}
          {gndAnchor && <GndSymbol x={gndAnchor.x} y={gndAnchor.y + 18} />}

          {/* Cuerpos.
              Le pasamos un key derivado del netlist para forzar el remount
              de los modelos del simulador cuando cambie cualquier propiedad
              relevante. Asi useComponentValue recrea su useState con el
              initialValue actualizado. */}
          <g pointerEvents="none" key={netlistKey}>
            {netlist.map((comp) => renderComponent(comp))}
          </g>

          {/* Etiquetas estandar (ID, pines de transistor/regulador, nodos) */}
          <g pointerEvents="none">
            <CompLabels netlist={netlist} />
            <NodeLabels netlist={netlist} />
          </g>

          {/* Rings de hover / seleccion */}
          {hoveredComp && hoveredId !== selectedId && (
            <FocusRing comp={hoveredComp} variant="hover" />
          )}
          {selectedComp && <FocusRing comp={selectedComp} variant="selected" />}

          {/* Hitboxes de click — siempre al final para que reciban los eventos */}
          {netlist.map((comp) => (
            <ClickHitbox
              key={`hit-${comp.id}`}
              comp={comp}
              onClick={onEditComp}
            />
          ))}
        </svg>
      </div>

      <p className="admin-preview__hint">
        {componentes.length} componente{componentes.length !== 1 ? 's' : ''}
        {selectedId ? <> · editando: <strong>{selectedId}</strong></>
          : hoveredId ? <> · resaltado: <strong>{hoveredId}</strong></>
          : <> · clic en un componente para editarlo</>
        }
      </p>
    </div>
  );
}