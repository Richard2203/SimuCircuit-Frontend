import {
  DIGIT_COLORS,
  MULTIPLIER_COLORS,
  TOLERANCE_COLORS,
  bandsToOhms,
  getHex,
} from '../../Simulator/models/resistorColorCodes.js';

/**
 * SelectorBandasColor — Selector visual de bandas de color para resistencias.
 *
 * @param {{
 *   banda_uno: string,
 *   banda_dos: string,
 *   banda_tres: string,
 *   banda_tolerancia: string,
 *   value: string,
 *   onBandasChange: (b: object) => void,
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
    const nuevasBandas = {
      banda_uno, banda_dos, banda_tres, banda_tolerancia,
      [campo]: nuevoValor,
    };
    onBandasChange(nuevasBandas);
    const ohms = bandsToOhms(
      nuevasBandas.banda_uno,
      nuevasBandas.banda_dos,
      nuevasBandas.banda_tres
    );
    if (ohms > 0) onValueChange(String(ohms));
  }

  // Cuando cambia el valor textual → mejor aproximacion de bandas
  function handleValueInput(rawVal) {
    onValueChange(rawVal);
    const parsed = parseValueToOhms(rawVal);
    if (parsed !== null && parsed > 0) {
      const bandas = ohmsToBandasEspanol(parsed);
      if (bandas) onBandasChange(bandas);
    }
  }

  const ohmsActual = bandsToOhms(banda_uno, banda_dos, banda_tres);

  return (
    <div className="admin-bandsel">
      <p className="admin-bandsel__label">Código de colores (IEC 60062)</p>

      {/* Preview visual */}
      <div className="admin-bandsel__preview">
        <ResistorPreview b1={banda_uno} b2={banda_dos} b3={banda_tres} bt={banda_tolerancia} />
        <span className="admin-bandsel__ohms">
          {ohmsActual > 0 ? formatOhms(ohmsActual) : '—'}
        </span>
      </div>

      {/* Selectores */}
      <div className="admin-bandsel__grid">
        <BandaSelect
          label="Banda 1 (1er dígito)" options={DIGIT_COLORS}
          selected={banda_uno} onChange={(v) => handleBanda('banda_uno', v)}
        />
        <BandaSelect
          label="Banda 2 (2do dígito)" options={DIGIT_COLORS}
          selected={banda_dos} onChange={(v) => handleBanda('banda_dos', v)}
        />
        <BandaSelect
          label="Banda 3 (multiplicador)" options={MULTIPLIER_COLORS}
          selected={banda_tres} onChange={(v) => handleBanda('banda_tres', v)}
        />
        <BandaSelect
          label="Tolerancia" options={TOLERANCE_COLORS}
          selected={banda_tolerancia} onChange={(v) => handleBanda('banda_tolerancia', v)}
        />
      </div>

      {/* Valor textual sincronizado */}
      <div className="admin-bandsel__valuewrap">
        <label className="admin-form-label">Valor Ω (editable)</label>
        <input
          type="text"
          className="admin-input"
          value={value}
          onChange={(e) => handleValueInput(e.target.value)}
          placeholder="ej. 330, 1k, 10k"
        />
      </div>
    </div>
  );
}

/* ── Helpers locales ──────────────────────────────── */

/** Formatea Ω → string legible: 1.5kΩ, 2.2MΩ, 330Ω */
function formatOhms(ohms) {
  if (ohms >= 1_000_000) return `${(ohms / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}MΩ`;
  if (ohms >= 1_000)     return `${(ohms / 1_000).toFixed(1).replace(/\.?0+$/, '')}kΩ`;
  return `${ohms}Ω`;
}

/** Parsea "1k", "330", "10kΩ" → número en Ω */
function parseValueToOhms(str) {
  if (!str) return null;
  const cleaned = String(str).trim().toLowerCase();
  const match   = cleaned.match(/^([0-9]*\.?[0-9]+)\s*([kmg]?)\s*(?:ohm|ohms|Ω)?$/i);
  if (!match) return null;
  const num    = parseFloat(match[1]);
  const suffix = match[2];
  const mult   = { k: 1e3, m: 1e6, g: 1e9, '': 1 }[suffix] ?? 1;
  return num * mult;
}
function ohmsToBandasEspanol(ohms) {
  let bestErr = Infinity;
  let best = null;

  for (const m of MULTIPLIER_COLORS) {
    const base = ohms / m.factor;
    const d1   = Math.floor(base / 10);
    const d2   = Math.round(base % 10);
    if (d1 < 1 || d1 > 9) continue;
    const reconstructed = (d1 * 10 + d2) * m.factor;
    const err = Math.abs(reconstructed - ohms);
    if (err < bestErr) {
      bestErr = err;
      best = { d1, d2, mul: m };
    }
  }

  if (!best) return null;

  return {
    banda_uno:  DIGIT_COLORS.find((c) => c.digit === best.d1)?.es ?? 'Negro',
    banda_dos:  DIGIT_COLORS.find((c) => c.digit === best.d2)?.es ?? 'Negro',
    banda_tres: best.mul.es,
    banda_tolerancia: 'Dorado',
  };
}

/* ── Componentes auxiliares ──────────────────────── */

function BandaSelect({ label, options, selected, onChange }) {
  const hex = getHex(selected);
  return (
    <div>
      <label className="admin-form-label">{label}</label>
      <div className="admin-bandsel__selectrow">
        <span
          className="admin-bandsel__swatch"
          style={{ background: hex }}
          aria-hidden="true"
        />
        <select
          className="admin-select admin-bandsel__select"
          value={selected}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((c) => (
            <option key={c.es} value={c.es}>{c.es}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

/** Vista previa visual con el cuerpo de la resistencia y sus bandas */
function ResistorPreview({ b1, b2, b3, bt }) {
  const h1 = getHex(b1);
  const h2 = getHex(b2);
  const h3 = getHex(b3);
  const ht = getHex(bt);

  return (
    <svg width="120" height="28" viewBox="0 0 120 28">
      <line x1="0"   y1="14" x2="20"  y2="14" stroke="#aaa" strokeWidth="1.5"/>
      <line x1="100" y1="14" x2="120" y2="14" stroke="#aaa" strokeWidth="1.5"/>
      <rect x="20" y="7" width="80" height="14" rx="3" fill="#e1c18e" stroke="#b5924a" strokeWidth="0.5"/>
      <rect x="32" y="7" width="7"  height="14" fill={h1} opacity="0.9"/>
      <rect x="43" y="7" width="7"  height="14" fill={h2} opacity="0.9"/>
      <rect x="54" y="7" width="7"  height="14" fill={h3} opacity="0.9"/>
      <rect x="72" y="7" width="7"  height="14" fill={ht} opacity="0.9"/>
    </svg>
  );
}
