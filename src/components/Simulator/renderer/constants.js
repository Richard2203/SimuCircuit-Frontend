/**
 * Escalas visuales y offsets del canvas SVG del simulador.
 */

/** Factor de escala global: unidades de diseño -> pixeles SVG */
export const CANVAS_SCALE = 1.8;

/** Offset de origen del canvas en X e Y */
export const OFFSET_X = 60;
export const OFFSET_Y = 60;

/** Escalas visuales por tipo de paquete/componente */
export const SCALE_DEFAULT = 0.38;  // pasivos genericos (R, C, L, diodos, fuentes)
export const SCALE_POT     = 0.75;  // potenciometro
export const SCALE_TO220   = 0.70;  // regulador de voltaje (paquete TO-220)
export const SCALE_TO92    = 1.50;  // transistor BJT/FET (paquete TO-92)

/**
 * Devuelve la escala visual correspondiente a un tipo de componente.
 *
 * @param {string} type
 * @returns {number}
 */
export function scaleFor(type) {
  if (type === 'resistencia_variable')                            return SCALE_POT;
  if (type === 'regulador_voltaje')                               return SCALE_TO220;
  if (type === 'transistor_bjt' || type === 'transistor_fet')     return SCALE_TO92;
  return SCALE_DEFAULT;
}
