import { useEffect } from 'react';

/**
 * Tabla de colores IEC 60062 para resistencias de 3 bandas + tolerancia.
 * banda_uno / banda_dos  → digito significativo
 * banda_tres             → multiplicador (potencia de 10)
 * banda_tolerancia       → tolerancia porcentual
 */
const BANDAS_DIGITO = [
  { nombre: 'Negro',   valor: 0, hex: '#1a1a1a' },
  { nombre: 'Marrón',  valor: 1, hex: '#8B4513' },
  { nombre: 'Rojo',    valor: 2, hex: '#CC0000' },
  { nombre: 'Naranja', valor: 3, hex: '#FF7700' },
  { nombre: 'Amarillo',valor: 4, hex: '#FFD700' },
  { nombre: 'Verde',   valor: 5, hex: '#007700' },
  { nombre: 'Azul',    valor: 6, hex: '#0000CC' },
  { nombre: 'Morado',  valor: 7, hex: '#8B008B' },
  { nombre: 'Gris',    valor: 8, hex: '#808080' },
  { nombre: 'Blanco',  valor: 9, hex: '#E8E8E8' },
];

const BANDAS_MULTIPLICADOR = [
  { nombre: 'Negro',   factor: 1,       hex: '#1a1a1a' },
  { nombre: 'Marrón',  factor: 10,      hex: '#8B4513' },
  { nombre: 'Rojo',    factor: 100,     hex: '#CC0000' },
  { nombre: 'Naranja', factor: 1000,    hex: '#FF7700' },
  { nombre: 'Amarillo',factor: 10000,   hex: '#FFD700' },
  { nombre: 'Verde',   factor: 100000,  hex: '#007700' },
  { nombre: 'Azul',    factor: 1000000, hex: '#0000CC' },
  { nombre: 'Dorado',  factor: 0.1,     hex: '#CFB53B' },
  { nombre: 'Plateado',factor: 0.01,    hex: '#C0C0C0' },
];

const BANDAS_TOLERANCIA = [
  { nombre: 'Marrón',  pct: '±1%',   hex: '#8B4513' },
  { nombre: 'Rojo',    pct: '±2%',   hex: '#CC0000' },
  { nombre: 'Verde',   pct: '±0.5%', hex: '#007700' },
  { nombre: 'Azul',    pct: '±0.25%',hex: '#0000CC' },
  { nombre: 'Morado',  pct: '±0.1%', hex: '#8B008B' },
  { nombre: 'Gris',    pct: '±0.05%',hex: '#808080' },
  { nombre: 'Dorado',  pct: '±5%',   hex: '#CFB53B' },
  { nombre: 'Plateado',pct: '±10%',  hex: '#C0C0C0' },
];

/** Calcula valor Ω a partir de las 4 bandas */
function bandasAOhms(b1, b2, b3, bt) {
  const d1  = BANDAS_DIGITO.find((b) => b.nombre === b1)?.valor ?? 0;
  const d2  = BANDAS_DIGITO.find((b) => b.nombre === b2)?.valor ?? 0;
  const mul = BANDAS_MULTIPLICADOR.find((b) => b.nombre === b3)?.factor ?? 1;
  return (d1 * 10 + d2) * mul;
}

/** Formatea Ω → string legible */
function formatOhms(ohms) {
  if (ohms >= 1_000_000) return `${(ohms / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}MΩ`;
  if (ohms >= 1_000)     return `${(ohms / 1_000).toFixed(1).replace(/\.?0+$/, '')}kΩ`;
  return `${ohms}Ω`;
}

/** Convierte valor numerico en Ω → bandas */
function ohmsABandas(ohms) {
  if (!ohms || ohms <= 0) return { b1: 'Negro', b2: 'Negro', b3: 'Negro', bt: 'Dorado' };

  // Encontrar multiplicador optimo
  let bestFactor = null;
  let bestBand   = null;
  let minError   = Infinity;

  for (const m of BANDAS_MULTIPLICADOR) {
    const base = ohms / m.factor;
    const d1   = Math.floor(base / 10);
    const d2   = Math.round(base % 10);
    if (d1 < 1 || d1 > 9) continue;
    const reconstructed = (d1 * 10 + d2) * m.factor;
    const error = Math.abs(reconstructed - ohms);
    if (error < minError) {
      minError = error;
      bestFactor = m.factor;
      bestBand   = m.nombre;
    }
  }

  if (bestFactor === null) return { b1: 'Negro', b2: 'Negro', b3: 'Negro', bt: 'Dorado' };

  const base = ohms / bestFactor;
  const d1   = Math.floor(base / 10);
  const d2   = Math.round(base % 10);

  const nb1 = BANDAS_DIGITO.find((b) => b.valor === d1)?.nombre ?? 'Negro';
  const nb2 = BANDAS_DIGITO.find((b) => b.valor === d2)?.nombre ?? 'Negro';

  return { b1: nb1, b2: nb2, b3: bestBand, bt: 'Dorado' };
}

/**
 * SelectorBandasColor — Selector visual de bandas de color para resistencias.
 * Bidireccional: cambiar bandas actualiza value, y cambiar value actualiza bandas.
 *
 * @param {{
 *   banda_uno: string,
 *   banda_dos: string,
 *   banda_tres: string,
 *   banda_tolerancia: string,
 *   value: string,              ← valor en Ω (string, ej "330", "11k")
 *   onBandasChange: (b) => void,
 *   onValueChange: (v: string) => void,
 * }} props
 */
export function SelectorBandasColor({
  banda_uno        = 'Marrón',
  banda_dos        = 'Negro',
  banda_tres       = 'Marrón',
  banda_tolerancia = 'Dorado',
  value = '',
  onBandasChange,
  onValueChange,
}) {
  // Cuando cambian las bandas → calcular value
  function handleBanda(campo, nuevoValor) {
    const newBandas = {
      banda_uno, banda_dos, banda_tres, banda_tolerancia,
      [campo]: nuevoValor,
    };
    onBandasChange(newBandas);
    const ohms = bandasAOhms(
      newBandas.banda_uno, newBandas.banda_dos,
      newBandas.banda_tres, newBandas.banda_tolerancia
    );
    if (ohms > 0) onValueChange(String(ohms));
  }

  // Cuando cambia el valor textual → actualizar bandas
  function handleValueInput(rawVal) {
    onValueChange(rawVal);
    const parsed = parseValueToOhms(rawVal);
    if (parsed !== null && parsed > 0) {
      const { b1, b2, b3, bt } = ohmsABandas(parsed);
      onBandasChange({ banda_uno: b1, banda_dos: b2, banda_tres: b3, banda_tolerancia: bt });
    }
  }

  const ohmsActual = bandasAOhms(banda_uno, banda_dos, banda_tres, banda_tolerancia);

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 14, marginBottom: 10 }}>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Código de colores (IEC 60062)
      </p>

      {/* Preview visual de la resistencia con bandas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, justifyContent: 'center' }}>
        <ResistorPreview
          b1={banda_uno} b2={banda_dos} b3={banda_tres} bt={banda_tolerancia}
        />
        <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
          {ohmsActual > 0 ? formatOhms(ohmsActual) : '—'}
        </span>
      </div>

      {/* Selectores de banda */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <BandaSelect label="Banda 1 (1er dígito)" options={BANDAS_DIGITO} selected={banda_uno}
          onChange={(v) => handleBanda('banda_uno', v)} />
        <BandaSelect label="Banda 2 (2do dígito)" options={BANDAS_DIGITO} selected={banda_dos}
          onChange={(v) => handleBanda('banda_dos', v)} />
        <BandaSelect label="Banda 3 (multiplicador)" options={BANDAS_MULTIPLICADOR} selected={banda_tres}
          onChange={(v) => handleBanda('banda_tres', v)} />
        <BandaSelect label="Tolerancia" options={BANDAS_TOLERANCIA} selected={banda_tolerancia}
          onChange={(v) => handleBanda('banda_tolerancia', v)} />
      </div>

      {/* Campo value sincronizado */}
      <div style={{ marginTop: 12 }}>
        <label style={labelSt}>Valor Ω (editable)</label>
        <input
          type="text"
          value={value}
          onChange={(e) => handleValueInput(e.target.value)}
          placeholder="ej. 330, 1k, 10k"
          style={inputSt}
        />
      </div>
    </div>
  );
}

/** Convierte string con sufijos (k, M, m, u, n, p) a número */
function parseValueToOhms(str) {
  if (!str) return null;
  const cleaned = str.trim().toLowerCase();
  const match   = cleaned.match(/^([0-9]*\.?[0-9]+)\s*([kmg]?)$/);
  if (!match) return null;
  const num    = parseFloat(match[1]);
  const suffix = match[2];
  const mult   = { k: 1e3, m: 1e6, g: 1e9, '': 1 }[suffix] ?? 1;
  return num * mult;
}

/** Dropdown de banda con preview de color */
function BandaSelect({ label, options, selected, onChange }) {
  const hex = options.find((o) => o.nombre === selected)?.hex ?? '#888';
  return (
    <div>
      <label style={labelSt}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: hex, flexShrink: 0, border: '1px solid rgba(255,255,255,0.15)' }} />
        <select value={selected} onChange={(e) => onChange(e.target.value)} style={selectSt}>
          {options.map((o) => (
            <option key={o.nombre} value={o.nombre}>{o.nombre}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

/** Representacion visual simple de la resistencia con sus bandas */
function ResistorPreview({ b1, b2, b3, bt }) {
  const getHex = (name, opts) => opts.find((o) => o.nombre === name)?.hex ?? '#888';
  const h1 = getHex(b1, BANDAS_DIGITO);
  const h2 = getHex(b2, BANDAS_DIGITO);
  const h3 = getHex(b3, BANDAS_MULTIPLICADOR);
  const ht = getHex(bt, BANDAS_TOLERANCIA);

  return (
    <svg width="120" height="28" viewBox="0 0 120 28">
      {/* Cables */}
      <line x1="0" y1="14" x2="20" y2="14" stroke="#aaa" strokeWidth="1.5"/>
      <line x1="100" y1="14" x2="120" y2="14" stroke="#aaa" strokeWidth="1.5"/>
      {/* Cuerpo */}
      <rect x="20" y="7" width="80" height="14" rx="3" fill="#e1c18e" stroke="#b5924a" strokeWidth="0.5"/>
      {/* Bandas */}
      <rect x="32" y="7" width="7" height="14" fill={h1} opacity="0.9"/>
      <rect x="43" y="7" width="7" height="14" fill={h2} opacity="0.9"/>
      <rect x="54" y="7" width="7" height="14" fill={h3} opacity="0.9"/>
      <rect x="72" y="7" width="7" height="14" fill={ht} opacity="0.9"/>
    </svg>
  );
}

const labelSt  = { display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 };
const selectSt = {
  flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  borderRadius: 'var(--r-sm)', color: 'var(--text)', fontSize: 12,
  padding: '5px 8px', outline: 'none',
};
const inputSt = {
  width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)', color: 'var(--text)', fontSize: 13,
  padding: '7px 10px', outline: 'none',
};
