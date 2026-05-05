
export { Circuit }            from './Circuit';
export { Component }          from './Component';
export { ComponentFactory }   from './ComponentFactory';

// Subclases por tipo
export { Resistencia, RESISTENCIA_DEFAULT_PARAMS }                   from './components/Resistencia';
export { ResistenciaVariable, RESISTENCIA_VARIABLE_DEFAULT_PARAMS }  from './components/ResistenciaVariable';
export { Capacitor, CAPACITOR_DEFAULT_PARAMS }                       from './components/Capacitor';
export { Bobina, BOBINA_DEFAULT_PARAMS }                             from './components/Bobina';
export { Diodo, DIODO_DEFAULT_PARAMS, SUBTIPOS_DIODO }               from './components/Diodo';
export { FuenteVoltaje, FUENTE_VOLTAJE_DEFAULT_PARAMS }              from './components/FuenteVoltaje';
export { FuenteCorriente, FUENTE_CORRIENTE_DEFAULT_PARAMS }          from './components/FuenteCorriente';
export { TransistorBJT, BJT_DEFAULT_PARAMS }                         from './components/TransistorBJT';
export { TransistorFET, FET_DEFAULT_PARAMS }                         from './components/TransistorFET';
export { ReguladorVoltaje, REGULADOR_DEFAULT_PARAMS }                from './components/ReguladorVoltaje';

// Tablas centrales (pines, prefijos, rangos, unidades)
export {
  TIPOS_COMPONENTE,
  CANONICAL_PINS,
  LEGACY_PIN_ALIASES,
  PIN_LABELS,
  PREFIJOS,
  RANGOS,
  UNIDADES_VALIDAS,
  LABELS_TIPO,
  resolvePinKey,
  labelForTipo,
  labelForPin,
} from './pinDefinitions';
