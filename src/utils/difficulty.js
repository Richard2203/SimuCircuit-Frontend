/**
 * utils/difficulty.js
 * Helpers para el manejo visual de niveles de dificultad.
 */

export const DIFFICULTY_STYLES = {
  Fácil:      { className: 'badge-facil',      label: 'Fácil' },
  Intermedio: { className: 'badge-intermedio', label: 'Intermedio' },
  Difícil:    { className: 'badge-dificil',    label: 'Difícil' },
};

/**
 * Retorna el className CSS para una dificultad dada.
 * @param {string} difficulty
 * @returns {string}
 */
export function getDifficultyClass(difficulty) {
  return DIFFICULTY_STYLES[difficulty]?.className ?? 'badge-intermedio';
}
