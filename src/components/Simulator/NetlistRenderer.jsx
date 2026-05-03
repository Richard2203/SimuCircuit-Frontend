import { Resistor }          from './models/resistor.jsx';
import { Capacitor }         from './models/capacitor.jsx';
import { CapacitorCeramico } from './models/CapacitorCeramico.jsx';
import { PowerSource }       from './models/PowerSource.jsx';
import { ACSource }          from './models/ACSource.jsx';
import { DiodoRectificador } from './models/DiodoRectificador.jsx';
import { Transistor }        from './models/Transistor.jsx';
import { TransistorTO92 }    from './models/TransistorTO92.jsx';
import { parseNotation }     from './models/ComponentValueLabel.jsx';
import { Potentiometer }     from './models/Potentiometer.jsx';
import { CurrentSource }     from './models/CurrentSource.jsx';
import { Bobina }            from './models/Bobina.jsx';
import { LED } from './models/led.jsx';

const CANVAS_SCALE = 1.8;
const OFFSET_X     = 60;
const OFFSET_Y     = 60;

// Scale visual de cada componente 
const SCALE_DEFAULT = 0.38;
const SCALE_POT     = 0.75;
const SCALE_TO220   = 0.70;  // LM7805 regulador (paquete TO-220 grande)
const SCALE_TO92    = 1.50;  // BJT/FET (paquete TO-92 pequeño)

function scaleFor(type) {
  if (type === 'resistencia_variable') return SCALE_POT;
  if (type === 'regulador_voltaje')    return SCALE_TO220;
  if (type === 'transistor_bjt' || type === 'transistor_fet') return SCALE_TO92;
  return SCALE_DEFAULT;
}

function toSVG(pos) {
  return {
    x: (parseFloat(pos?.x ?? 0)) * CANVAS_SCALE + OFFSET_X,
    y: (parseFloat(pos?.y ?? 0)) * CANVAS_SCALE + OFFSET_Y,
  };
}

/** Extrae el numero de nodo tanto del formato viejo (string) como nuevo ({nodo,x,y}) */
function getNodoNum(pinData) {
  if (pinData && typeof pinData === 'object') return String(pinData.nodo);
  return String(pinData);
}

// ─────────────────────────────────────────────────────────────────────────────
// Caculo de pines en SVG, replicando los offsets exactos de cada modelo.
// Cada componente devuelve un mapa { pinKey -> {x,y} } en coordenadas SVG.
// rotation se aplica como rotacion rigida alrededor del centro (cx, cy).
// ─────────────────────────────────────────────────────────────────────────────

function rotPt(cx, cy, dx, dy, rotDeg) {
  const r = (rotDeg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
}

/**
 * Pines de cada componente en SVG, alineados con el modelo visual real.
 * Devuelve TODOS los alias posibles para que el matcher de pines funcione
 * sin importar la convencion de nombres ("n1"/"a"/"pin1", "pos"/"a", etc.).
 */
function getPins(comp) {
  const cx = parseFloat(comp.position?.x ?? 0) * CANVAS_SCALE + OFFSET_X;
  const cy = parseFloat(comp.position?.y ?? 0) * CANVAS_SCALE + OFFSET_Y;
  const rot = comp.rotation ?? 0;
  const s   = scaleFor(comp.type);

  const t = comp.type;

  if (t === 'resistencia') {
    // Resistor horizontal por defecto: pines a ±100*s = ±38px
    const arm = 100 * s;
    const a = rotPt(cx, cy, -arm, 0, rot);
    const b = rotPt(cx, cy,  arm, 0, rot);
    return {
      n1: a, n2: b,
      a: a, b: b,
      'pin 1': a, 'pin 2': b, pin1: a, pin2: b,
    };
  }

  if (t === 'bobina') {
    // Bobina toroidal vista de frentes
    //   rOuter=56, pinLen=38, pinSpacing=16
    const pinSp   = 16 * s;
    const pinDist = (56 + 38) * s;
    const a = rotPt(cx, cy, -pinSp, pinDist, rot);
    const b = rotPt(cx, cy,  pinSp, pinDist, rot);
    return {
      n1: a, n2: b,
      a: a, b: b,
      'pin 1': a, 'pin 2': b, pin1: a, pin2: b,
    };
  }

  if (t === 'resistencia_variable') {
    // Potenciometro: 3 patas saliendo hacia abajo desde el cuerpo circular.
    //   pinSpacing=14, R=28, pinLen=38
    const sp = 14 * s;
    const dy = (28 + 38) * s;
    const pa = rotPt(cx, cy, -sp, dy, rot);
    const pw = rotPt(cx, cy,   0, dy, rot);
    const pb = rotPt(cx, cy,  sp, dy, rot);
    return {
      a: pa, w: pw, b: pb,
      n1: pa, n2: pw, n3: pb, wiper: pw,
      'pin 1': pa, 'pin 2': pw, 'pin 3': pb,
      pin1: pa, pin2: pw, pin3: pb,
      izquierda: pa, centro: pw, derecha: pb,
      izq: pa, der: pb,
    };
  }

  if (t === 'capacitor') {
    const tipoD = (comp.params?.tipo_dioelectrico || '').toLowerCase();
    const esCeramico = tipoD.includes('ceram') || tipoD.includes('cerám');

    if (esCeramico) {
      // CapacitorCeramico: bipolar vertical clasico
      const pinTopY = (-42.9 - 38) * s;
      const pinBotY = ( 23.4 + 38) * s;
      const a = rotPt(cx, cy, 0, pinTopY, rot);
      const b = rotPt(cx, cy, 0, pinBotY, rot);
      return { n1: a, n2: b, a, b, 'pin 1': a, 'pin 2': b, pin1: a, pin2: b };
    }

    // Capacitor electrolitico / tantalio (cilindrico, pines escalonados)
    const orientation = (rot === 90 || rot === 270) ? 'vertical' : 'horizontal';
    let pinA, pinB;
    if (orientation === 'horizontal') {
      pinA = { x: cx - 108 * s, y: cy - 24 * s };
      pinB = { x: cx + 108 * s, y: cy + 23 * s };
    } else {
      pinA = { x: cx - 24 * s, y: cy + 108 * s };
      pinB = { x: cx + 23 * s, y: cy + 108 * s };
    }
    return { n1: pinA, n2: pinB, a: pinA, b: pinB, 'pin 1': pinA, 'pin 2': pinB, pin1: pinA, pin2: pinB };
  }

  if (t === 'fuente_voltaje') {
    const esAC = (comp.params?.dcOrAc || '').toLowerCase() === 'ac';

    if (esAC) {
      // ACSource: círculo con pines alineados al eje horizontal.
      const pinDist = (60 + 78) * s;
      const pos = rotPt(cx, cy,  pinDist, 0, rot);
      const neg = rotPt(cx, cy, -pinDist, 0, rot);
      return {
        pos, neg,
        a: pos, b: neg,
        positivo: pos, negativo: neg, vcc: pos, gnd: neg,
      };
    }

    // PowerSource (DC): cuerpo de fuente de laboratorio, pines a la derecha.
    const pos = rotPt(cx, cy,  138.5, -34.16, rot);
    const neg = rotPt(cx, cy,  142.3,  23.60, rot);
    return {
      pos, neg,
      a: pos, b: neg,
      positivo: pos, negativo: neg, vcc: pos, gnd: neg,
    };
  }

  if (t === 'fuente_corriente') {
    // CurrentSource: pos arriba, neg abajo a ±38px (en SVG, ya escalado).
    const pos = rotPt(cx, cy, 0, -38, rot);
    const neg = rotPt(cx, cy, 0,  38, rot);
    return {
      pos, neg,
      a: pos, b: neg,
      positivo: pos, negativo: neg,
    };
  }

  if (t === 'diodo') {
    const esLED = (comp.params?.tipo || '').toLowerCase().startsWith('led');
    if (esLED) {
      // LED vertical: pines salen hacia abajo
      //   pinAnodo  (anodo, +):  x - 15*s, y + 95*s   (izquierda)
      //   pinCatodo (catodo, −): x + 18*s, y + 95*s   (derecha)
      // CRITICO: aplicar rotPt() para que la rotacion del componente
      // mueva los pines correctamente (rot=90 los pone a la derecha).
      const a = rotPt(cx, cy, -15 * s, 95 * s, rot);
      const b = rotPt(cx, cy,  18 * s, 95 * s, rot);
      return {
        n1: a, n2: b,
        a, b,
        'pin 1': a, 'pin 2': b, pin1: a, pin2: b,
        anodo: a, anode: a, catodo: b, cathode: b,
      };
    }
    // Rectificador / Zener / Señal / Schottky: pines horizontales ±85*s
    const arm = 85 * s;
    const a = rotPt(cx, cy, -arm, 0, rot);
    const b = rotPt(cx, cy,  arm, 0, rot);
    return {
      n1: a, n2: b,
      a: a, b: b,
      'pin 1': a, 'pin 2': b, pin1: a, pin2: b,
      anodo: a, anode: a, catodo: b, cathode: b,
    };
  }


  // Transistores BJT/FET — paquete TO-92.
  // El modelo TransistorTO92 dibuja el cuerpo arriba y las 3 patas saliendo
  // HACIA ABAJO en linea (separación 15·s, longitud 60·s).
  //   Vista frontal (tipica del TO-92):  E — B — C  (de izq. a der.)
  if (t === 'transistor_bjt' || t === 'transistor_fet') {
    const dx = 15 * s, dy = 60 * s;
    const e = rotPt(cx, cy, -dx, dy, rot);
    const b = rotPt(cx, cy,   0, dy, rot);
    const c = rotPt(cx, cy,  dx, dy, rot);
    // resolvePin() lowercasea las claves antes de buscar — todas en minusculas.
    return {
      // Nombres canonicos
      e, b, c,
      // Aliases en español/ingles
      emisor: e, base: b, colector: c,
      emitter: e, collector: c,
      // FET: gate <-> base, drain<->colector, source<->emisor
      gate: b, drain: c, source: e,
      g: b, d: c, s: e,
      // Aliases por numero de pin
      n1: e, n2: b, n3: c,
      'pin 1': e, 'pin 2': b, 'pin 3': c,
      pin1: e, pin2: b, pin3: c,
      // Forma corta con prefijo "n" — backend manda nB/nC/nE → lowercase
      nb: b, nc: c, ne: e, ng: b, nd: c, ns: e,
      // Forma larga con prefijo "n" (por si el backend cambia la convencion)
      nbase: b, ncolector: c, nemisor: e,
      ncollector: c, nemitter: e,
      ngate: b, ndrain: c, nsource: e,
    };
  }

  // Regulador de voltaje — paquete TO-220 (LM7805, LM317…).
  // Reutilizamos el modelo Transistor que tiene la silueta correcta.
  // Pinout estandar (mirando de frente):  Vin — GND — Vout (de izq. a der.)
  if (t === 'regulador_voltaje') {
    const dx = 15 * s, dy = 60 * s;
    const inn = rotPt(cx, cy, -dx, dy, rot);  // entrada → izquierda
    const adj = rotPt(cx, cy,   0, dy, rot);  // GND/ADJ → centro
    const out = rotPt(cx, cy,  dx, dy, rot);  // salida → derecha
    // resolvePin() lowercasea las claves antes de buscar — todas en minusculas.
    return {
      // Nombres canonicos del modelo
      in: inn, out, adj,
      // Aliases lowercased del netlist del admin (que vienen como nIn/nOut/nGnd)
      nin: inn, nout: out, ngnd: adj, nadj: adj,
      // Aliases en español
      entrada: inn, salida: out, tierra: adj, ref: adj,
      // Aliases por numero de pin (para el caso pin_terminal = "Pin 1" etc.)
      n1: inn, n2: adj, n3: out,
      'pin 1': inn, 'pin 2': adj, 'pin 3': out,
      pin1: inn, pin2: adj, pin3: out,
      // Aliases vin/vout (por si el backend los manda así)
      vin: inn, vout: out,
    };
  }

  // fallback
  return { n1: { x: cx, y: cy }, n2: { x: cx, y: cy } };
}

/**
 * Resuelve el pin SVG correcto para una clave dada, tolerante a variaciones
 * ("Pin 1" → "pin1" → "n1"), espacios y mayúsculas.
 */
function resolvePin(pins, pinKey) {
  if (!pinKey) return null;
  const k = String(pinKey).toLowerCase().trim();

  // Match exacto primero
  if (pins[k]) return pins[k];

  // Match sin espacios (ej: "Pin 1" → "pin1")
  const compact = k.replace(/\s+/g, '');
  if (pins[compact]) return pins[compact];

  // Caso especial: "gnd" en un regulador apunta a su pin adj/centro,
  // pero en una fuente apunta al neg. Detectamos por la forma del pins.
  if (compact === 'gnd') {
    if (pins.adj) return pins.adj;        // regulador
    if (pins.neg) return pins.neg;        // fuente
  }

  // Aliases genericos solo si el target existe
  const aliases = {
    pin1: 'n1', pin2: 'n2', pin3: 'n3',
    a: 'n1', b: 'n2',
    positivo: 'pos', negativo: 'neg',
    vcc: 'pos',
    izquierda: 'a', centro: 'w', derecha: 'b',
    izq: 'a', der: 'b', wiper: 'w',
    anodo: 'a', anode: 'a', catodo: 'b', cathode: 'b',
  };
  if (aliases[compact] && pins[aliases[compact]]) return pins[aliases[compact]];

  // Ultimo recurso: el primer pin disponible
  const first = Object.values(pins)[0];
  return first || null;
}

function calcViewBox(netlist) {
  if (!netlist || netlist.length === 0) return '0 0 600 400';
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  netlist.forEach((comp) => {
    const pins = getPins(comp);
    Object.values(pins).forEach((p) => {
      if (!p) return;
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
    });
    const { x, y } = toSVG(comp.position);
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  });
  const margin = 100;
  const w = Math.max(maxX - minX + margin * 2, 400);
  const h = Math.max(maxY - minY + margin * 2, 300);
  return `${minX - margin} ${minY - margin} ${w} ${h}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Calculo de bounding boxes de componentes para evitar que los rieles
// horizontales atraviesen cuerpos.
// ─────────────────────────────────────────────────────────────────────────────
function getComponentBBox(comp) {
  const cx = parseFloat(comp.position?.x ?? 0) * CANVAS_SCALE + OFFSET_X;
  const cy = parseFloat(comp.position?.y ?? 0) * CANVAS_SCALE + OFFSET_Y;
  const rot = comp.rotation ?? 0;
  const t   = comp.type;

  const rotatedBBox = (halfW, halfH) => {
    const corners = [
      rotPt(cx, cy, -halfW, -halfH, rot),
      rotPt(cx, cy,  halfW, -halfH, rot),
      rotPt(cx, cy,  halfW,  halfH, rot),
      rotPt(cx, cy, -halfW,  halfH, rot),
    ];
    return {
      minX: Math.min(...corners.map(c => c.x)),
      maxX: Math.max(...corners.map(c => c.x)),
      minY: Math.min(...corners.map(c => c.y)),
      maxY: Math.max(...corners.map(c => c.y)),
      compId: comp.id,
    };
  };

  if (t === 'resistencia') {
    return rotatedBBox(25 * SCALE_DEFAULT, 9 * SCALE_DEFAULT);
  }
  if (t === 'bobina') {
    const R = 56 * SCALE_DEFAULT;
    return rotatedBBox(R, R);
  }
  if (t === 'resistencia_variable') {
    const R = 28 * SCALE_POT;
    return rotatedBBox(R, R);
  }
  if (t === 'capacitor') {
    const tipoD = (comp.params?.tipo_dioelectrico || '').toLowerCase();
    const esCeramico = tipoD.includes('ceram') || tipoD.includes('cerám');
    if (esCeramico) {
      return rotatedBBox(35 * SCALE_DEFAULT, 39 * SCALE_DEFAULT);
    }
    return rotatedBBox(40 * SCALE_DEFAULT, 30 * SCALE_DEFAULT);
  }
  if (t === 'fuente_voltaje') {
    const esAC = (comp.params?.dcOrAc || '').toLowerCase() === 'ac';
    if (esAC) {
      const R = 60 * SCALE_DEFAULT;
      return rotatedBBox(R, R);
    }
    // Fuente DC con cuerpo desplazado respecto a (cx,cy) por (-80,-60)
    const cxBody = cx + 51.3;
    const cyBody = cy + 4.4;
    const corners = [
      rotPt(cxBody, cyBody, -71.8, -33.6, rot),
      rotPt(cxBody, cyBody,  71.8, -33.6, rot),
      rotPt(cxBody, cyBody,  71.8,  33.6, rot),
      rotPt(cxBody, cyBody, -71.8,  33.6, rot),
    ];
    return {
      minX: Math.min(...corners.map(c => c.x)),
      maxX: Math.max(...corners.map(c => c.x)),
      minY: Math.min(...corners.map(c => c.y)),
      maxY: Math.max(...corners.map(c => c.y)),
      compId: comp.id,
    };
  }
  if (t === 'fuente_corriente') {
    return rotatedBBox(25 * SCALE_DEFAULT, 25 * SCALE_DEFAULT);
  }
  if (t === 'diodo' || t === 'diodo_zener') {
    return rotatedBBox(60 * SCALE_DEFAULT, 25 * SCALE_DEFAULT);
  }
  if (t === 'diodo_led') {
    return rotatedBBox(30 * SCALE_DEFAULT, 50 * SCALE_DEFAULT);
  }
  // Transistor BJT/FET — paquete TO-92: cuerpo redondo + 3 patas hacia abajo.
  // El cuerpo mide ~35×35 a scale=1; las patas se extienden 60 hacia abajo.
  if (t === 'transistor_bjt' || t === 'transistor_fet') {
    const halfW = 22 * SCALE_TO92;
    const halfH = 65 * SCALE_TO92;  // incluye el espacio que ocupan las patas
    // CRÍTICO: rotar las esquinas alrededor de (cx,cy) — el mismo pivote que
    // usa wrapRotation visualmente — no alrededor de (cx, cyBody).
    const offY = halfH - 22 * SCALE_TO92;
    const corners = [
      rotPt(cx, cy, -halfW, offY - halfH, rot),
      rotPt(cx, cy,  halfW, offY - halfH, rot),
      rotPt(cx, cy,  halfW, offY + halfH, rot),
      rotPt(cx, cy, -halfW, offY + halfH, rot),
    ];
    return {
      minX: Math.min(...corners.map(c => c.x)),
      maxX: Math.max(...corners.map(c => c.x)),
      minY: Math.min(...corners.map(c => c.y)),
      maxY: Math.max(...corners.map(c => c.y)),
      compId: comp.id,
    };
  }
  // Regulador de voltaje — paquete TO-220 con disipador metalico arriba.
  if (t === 'regulador_voltaje') {
    const halfW = 30 * SCALE_TO220;
    const halfH = 70 * SCALE_TO220;
    const offY = halfH - 25 * SCALE_TO220;
    const corners = [
      rotPt(cx, cy, -halfW, offY - halfH, rot),
      rotPt(cx, cy,  halfW, offY - halfH, rot),
      rotPt(cx, cy,  halfW, offY + halfH, rot),
      rotPt(cx, cy, -halfW, offY + halfH, rot),
    ];
    return {
      minX: Math.min(...corners.map(c => c.x)),
      maxX: Math.max(...corners.map(c => c.x)),
      minY: Math.min(...corners.map(c => c.y)),
      maxY: Math.max(...corners.map(c => c.y)),
      compId: comp.id,
    };
  }
  // Fallback: bbox conservador
  return rotatedBBox(20 * SCALE_DEFAULT, 20 * SCALE_DEFAULT);
}

/**
 * ¿Una linea horizontal en y=Y, de x1 a x2, atraviesa el bbox de algun
 * componente que NO este en excludeIds?
 */
function busHCollides(busY, x1, x2, bboxes, excludeIds = new Set()) {
  const xLo = Math.min(x1, x2);
  const xHi = Math.max(x1, x2);
  const margin = 1;
  for (const b of bboxes) {
    if (excludeIds.has(b.compId)) continue;
    if (busY < b.minY + margin || busY > b.maxY - margin) continue;
    if (xHi < b.minX || xLo > b.maxX) continue;
    return true;
  }
  return false;
}

/**
 * ¿Una linea vertical en x=X, de y1 a y2, atraviesa el bbox de algun
 * componente que NO este en excludeIds?
 */
function busVCollides(busX, y1, y2, bboxes, excludeIds = new Set()) {
  const yLo = Math.min(y1, y2);
  const yHi = Math.max(y1, y2);
  const margin = 1;
  for (const b of bboxes) {
    if (excludeIds.has(b.compId)) continue;
    if (busX < b.minX + margin || busX > b.maxX - margin) continue;
    if (yHi < b.minY || yLo > b.maxY) continue;
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers para construir cables ortogonales
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Construye una L-shape entre dos puntos eligiendo la "esquina" optima.
 * Devuelve dos segmentos [seg1, seg2] o un unico segmento si comparten X o Y.
 * Cada segmento es { x1, y1, x2, y2 }.
 */
function buildLPath(p1, p2, bboxes, excludeIds) {
  const dx = Math.abs(p2.x - p1.x);
  const dy = Math.abs(p2.y - p1.y);

  // Mismo X → barra vertical
  if (dx < 1.5) {
    return [{ x1: p1.x, y1: p1.y, x2: p1.x, y2: p2.y }];
  }
  // Mismo Y → barra horizontal
  if (dy < 1.5) {
    return [{ x1: p1.x, y1: p1.y, x2: p2.x, y2: p1.y }];
  }

  // Dos opciones de codo:
  //   Opcion A: vertical primero — codo en (p1.x, p2.y)
  //   Opcion B: horizontal primero — codo en (p2.x, p1.y)
  const optA = [
    { x1: p1.x, y1: p1.y, x2: p1.x, y2: p2.y },           // V de p1 a p2.y
    { x1: p1.x, y1: p2.y, x2: p2.x, y2: p2.y },           // H hasta p2
  ];
  const optB = [
    { x1: p1.x, y1: p1.y, x2: p2.x, y2: p1.y },           // H hasta p2.x
    { x1: p2.x, y1: p1.y, x2: p2.x, y2: p2.y },           // V hasta p2
  ];

  const collidesA =
    busVCollides(p1.x, p1.y, p2.y, bboxes, excludeIds) ||
    busHCollides(p2.y, p1.x, p2.x, bboxes, excludeIds);
  const collidesB =
    busHCollides(p1.y, p1.x, p2.x, bboxes, excludeIds) ||
    busVCollides(p2.x, p1.y, p2.y, bboxes, excludeIds);

  if (!collidesA) return optA;
  if (!collidesB) return optB;

  // Ambas chocan: intentar un "z-shape" sacando el codo intermedio fuera.
  // Probar Y intermedio por arriba y por abajo de los bboxes solapantes.
  const candidates = [];
  bboxes.forEach((b) => {
    if (excludeIds.has(b.compId)) return;
    candidates.push(b.minY - 16);
    candidates.push(b.maxY + 16);
  });
  candidates.push((p1.y + p2.y) / 2);

  for (const yMid of candidates) {
    const segs = [
      { x1: p1.x, y1: p1.y, x2: p1.x, y2: yMid },
      { x1: p1.x, y1: yMid, x2: p2.x, y2: yMid },
      { x1: p2.x, y1: yMid, x2: p2.x, y2: p2.y },
    ];
    const ok =
      !busVCollides(p1.x, p1.y, yMid, bboxes, excludeIds) &&
      !busHCollides(yMid, p1.x, p2.x, bboxes, excludeIds) &&
      !busVCollides(p2.x, yMid, p2.y, bboxes, excludeIds);
    if (ok) return segs;
  }

  // Ultimo recurso: optA
  return optA;
}

// ─────────────────────────────────────────────────────────────────────────────
// WireLayer — Cables ortogonales que conectan en los terminales reales.
//
// Algoritmo:
//   • 2 pines  → L-shape (con desvio en Z si ambos codos chocan).
//   • 3+ pines → Peine ortogonal: barra horizontal a Y modal/mediana
//                + stubs verticales desde cada pin.
//   • GND      → barra al ymax (riel inferior).
//   • Si la barra atraviesa un componente que NO pertenece al nodo,
//     se mueve hacia arriba o abajo hasta encontrar una banda libre.
//   • Solo segmentos H/V — nunca diagonales. 
// ─────────────────────────────────────────────────────────────────────────────
function WireLayer({ netlist }) {

  // 1) Recolectar pines por nodo y bboxes de componentes
  const nodeMap = new Map();
  const allBBoxes = [];
  netlist.forEach((comp) => {
    const pins = getPins(comp);
    Object.entries(comp.nodes ?? {}).forEach(([pinKey, pinData]) => {
      const nodoNum = getNodoNum(pinData);
      if (!nodoNum) return;
      const pinPos = resolvePin(pins, pinKey);
      if (!pinPos) return;
      if (!nodeMap.has(nodoNum)) nodeMap.set(nodoNum, []);
      nodeMap.get(nodoNum).push({ ...pinPos, compId: comp.id, pinKey });
    });
    allBBoxes.push(getComponentBBox(comp));
  });

  const lines = [];
  const dots  = [];

  // 2) Para cada nodo, dibujar conexiones ortogonales
  nodeMap.forEach((pins, nodo) => {
    if (pins.length < 2) return;

    const isGnd = nodo === '0';
    const color = isGnd ? '#64748b' : '#cbd5e1';
    const dash  = isGnd ? '5 4' : undefined;
    const width = isGnd ? 1.5 : 2;
    const opacity = isGnd ? 0.7 : 0.95;

    const ownCompIds = new Set(pins.map((p) => p.compId));

    // ── Caso 2 pines: L-shape (con anti-colision) ──
    if (pins.length === 2 && !isGnd) {
      const segs = buildLPath(pins[0], pins[1], allBBoxes, ownCompIds);
      segs.forEach((seg, i) => {
        lines.push(
          <line key={`n${nodo}-seg-${i}`}
            x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
            stroke={color} strokeWidth={width}
            strokeLinecap="round" strokeDasharray={dash} opacity={opacity}
          />
        );
      });
      return;
    }

    const xs = pins.map((p) => p.x);
    const ys = pins.map((p) => p.y);
    const xRange = Math.max(...xs) - Math.min(...xs);
    const yRange = Math.max(...ys) - Math.min(...ys);

    // ── Caso 1: barra vertical (todos comparten X) ──
    if (xRange < 4 && yRange > 4) {
      const x0 = pins[0].x;
      const ymin = Math.min(...ys);
      const ymax = Math.max(...ys);
      lines.push(
        <line key={`n${nodo}-vbar`}
          x1={x0} y1={ymin} x2={x0} y2={ymax}
          stroke={color} strokeWidth={width}
          strokeLinecap="round" strokeDasharray={dash} opacity={opacity}
        />
      );
      return;
    }

    // ── Caso 2: barra horizontal (todos comparten Y) ──
    if (yRange < 4 && xRange > 4) {
      const y0 = pins[0].y;
      const xmin = Math.min(...xs);
      const xmax = Math.max(...xs);
      lines.push(
        <line key={`n${nodo}-hbar`}
          x1={xmin} y1={y0} x2={xmax} y2={y0}
          stroke={color} strokeWidth={width}
          strokeLinecap="round" strokeDasharray={dash} opacity={opacity}
        />
      );
      return;
    }

    // ── Caso 3 (general, 3+ pines): peine ortogonal ──
    let busY;
    if (isGnd) {
      // GND siempre va al riel inferior, BAJO los cuerpos de los componentes
      // que comparten X-range — esto evita que el riel "rasque" la base
      // de un resistor vertical o de un capacitor.
      const xLo = Math.min(...xs);
      const xHi = Math.max(...xs);
      let yMaxBody = Math.max(...ys);
      for (const b of allBBoxes) {
        if (xHi < b.minX || xLo > b.maxX) continue;
        if (b.maxY > yMaxBody) yMaxBody = b.maxY;
      }
      busY = yMaxBody + 28;
    } else {
      // Y modal entre los pines (≥2 coincidencias) o mediana en su defecto.
      const yCount = new Map();
      pins.forEach(p => {
        const yKey = Math.round(p.y);
        yCount.set(yKey, (yCount.get(yKey) || 0) + 1);
      });
      let modalY = pins[0].y, modalCount = 0;
      yCount.forEach((cnt, yk) => {
        if (cnt > modalCount) { modalCount = cnt; modalY = yk; }
      });
      if (modalCount >= 2) {
        busY = modalY;
      } else {
        const sortedYs = [...ys].sort((a, b) => a - b);
        busY = sortedYs[Math.floor(sortedYs.length / 2)];
      }
    }

    const xmin = Math.min(...xs);
    const xmax = Math.max(...xs);

    // ── Anti-colision: si la barra atraviesa cuerpos no-propios, moverla.
    if (!isGnd && busHCollides(busY, xmin, xmax, allBBoxes, ownCompIds)) {
      const CLEARANCE = 24;
      let bestY = null;

      // Estrategia A: rangos Y "grandes" (>=80) → bus por encima del pin mas alto
      if (yRange >= 80) {
        const yMinPin = Math.min(...ys);
        const candidate = yMinPin - CLEARANCE;
        if (!busHCollides(candidate, xmin, xmax, allBBoxes, ownCompIds)) {
          bestY = candidate;
        }
      }

      // Estrategia B: bbox-top mas cercano - clearance
      if (bestY === null) {
        let topMostY = Infinity;
        for (const b of allBBoxes) {
          if (ownCompIds.has(b.compId)) continue;
          if (xmax < b.minX || xmin > b.maxX) continue;
          if (b.minY < topMostY) topMostY = b.minY;
        }
        if (topMostY !== Infinity) {
          const candidate = topMostY - CLEARANCE;
          if (!busHCollides(candidate, xmin, xmax, allBBoxes, ownCompIds)) {
            bestY = candidate;
          }
        }
      }

      // Estrategia C: por debajo de todo
      if (bestY === null) {
        let bottomMostY = -Infinity;
        for (const b of allBBoxes) {
          if (ownCompIds.has(b.compId)) continue;
          if (xmax < b.minX || xmin > b.maxX) continue;
          if (b.maxY > bottomMostY) bottomMostY = b.maxY;
        }
        if (bottomMostY !== -Infinity) {
          const candidate = bottomMostY + CLEARANCE;
          if (!busHCollides(candidate, xmin, xmax, allBBoxes, ownCompIds)) {
            bestY = candidate;
          }
        }
      }
      if (bestY !== null) busY = bestY;
    }

    // Riel horizontal a busY
    lines.push(
      <line key={`n${nodo}-bus`}
        x1={xmin} y1={busY} x2={xmax} y2={busY}
        stroke={color} strokeWidth={width}
        strokeLinecap="round" strokeDasharray={dash} opacity={opacity}
      />
    );

    // Stubs verticales desde cada pin al riel
    pins.forEach((p, i) => {
      if (Math.abs(p.y - busY) < 1.5) return;
      lines.push(
        <line key={`n${nodo}-stub-${i}`}
          x1={p.x} y1={p.y} x2={p.x} y2={busY}
          stroke={color} strokeWidth={width}
          strokeLinecap="round" strokeDasharray={dash} opacity={opacity}
        />
      );
    });

    // Punto de union cuando 3+ pines coinciden electricamente
    if (!isGnd && pins.length >= 3) {
      pins.forEach((p, i) => {
        if (Math.abs(p.y - busY) > 1.5) {
          dots.push({ x: p.x, y: busY, key: `n${nodo}-dot-${i}` });
        }
      });
    }
  });

  return (
    <g className="wires">
      {lines}
      {dots.map((d) => (
        <circle key={d.key} cx={d.x} cy={d.y} r={3}
          fill="#cbd5e1" opacity={0.9} />
      ))}
    </g>
  );
}

function GndSymbol({ x, y }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <line x1={0}  y1={0}  x2={0}  y2={12} stroke="#4a5568" strokeWidth={2} />
      <line x1={-10} y1={12} x2={10} y2={12} stroke="#4a5568" strokeWidth={2} />
      <line x1={-6}  y1={17} x2={6}  y2={17} stroke="#4a5568" strokeWidth={1.5} />
      <line x1={-2}  y1={22} x2={2}  y2={22} stroke="#4a5568" strokeWidth={1} />
    </g>
  );
}

function FallbackComp({ comp, x, y }) {
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

function renderComponent(comp, energized = false) {
  const { x, y } = toSVG(comp.position);
  const rotation  = comp.rotation ?? 0;
  const valueNum  = parseNotation(comp.value) || 0;
  const orientation = (rotation === 90 || rotation === 270) ? 'vertical' : 'horizontal';
  const wrapRotation = rotation ? `rotate(${rotation}, ${x}, ${y})` : undefined;

  switch (comp.type) {
    case 'resistencia':
      return (
        <g key={comp.id} transform={wrapRotation}>
          <Resistor x={x} y={y} scale={SCALE_DEFAULT} componentId={comp.id} initialValue={valueNum} />
        </g>
      );
    case 'resistencia_variable':
      return (
        <g key={comp.id} transform={wrapRotation}>
          <Potentiometer x={x} y={y} scale={SCALE_POT} componentId={comp.id} initialValue={valueNum} />
        </g>
      );
    case 'capacitor': {
      const tipoD = (comp.params?.tipo_dioelectrico || '').toLowerCase();
      const esCeramico = tipoD.includes('ceram') || tipoD.includes('cerám');
      if (esCeramico) {
        return (
          <CapacitorCeramico key={comp.id} x={x} y={y} scale={SCALE_DEFAULT}
            rotation={rotation} componentId={comp.id} initialValue={valueNum} />
        );
      }
      return (
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
        // El "value" del LED es su COLOR (ej. 'VERDE', 'ROJO').
        // IMPORTANTE: el LED maneja su propia rotación INTERNAMENTE — NO se
        // envuelve en wrapRotation porque eso causaba desincronización entre
        // las patas dibujadas y los pines reportados por getPins().
        return (
          <g key={comp.id}>
            <LED x={x} y={y} scale={SCALE_DEFAULT} rotation={rotation}
              componentId={comp.id}
              initialColor={comp.value || 'VERDE'}
              energized={energized}/>
          </g>
        );
      }
      return (
        <g key={comp.id} transform={wrapRotation}>
          <DiodoRectificador x={x} y={y} scale={SCALE_DEFAULT} orientation={orientation}
            componentId={comp.id} initialValue={valueNum} />
        </g>
      );
    }
    case 'transistor_bjt':
    case 'transistor_fet':
      return (
        <g key={comp.id} transform={wrapRotation}>
          <TransistorTO92 x={x} y={y} scale={SCALE_TO92} componentId={comp.id} />
        </g>
      );
    case 'regulador_voltaje': {
      // Mostrar voltaje de salida (ej: 5V para LM7805) en lugar de β
      const vOut = parseFloat(comp.params?.voltaje_salida ?? comp.value ?? 5) || 5;
      return (
        <g key={comp.id} transform={wrapRotation}>
          <Transistor x={x} y={y} scale={SCALE_TO220} componentId={comp.id}
            labelType="vreg" initialValue={vOut} />
        </g>
      );
    }
    default:
      return <FallbackComp key={comp.id} comp={comp} x={x} y={y} />;
  }
}

export function NetlistRenderer({ netlist, preview = false, energized = false }) {
  if (!netlist || netlist.length === 0) {
    return (
      <svg width="100%" height={preview ? 120 : 300}
        style={{ background: '#16181d', borderRadius: 8 }}>
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
          fill="#333" fontSize={12} fontFamily="monospace">
          Sin netlist disponible
        </text>
      </svg>
    );
  }

  const viewBox = calcViewBox(netlist);

  // Recolectar pin GND mas bajo para anclar el simbolo de tierra
  const gndPins = [];
  netlist.forEach((comp) => {
    const pins = getPins(comp);
    Object.entries(comp.nodes ?? {}).forEach(([pinKey, pinData]) => {
      if (getNodoNum(pinData) === '0') {
        const p = resolvePin(pins, pinKey);
        if (p) gndPins.push({ x: p.x, y: p.y });
      }
    });
  });
  const gndAnchor = gndPins.length > 0
    ? gndPins.reduce((acc, p) => (p.y > acc.y ? p : acc), gndPins[0])
    : null;

  return (
    <svg width="100%" height={preview ? 120 : '100%'} viewBox={viewBox}
      style={{ background: '#16181d', borderRadius: 8, minHeight: preview ? 120 : 280 }}>
      <defs>
        <pattern id="grid" width={CANVAS_SCALE * 50} height={CANVAS_SCALE * 50}
          patternUnits="userSpaceOnUse">
          <path d={`M ${CANVAS_SCALE*50} 0 L 0 0 0 ${CANVAS_SCALE*50}`}
            fill="none" stroke="#1e2028" strokeWidth={0.5} />
        </pattern>
      </defs>
      <rect x="-10000" y="-10000" width="20000" height="20000" fill="url(#grid)" />

      <WireLayer netlist={netlist} />

      {!preview && gndAnchor && (
        <GndSymbol x={gndAnchor.x} y={gndAnchor.y + 18} />
      )}

      {netlist.map((comp) => renderComponent(comp, energized))}

      {!preview && netlist.map((comp) => {
        const pins = getPins(comp);
        return Object.entries(comp.nodes ?? {}).map(([pinKey, pinData]) => {
          const nodo = getNodoNum(pinData);
          if (!nodo || nodo === '0') return null;
          const p = resolvePin(pins, pinKey);
          if (!p) return null;
          return (
            <text key={`${comp.id}-${pinKey}-label`}
              x={p.x + 6} y={p.y - 4} textAnchor="start"
              fontSize={16} fill="#ffffff" fontFamily="monospace"
              fontWeight="700" opacity={1}>
              {nodo}
            </text>
          );
        });
      })}
    </svg>
  );
}
