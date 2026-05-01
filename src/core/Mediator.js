import eventBus from './EventBus';
import { CircuitosService }   from '../services/simulator/CircuitosService';
import { ComponentesService } from '../services/simulator/ComponentesService';
import { SimulacionService }  from '../services/simulator/SimulacionService';
import { TeoremasService }    from '../services/simulator/TeoremasService';

/**
 * SimuCircuitMediator — Pattern: Mediator
 * Hub central que coordina toda la comunicación entre componentes.
 * Ningún componente se habla directamente con otro; todo pasa por aquí.
 *
 * Eventos publicados al bus:
 *  - STATE_CHANGED        → cuando el estado global cambia
 *  - SIM_TICK             → cada segundo mientras la simulación está activa
 *  - circuito:cargado     → cuando se carga el detalle + netlist de un circuito
 *  - filtros:actualizados → cuando se obtienen filtros desde la API
 *  - simulacion:iniciada  → justo antes de llamar a la API de simulación
 *  - simulacion:completada→ cuando la API devuelve resultados
 *  - simulacion:error     → si la API devuelve un error
 */

const INITIAL_STATE = {
  view: 'library',            // 'library' | 'simulator'
  selectedCircuit: null,
  netlist: [],                // netlist activa del circuito seleccionado
  simStatus: 'detenido',      // 'detenido' | 'activo' | 'pausado'
  simTime: 0,                 // segundos transcurridos
  simResultadoDC: null,       // último resultado DC
  simResultadoAC: null,       // último resultado AC
  simError: null,             // último error de simulación
  filtrosApi: null,           // filtros obtenidos desde /api/circuitos/filtros
  circuitosApi: [],           // circuitos obtenidos desde /api/circuitos
  componentesCatalogo: [],    // catálogo de /api/componentes
  teoremaResultado: null,     // último resultado de Thévenin/Norton o Superposición
  filters: {
    search: '',
    difficulty: '',
    unit: '',
    topic: '',
    type: '',
    components: [],
  },
  activeTab: 'calcs',         // 'calcs' | 'graficas'
  openAccordions: {},         // { [id]: boolean }
  loading: {},                // { [key]: boolean } para estados de carga
};

class SimuCircuitMediator {
  constructor(bus) {
    this._bus = bus;
    this._state = {
      ...INITIAL_STATE,
      filters:  { ...INITIAL_STATE.filters },
      loading:  {},
    };
    this._timer = null;
  }

  /** Retorna una copia superficial del estado actual */
  getState() {
    return { ...this._state };
  }

  // ─── Punto de entrada síncrono ───────────────────────────────

  /**
   * Punto de entrada único para todos los cambios de estado síncronos.
   * Para operaciones asíncronas usar los métodos async del Mediator directamente.
   * @param {string} action - Identificador de la acción
   * @param {*} payload - Datos de la acción
   */
  dispatch(action, payload) {
    switch (action) {

      case 'SELECT_CIRCUIT':
        this._stopTimer();
        this._state = {
          ...this._state,
          selectedCircuit: payload,
          netlist: payload?.netlist ?? [],
          view: 'simulator',
          simStatus: 'detenido',
          simTime: 0,
          simResultadoDC: null,
          simResultadoAC: null,
          simError: null,
          teoremaResultado: null,
          openAccordions: {},
        };
        break;

      case 'GO_LIBRARY':
        this._stopTimer();
        this._state = {
          ...this._state,
          selectedCircuit: null,
          netlist: [],
          view: 'library',
          simStatus: 'detenido',
          simTime: 0,
          simResultadoDC: null,
          simResultadoAC: null,
          simError: null,
          teoremaResultado: null,
        };
        break;

      case 'SIM_INICIAR':
        if (this._state.simStatus !== 'activo') {
          this._state.simStatus = 'activo';
          this._startTimer();
        }
        break;

      case 'SIM_PAUSAR':
        if (this._state.simStatus === 'activo') {
          this._state.simStatus = 'pausado';
          this._stopTimer();
        }
        break;

      case 'SIM_REINICIAR':
        this._stopTimer();
        this._state = {
          ...this._state,
          simStatus: 'detenido',
          simTime: 0,
          simResultadoDC: null,
          simResultadoAC: null,
          simError: null,
        };
        break;

      case 'SET_FILTER':
        this._state.filters = { ...this._state.filters, ...payload };
        break;

      case 'CLEAR_FILTERS':
        this._state.filters = { ...INITIAL_STATE.filters, components: [] };
        break;

      case 'SET_TAB':
        this._state.activeTab = payload;
        break;

      case 'TOGGLE_ACCORDION':
        this._state.openAccordions = {
          ...this._state.openAccordions,
          [payload]: !this._state.openAccordions[payload],
        };
        break;

      case 'SET_NETLIST':
        this._state.netlist = payload;
        break;

      default:
        console.warn(`[Mediator] Acción desconocida: ${action}`);
        return;
    }

    this._bus.publish('STATE_CHANGED', this.getState());
  }

  // ─── Operaciones asíncronas (API) ────────────────────────────

  /**
   * Carga los filtros disponibles desde la API y actualiza el estado.
   * Publica: filtros:actualizados
   */
  async cargarFiltros() {
    this._setLoading('filtros', true);
    try {
      const filtrosApi = await CircuitosService.getFiltros();
      this._state.filtrosApi = filtrosApi;
      this._bus.publish('filtros:actualizados', filtrosApi);
    } catch (err) {
      console.error('[Mediator] Error al cargar filtros:', err);
    } finally {
      this._setLoading('filtros', false);
    }
    this._bus.publish('STATE_CHANGED', this.getState());
  }

  /**
   * Busca circuitos en la API según los filtros activos.
   * @param {object} [params] - Parámetros de búsqueda opcionales
   */
  async buscarCircuitos(params = {}) {
    this._setLoading('circuitos', true);
    try {
      const circuitosApi = await CircuitosService.getCircuitos(params);
      this._state.circuitosApi = circuitosApi;
    } catch (err) {
      console.error('[Mediator] Error al buscar circuitos:', err);
      this._state.circuitosApi = [];
    } finally {
      this._setLoading('circuitos', false);
    }
    this._bus.publish('STATE_CHANGED', this.getState());
  }

  /**
   * Carga el detalle de un circuito por ID (incluye netlist) y cambia la vista.
   * Publica: circuito:cargado
   * @param {number|string} id
   */
  async cargarCircuito(id) {
    this._setLoading('circuito', true);
    try {
      const { circuito, netlist } = await CircuitosService.getCircuitoById(id);
      const circuitoConNetlist = { ...circuito, netlist };
      this._stopTimer();
      this._state = {
        ...this._state,
        selectedCircuit: circuitoConNetlist,
        netlist,
        view: 'simulator',
        simStatus: 'detenido',
        simTime: 0,
        simResultadoDC: null,
        simResultadoAC: null,
        simError: null,
        teoremaResultado: null,
        openAccordions: {},
      };
      this._bus.publish('circuito:cargado', circuitoConNetlist);
    } catch (err) {
      console.error('[Mediator] Error al cargar circuito:', err);
    } finally {
      this._setLoading('circuito', false);
    }
    this._bus.publish('STATE_CHANGED', this.getState());
  }

  /**
   * Carga el catálogo de componentes desde la API.
   */
  async cargarComponentes() {
    this._setLoading('componentes', true);
    try {
      const { data } = await ComponentesService.getComponentes();
      this._state.componentesCatalogo = data;
    } catch (err) {
      console.error('[Mediator] Error al cargar componentes:', err);
    } finally {
      this._setLoading('componentes', false);
    }
    this._bus.publish('STATE_CHANGED', this.getState());
  }

  /**
   * Ejecuta la simulación DC. Coordina: validación → API → eventos.
   * Publica: simulacion:iniciada, simulacion:completada | simulacion:error
   * @param {object} [opciones]
   * @param {string} [opciones.nombre_circuito]
   * @param {Array}  [opciones.netlist] - Usa la netlist del estado si se omite
   */
  async simularDC(opciones = {}) {
    const netlist = opciones.netlist ?? this._state.netlist;
    const nombre_circuito =
      opciones.nombre_circuito ??
      this._state.selectedCircuit?.nombre_circuito ??
      this._state.selectedCircuit?.nombre;

    this._bus.publish('simulacion:iniciada', { tipo: 'DC', netlist });
    this._setLoading('simulacionDC', true);
    this._state.simError = null;

    try {
      const resultado = await SimulacionService.simularDC({ netlist, nombre_circuito });
      this._state.simResultadoDC = resultado;
      this._bus.publish('simulacion:completada', { tipo: 'DC', resultado });
    } catch (err) {
      this._state.simError = err.message;
      this._bus.publish('simulacion:error', { tipo: 'DC', error: err.message });
      console.error('[Mediator] Error en simulación DC:', err);
    } finally {
      this._setLoading('simulacionDC', false);
    }
    this._bus.publish('STATE_CHANGED', this.getState());
  }

  /**
   * Ejecuta la simulación AC. Coordina: validación → API → eventos.
   * Publica: simulacion:iniciada, simulacion:completada | simulacion:error
   * @param {object} opciones
   * @param {object} opciones.configuracion_ac
   * @param {string} [opciones.nombre_circuito]
   * @param {Array}  [opciones.netlist]
   */
  async simularAC(opciones = {}) {
    const netlist = opciones.netlist ?? this._state.netlist;
    const nombre_circuito =
      opciones.nombre_circuito ??
      this._state.selectedCircuit?.nombre_circuito ??
      this._state.selectedCircuit?.nombre;

    this._bus.publish('simulacion:iniciada', { tipo: 'AC', netlist });
    this._setLoading('simulacionAC', true);
    this._state.simError = null;

    try {
      const resultado = await SimulacionService.simularAC({
        netlist,
        configuracion_ac: opciones.configuracion_ac,
        nombre_circuito,
      });
      this._state.simResultadoAC = resultado;
      this._bus.publish('simulacion:completada', { tipo: 'AC', resultado });
    } catch (err) {
      this._state.simError = err.message;
      this._bus.publish('simulacion:error', { tipo: 'AC', error: err.message });
      console.error('[Mediator] Error en simulación AC:', err);
    } finally {
      this._setLoading('simulacionAC', false);
    }
    this._bus.publish('STATE_CHANGED', this.getState());
  }

  /**
   * Calcula Thévenin/Norton para un componente de carga.
   * @param {object} opciones
   * @param {string} opciones.componenteCargaId
   * @param {string} [opciones.nombre_circuito]
   * @param {Array}  [opciones.netlist]
   */
  async calcularTheveninNorton(opciones = {}) {
    const netlist = opciones.netlist ?? this._state.netlist;
    const nombre_circuito =
      opciones.nombre_circuito ??
      this._state.selectedCircuit?.nombre_circuito ??
      this._state.selectedCircuit?.nombre;

    this._setLoading('teorema', true);
    this._state.simError = null;

    try {
      const resultado = await TeoremasService.calcularTheveninNorton({
        componenteCargaId: opciones.componenteCargaId,
        netlist,
        nombre_circuito,
      });
      this._state.teoremaResultado = { tipo: 'thevenin-norton', ...resultado };
    } catch (err) {
      this._state.simError = err.message;
      console.error('[Mediator] Error en Thévenin/Norton:', err);
    } finally {
      this._setLoading('teorema', false);
    }
    this._bus.publish('STATE_CHANGED', this.getState());
  }

  /**
   * Aplica el principio de superposición sobre un componente objetivo.
   * @param {object} opciones
   * @param {string} opciones.componenteObjetivoId
   * @param {string} opciones.parametroAnalisis - "voltaje" | "corriente"
   * @param {string} [opciones.nombre_circuito]
   * @param {Array}  [opciones.netlist]
   */
  async calcularSuperposicion(opciones = {}) {
    const netlist = opciones.netlist ?? this._state.netlist;
    const nombre_circuito =
      opciones.nombre_circuito ??
      this._state.selectedCircuit?.nombre_circuito ??
      this._state.selectedCircuit?.nombre;

    this._setLoading('teorema', true);
    this._state.simError = null;

    try {
      const resultado = await TeoremasService.calcularSuperposicion({
        componenteObjetivoId: opciones.componenteObjetivoId,
        parametroAnalisis:    opciones.parametroAnalisis,
        netlist,
        nombre_circuito,
      });
      this._state.teoremaResultado = { tipo: 'superposicion', ...resultado };
    } catch (err) {
      this._state.simError = err.message;
      console.error('[Mediator] Error en Superposición:', err);
    } finally {
      this._setLoading('teorema', false);
    }
    this._bus.publish('STATE_CHANGED', this.getState());
  }

  // ─── Helpers privados ────────────────────────────────────────

  _startTimer() {
    this._timer = setInterval(() => {
      this._state.simTime += 1;
      this._bus.publish('SIM_TICK', this._state.simTime);
    }, 1000);
  }

  _stopTimer() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  _setLoading(key, value) {
    this._state.loading = { ...this._state.loading, [key]: value };
  }
}

// Singleton compartido
const mediator = new SimuCircuitMediator(eventBus);
export default mediator;


// exportancia para pruebas unitarias y de integracion
export { SimuCircuitMediator };