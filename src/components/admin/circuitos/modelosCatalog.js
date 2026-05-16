/**
 * modelosCatalog.js — Catalogo de modelos predeterminados (datasheets).
 *
 * Los transistores BJT, transistores FET, reguladores de voltaje y diodos
 * no-LED tienen modelos comerciales con valores fijos definidos en el
 * backend. El admin solo elige el modelo del dropdown y los demas campos
 * (β, Vbe, etc.) se autocompletan en read-only.
 */


/*  BJT — Transistor Bipolar                                     */
export const MODELOS_BJT = [
  { value: '2N2222A', label: 'NPN Uso General (2N2222A)',     params: { tipo: 'NPN', configuracion: 'Uso General',  beta: 100, vbe_saturacion: 0.600, vce_saturacion: 0.300, corriente_colector_max: 0.800, potencia_maxima: 0.500,  frecuencia_transicion: 300, modo_operacion: 'Amplificador/Interruptor' } },
  { value: '2N3904',  label: 'NPN Uso General (2N3904)',      params: { tipo: 'NPN', configuracion: 'Uso General',  beta: 100, vbe_saturacion: 0.650, vce_saturacion: 0.200, corriente_colector_max: 0.200, potencia_maxima: 0.625,  frecuencia_transicion: 300, modo_operacion: 'Amplificador/Interruptor' } },
  { value: 'BC547B',  label: 'NPN Alta Ganancia (BC547B)',    params: { tipo: 'NPN', configuracion: 'Audio/Señal',  beta: 200, vbe_saturacion: 0.700, vce_saturacion: 0.200, corriente_colector_max: 0.100, potencia_maxima: 0.500,  frecuencia_transicion: 300, modo_operacion: 'Amplificador Lineal' } },
  { value: 'ST9013H', label: 'NPN Alta Corriente (ST9013H)',  params: { tipo: 'NPN', configuracion: 'Carga Media',  beta: 150, vbe_saturacion: 0.800, vce_saturacion: 0.600, corriente_colector_max: 0.500, potencia_maxima: 0.625,  frecuencia_transicion: 150, modo_operacion: 'Interruptor' } },
  { value: 'TIP41C',  label: 'NPN Potencia (TIP41C)',         params: { tipo: 'NPN', configuracion: 'Potencia',     beta:  15, vbe_saturacion: 1.500, vce_saturacion: 1.500, corriente_colector_max: 6.000, potencia_maxima: 65.000, frecuencia_transicion:   3, modo_operacion: 'Potencia' } },
  { value: '2N3906',  label: 'PNP Uso General (2N3906)',      params: { tipo: 'PNP', configuracion: 'Uso General',  beta: 100, vbe_saturacion: 0.650, vce_saturacion: 0.250, corriente_colector_max: 0.200, potencia_maxima: 0.625,  frecuencia_transicion: 250, modo_operacion: 'Amplificador/Interruptor' } },
  { value: 'BC557',   label: 'PNP Alta Ganancia (BC557)',     params: { tipo: 'PNP', configuracion: 'Audio/Señal',  beta: 200, vbe_saturacion: 0.700, vce_saturacion: 0.200, corriente_colector_max: 0.100, potencia_maxima: 0.500,  frecuencia_transicion: 150, modo_operacion: 'Amplificador Lineal' } },
  { value: 'TIP42C',  label: 'PNP Potencia (TIP42C)',         params: { tipo: 'PNP', configuracion: 'Potencia',     beta:  15, vbe_saturacion: 1.500, vce_saturacion: 1.500, corriente_colector_max: 6.000, potencia_maxima: 65.000, frecuencia_transicion:   3, modo_operacion: 'Potencia' } },
];


/*  FET — Transistor de Efecto de Campo                         */
export const MODELOS_FET = [
  { value: '2N5457',  label: 'JFET Canal N Señal (2N5457)',         params: { tipo: 'JFET_N',   idss: 0.003, vp: -2.000, gm: 0.003, rd: 100000.000, configuracion: 'Señal',       modo_operacion: 'Amplificador Lineal' } },
  { value: '2N5460',  label: 'JFET Canal P Señal (2N5460)',         params: { tipo: 'JFET_P',   idss: 0.005, vp:  2.000, gm: 0.004, rd: 100000.000, configuracion: 'Señal',       modo_operacion: 'Amplificador Lineal' } },
  { value: '2N7000',  label: 'MOSFET Canal N Señal (2N7000)',       params: { tipo: 'MOSFET_N', idss: 0.200, vp:  2.000, gm: 0.320, rd:      5.000, configuracion: 'Interruptor', modo_operacion: 'Conmutación Rápida' } },
  { value: 'IRFZ44N', label: 'MOSFET Canal N Potencia (IRFZ44N)',   params: { tipo: 'MOSFET_N', idss:49.000, vp:  3.000, gm:15.000, rd:      0.017, configuracion: 'Potencia',    modo_operacion: 'Control de Motores' } },
  { value: 'IRF9540N',label: 'MOSFET Canal P Potencia (IRF9540N)',  params: { tipo: 'MOSFET_P', idss:23.000, vp: -3.000, gm: 9.300, rd:      0.117, configuracion: 'Potencia',    modo_operacion: 'Control de Motores' } },
];


/*  Regulador de voltaje                                         */
export const MODELOS_REGULADOR = [
  { value: 'LM7805',    label: 'Positivo Fijo 5V (LM7805)',       params: { tipo: 'Lineal Fijo',      voltaje_salida:   5.000, corriente_maxima: 1.500, voltaje_entrada_min:   7.000, voltaje_entrada_max:  35.000, dropout_voltage: 2.000, disipacion_maxima: 15.000, tolerancia: 4.00 } },
  { value: 'LM340T-12', label: 'Positivo Fijo 12V (LM340T-12)',   params: { tipo: 'Lineal Fijo',      voltaje_salida:  12.000, corriente_maxima: 1.500, voltaje_entrada_min:  14.500, voltaje_entrada_max:  35.000, dropout_voltage: 2.000, disipacion_maxima: 15.000, tolerancia: 4.00 } },
  { value: 'LM7905',    label: 'Negativo Fijo -5V (LM7905)',      params: { tipo: 'Lineal Fijo',      voltaje_salida:  -5.000, corriente_maxima: 1.500, voltaje_entrada_min:  -7.000, voltaje_entrada_max: -35.000, dropout_voltage: 2.000, disipacion_maxima: 15.000, tolerancia: 4.00 } },
  { value: 'L7912',     label: 'Negativo Fijo -12V (L7912)',      params: { tipo: 'Lineal Fijo',      voltaje_salida: -12.000, corriente_maxima: 1.500, voltaje_entrada_min: -14.500, voltaje_entrada_max: -35.000, dropout_voltage: 2.000, disipacion_maxima: 15.000, tolerancia: 4.00 } },
  { value: 'LM317',     label: 'Positivo Ajustable (LM317)',      params: { tipo: 'Lineal Ajustable', voltaje_salida:   1.250, corriente_maxima: 1.500, voltaje_entrada_min:   3.000, voltaje_entrada_max:  40.000, dropout_voltage: 3.000, disipacion_maxima: 20.000, tolerancia: 4.00 } },
  { value: 'LM337',     label: 'Negativo Ajustable (LM337)',      params: { tipo: 'Lineal Ajustable', voltaje_salida:  -1.250, corriente_maxima: 1.500, voltaje_entrada_min:  -3.000, voltaje_entrada_max: -40.000, dropout_voltage: 3.000, disipacion_maxima: 20.000, tolerancia: 4.00 } },
];

/*  Diodos no-LED (Rectificadores + Zeners)                     */
export const MODELOS_DIODO = [
  { value: '1N4002',  label: 'Rectificador 100V (1N4002)',  params: { tipo: 'Rectificador', corriente_max: 1.000, voltaje_inv_max:  100.000, caida_tension: 0.700, rz:  0.00, is_saturacion: '1e-14' } },
  { value: '1N4004',  label: 'Rectificador 400V (1N4004)',  params: { tipo: 'Rectificador', corriente_max: 1.000, voltaje_inv_max:  400.000, caida_tension: 0.700, rz:  0.00, is_saturacion: '1e-14' } },
  { value: '1N4007',  label: 'Rectificador 1000V (1N4007)', params: { tipo: 'Rectificador', corriente_max: 1.000, voltaje_inv_max: 1000.000, caida_tension: 0.700, rz:  0.00, is_saturacion: '1e-14' } },
  { value: '1N4728A', label: 'Zener 3.3V (1N4728A)',        params: { tipo: 'Zener',        corriente_max: 0.276, voltaje_inv_max:    3.300, caida_tension: 0.700, rz: 28.00, is_saturacion: '1e-14' } },
  { value: '1N4733A', label: 'Zener 5.1V (1N4733A)',        params: { tipo: 'Zener',        corriente_max: 0.178, voltaje_inv_max:    5.100, caida_tension: 0.700, rz:  5.00, is_saturacion: '1e-14' } },
  { value: '1N4742A', label: 'Zener 12V (1N4742A)',         params: { tipo: 'Zener',        corriente_max: 0.076, voltaje_inv_max:   12.000, caida_tension: 0.700, rz:  9.00, is_saturacion: '1e-14' } },
];

/*  LEDs — modelos con valores override-ables                   */

/**
 * Los LED tienen modelos predefinidos por color/categoria, pero el admin
 * PUEDE editar sus valores electricos (Vf, Imax) manualmente despues de
 * elegir el modelo.
 */
export const MODELOS_LED = [
  { value: 'ROJO',        label: 'LED Rojo Estándar 5mm',     params: { tipo: 'LED',              corriente_max: 0.020, voltaje_inv_max: 5.000, caida_tension: 1.700, rz: 0.00, is_saturacion: '1e-14' } },
  { value: 'VERDE',       label: 'LED Verde Estándar 5mm',    params: { tipo: 'LED',              corriente_max: 0.020, voltaje_inv_max: 5.000, caida_tension: 2.200, rz: 0.00, is_saturacion: '1e-14' } },
  { value: 'AMARILLO',    label: 'LED Amarillo Estándar 5mm', params: { tipo: 'LED',              corriente_max: 0.020, voltaje_inv_max: 5.000, caida_tension: 1.800, rz: 0.00, is_saturacion: '1e-14' } },
  { value: 'AZUL',        label: 'LED Azul Estándar 5mm',     params: { tipo: 'LED',              corriente_max: 0.020, voltaje_inv_max: 5.000, caida_tension: 3.300, rz: 0.00, is_saturacion: '1e-14' } },
  { value: 'BLANCO UB',   label: 'LED Blanco Ultrabrillante', params: { tipo: 'LED_Ultrabrillante', corriente_max: 0.030, voltaje_inv_max: 5.000, caida_tension: 3.300, rz: 0.00, is_saturacion: '1e-14' } },
  { value: 'INFRARROJO',  label: 'LED Infrarrojo (IR) Tx',    params: { tipo: 'LED_IR',           corriente_max: 0.050, voltaje_inv_max: 5.000, caida_tension: 1.200, rz: 0.00, is_saturacion: '1e-14' } },
];

/*  Helpers                                                      */
/**
 * Devuelve los params de un modelo dado su value.
 *
 * @param {Array<{ value: string, params: object }>} catalogo
 * @param {string} value
 * @returns {object | null}
 */
export function paramsDeModelo(catalogo, value) {
  if (!value) return null;
  const found = catalogo.find((m) => m.value === value);
  return found ? { ...found.params } : null;
}

/**
 * Verifica si un value corresponde a un LED (cualquiera de los modelos).
 * Util para el ConstructorNetlist / PreviewSVG.
 *
 * @param {string} value
 * @returns {boolean}
 */
export function esModeloLED(value) {
  if (!value) return false;
  return MODELOS_LED.some((m) => m.value === value);
}

/**
 * Lista de catalogos por tipo de componente (para uso generico).
 */
export const CATALOGOS_POR_TIPO = {
  transistor_bjt:    MODELOS_BJT,
  transistor_fet:    MODELOS_FET,
  regulador_voltaje: MODELOS_REGULADOR,
};