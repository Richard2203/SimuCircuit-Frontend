/**
 * utils/difficulty.js
 * Helpers para el manejo visual de niveles de dificultad.
 *
 * Soporta los valores del dataset local (Fácil/Intermedio/Difícil)
 * y los valores que devuelve la API de la BD (Básico/Intermedio/Avanzado).
 */

export const DIFFICULTY_STYLES = {
  // Dataset local
  Fácil:      { className: 'badge-facil',      label: 'Fácil'      },
  Intermedio: { className: 'badge-intermedio', label: 'Intermedio' },
  Difícil:    { className: 'badge-dificil',    label: 'Difícil'    },
  // Valores de la BD / API
  Básico:     { className: 'badge-facil',      label: 'Básico'     },
  Avanzado:   { className: 'badge-dificil',    label: 'Avanzado'   },
};

/**
 * Retorna el className CSS para una dificultad dada.
 * @param {string} difficulty
 * @returns {string}
 */
export function getDifficultyClass(difficulty) {
  return DIFFICULTY_STYLES[difficulty]?.className ?? 'badge-intermedio';
}

/**
 * Retorna el label legible para una dificultad dada.
 * @param {string} difficulty
 * @returns {string}
 */
export function getDifficultyLabel(difficulty) {
  return DIFFICULTY_STYLES[difficulty]?.label ?? difficulty ?? '';
}
