import { useMemo } from 'react';
import { NetlistRenderer } from '../../Simulator/NetlistRenderer';

/**
 * PreviewSVG — Vista previa del circuito en tiempo real.
 *
 * @param {{
 *   componentes: Array<{ id, type, value, nodos, rotation, params }>,
 *   hoveredId?: string,
 *   onHoverComp?: (id: string|null) => void,
 * }} props
 */
export function PreviewSVG({ componentes = [], hoveredId, onHoverComp }) {
  const netlist = useMemo(() => buildNetlist(componentes), [componentes]);

  return (
    <div className="admin-preview">
      <p className="admin-preview__label">Vista previa del circuito</p>

      <div className="admin-preview__canvas">
        {componentes.length === 0 ? (
          <div className="admin-preview__empty">
            <p style={{ fontSize: 13, color: 'var(--text-hint)', textAlign: 'center' }}>
              Agrega componentes para ver la vista previa
            </p>
          </div>
        ) : (
          <NetlistRenderer netlist={netlist} preview={false} />
        )}
      </div>

      {componentes.length > 0 && (
        <p className="admin-preview__hint">
          {componentes.length} componente{componentes.length !== 1 ? 's' : ''}
          {hoveredId ? ` · resaltado: ${hoveredId}` : ''}
        </p>
      )}
    </div>
  );
}

function buildNetlist(componentes) {
  if (!componentes || componentes.length === 0) return [];

  // 1) Recolectar todos los nodos unicos (de cualquier pin de cualquier componente)
  const nodosSet = new Set();
  componentes.forEach((c) => {
    Object.values(c.nodos ?? {}).forEach((n) => {
      if (n) nodosSet.add(String(n));
    });
  });

  const nodos = [...nodosSet].sort((a, b) => {
    if (a === '0') return 1;
    if (b === '0') return -1;
    return a.localeCompare(b, undefined, { numeric: true });
  });

  // 2) Asignar posicion a cada nodo en una grilla escalonada
  const cols = Math.max(2, Math.ceil(Math.sqrt(nodos.length + 1)));
  const SPACING_X = 110, SPACING_Y = 120, ORIGIN_X = 40, ORIGIN_Y = 40;

  const nodoPos = {};
  nodos.forEach((n, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    nodoPos[n] = {
      x: ORIGIN_X + col * SPACING_X + (row % 2 ? SPACING_X / 2 : 0),
      y: ORIGIN_Y + row * SPACING_Y,
    };
  });

  // 3) Para cada componente: posicion = centroide de sus pines, y nodos con todos los pines
  return componentes.map((c) => {
    const pinKeys = Object.keys(c.nodos ?? {});

    // Posiciones de los nodos a los que se conecta cada pin
    const pinNodePositions = pinKeys.map((k) => {
      const nodo = c.nodos[k];
      return nodo ? (nodoPos[nodo] ?? { x: ORIGIN_X, y: ORIGIN_Y }) : { x: ORIGIN_X, y: ORIGIN_Y };
    });

    // Centroide para colocar el componente
    const cx = pinNodePositions.reduce((s, p) => s + p.x, 0) / Math.max(1, pinNodePositions.length);
    const cy = pinNodePositions.reduce((s, p) => s + p.y, 0) / Math.max(1, pinNodePositions.length);

    // Auto-rotacion (solo aplica a componentes de 2 pines)
    let rotation = 0;
    if (pinKeys.length === 2) {
      const [pA, pB] = pinNodePositions;
      const dxAbs = Math.abs(pB.x - pA.x);
      const dyAbs = Math.abs(pB.y - pA.y);
      const autoRot = (dyAbs > dxAbs * 1.3) ? 90 : 0;
      rotation = (c.rotation === 0 || c.rotation === 90) ? c.rotation : autoRot;
    } else {
      rotation = (c.rotation === 0 || c.rotation === 90) ? c.rotation : 0;
    }

    // Construir el objeto nodes para NetlistRenderer
    // - Para 2 pines: se emplea n1/n2 (alias compatibles con todos los models)
    // - Para 3 pines: se emplea las claves originales
    const nodes = {};
    if (pinKeys.length === 2) {
      const [k1, k2] = pinKeys;
      nodes.n1 = { nodo: String(c.nodos[k1] ?? ''), x: pinNodePositions[0].x, y: pinNodePositions[0].y };
      nodes.n2 = { nodo: String(c.nodos[k2] ?? ''), x: pinNodePositions[1].x, y: pinNodePositions[1].y };
      
      nodes[k1] = nodes.n1;
      nodes[k2] = nodes.n2;
    } else {
      pinKeys.forEach((k, i) => {
        nodes[k] = { nodo: String(c.nodos[k] ?? ''), x: pinNodePositions[i].x, y: pinNodePositions[i].y };
      });
    }

    return {
      id:       c.id,
      type:     c.type,
      value:    c.value ?? '',
      position: { x: cx, y: cy },
      rotation,
      params:   c.params ?? {},
      nodes,
    };
  });
}
