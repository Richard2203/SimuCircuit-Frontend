/**
 * Centraliza TODA la logica de de X analisis a X circuito
 * @param {Circuit} circuit
 * @param {Array}   netlist
 */
export function useCircuitFlags(circuit, netlist) {
  const cc = circuit.componentCounts; // { R, C, L, D, Q, J, U }

  // Fuentes DC
  const dcSources = (netlist ?? []).filter(
    (n) =>
      (n.type === 'fuente_voltaje' || n.type === 'fuente_corriente') &&
      (n.params?.dcOrAc ?? 'dc').toLowerCase() === 'dc',
  );

  const hasDCVoltageSrc  = dcSources.some((n) => n.type === 'fuente_voltaje');
  const hasDCCurrentSrc  = dcSources.some((n) => n.type === 'fuente_corriente');
  const dcSourceCount    = dcSources.length;

  // Componentes no lineales
  // Con no-lineales el AC sweep de pequeña señal pierde validez fuera de +-Vt.
  const hasNonLinear = cc.D > 0 || cc.Q > 0 || cc.J > 0 || cc.U > 0;
  // Transistores y reguladores tambien complican Thevenin 
  const hasActiveNL  = cc.Q > 0 || cc.J > 0 || cc.U > 0;

  // Botones de simulacion
  const showDC   = circuit.tieneDC;
  const showAC   = circuit.tieneAC && !hasNonLinear;
  const showTRAN = circuit.tieneAC &&  hasNonLinear;

  // Accordions de analisis
  // Req (escalar real) solo aplica en DC puro o sin reactivos; en AC+C/L el
  // resultado correcto es Zeq(w), no un escalar.
  const showNodal           = circuit.tieneDC;
  const showTransientPanel  = circuit.tieneDC && (cc.C > 0 || cc.L > 0);
  const showGeneral         = circuit.tieneDC && cc.R > 0 && !hasNonLinear; // Corregido para que solo salga en analisis DC y sin componentes no lineales
  const showLaws            = true;
  const showThevenin        = circuit.tieneDC && cc.R >= 2 && !hasActiveNL;
  const showSuperposition   = circuit.tieneDC && dcSourceCount >= 2;
  const showSourceTransform = circuit.tieneDC && cc.R >= 1 && !hasActiveNL;

  return {
    hasDCVoltageSrc,
    hasDCCurrentSrc,
    dcSourceCount,
    hasNonLinear,
    showDC,
    showAC,
    showTRAN,
    showNodal,
    showTransientPanel,
    showGeneral,
    showLaws,
    showThevenin,
    showSuperposition,
    showSourceTransform,
  };
}