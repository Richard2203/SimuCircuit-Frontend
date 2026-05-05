/**
 * Barrel de servicios — punto de entrada único para toda la capa de API.
 *
 * Uso:
 *   import { CircuitosService, SimulacionService } from '../services';
 *   import { authService, circuitosAdminService }  from '../services';
 */

// --- Servicios del simulador ---------------------------------------
export { apiClient, ApiError } from './simulator/apiClient';
export { CircuitosService }    from './simulator/CircuitosService';
export { ComponentesService }  from './simulator/ComponentesService';
export { SimulacionService }   from './simulator/SimulacionService';
export { TeoremasService }     from './simulator/TeoremasService';

// --- Servicios del panel de administrador ---------------------------
export { authService }           from './admin/authService';
export { circuitosAdminService } from './admin/circuitosAdminService';
export { adminsService }         from './admin/adminsService';