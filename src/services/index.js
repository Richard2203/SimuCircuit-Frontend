/**
 * Barrel de servicios — punto de entrada único para toda la capa de API.
 *
 * Uso:
 *   import { CircuitosService, SimulacionService } from '../services';
 */

export { apiClient, ApiError } from './apiClient';
export { CircuitosService }   from './CircuitosService';
export { ComponentesService } from './ComponentesService';
export { SimulacionService }  from './SimulacionService';
export { TeoremasService }    from './TeoremasService';