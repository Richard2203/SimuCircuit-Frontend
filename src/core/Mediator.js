import eventBus from './EventBus';
import { CircuitosService }   from '../services/simulator/CircuitosService';
import { ComponentesService } from '../services/simulator/ComponentesService';
import { SimulacionService }  from '../services/simulator/SimulacionService';
import { TeoremasService }    from '../services/simulator/TeoremasService';
import { AnalisisService }    from '../services/simulator/AnalisisService';
import { Circuit }            from '../domain';

/**
 * SimuCircuitMediator — Pattern: Mediator
 * Hub central que coordina toda la comunicacion entre componentes.
 * Eventos publicados al bus:
 *   - STATE_CHANGED        -> cuando el estado global cambia
 *   - SIM_TICK             -> cada segundo mientras la simulación está activa
 *   - circuito:cargado     -> cuando se carga el detalle + netlist de un circuito
 *   - filtros:actualizados -> cuando se obtienen filtros desde la API
 *   - simulacion:iniciada  -> justo antes de llamar a la API de simulación
 *   - simulacion:completada-> cuando la API devuelve resultados
 *   - simulacion:error     -> si la API devuelve un error
 */

const INITIAL_STATE = {
  view: 'library',            // 'library' | 'simulator'
  /** @type {Circuit|null} */
  selectedCircuit: null,
  /** @type {import('../domain').Component[]} */
  netlist: [],                // espejo de selectedCircuit.netlist (compat)
  simStatus: 'detenido',      // 'detenido' | 'activo' | 'pausado'
  simTime: 0,
  simResultadoDC: null,
  simResultadoAC: null,
  simError: null,
  filtrosApi: null,
  /** @type {Circuit[]} */
  circuitosApi: [],
  componentesCatalogo: [],
  teoremaResultado: null,
  analisisResultado: null,    // ultimo resultado de /api/analisis/*
  filters: {
    search: '',
    difficulty: '',
    unit: '',
    topic: '',
    type: '',
    components: [],
  },
  activeTab: 'calcs',
  openAccordions: {},
  loading: {},
};

class SimuCircuitMediator {
  constructor(bus) {
    this._bus = bus;
    this._state = {
      ...INITIAL_STATE,
      filters: { ...INITIAL_STATE.filters },
      loading: {},
    };
    this._timer = null;
  }

  /** Retorna una copia superficial del estado actual. */
  getState() {
    return { ...this._state };
  }

  // Punto de entrada sincrono

  dispatch(action, payload) {
    switch (action) {

      case 'SELECT_CIRCUIT': {
        // Aceptar tanto un Circuit como JSON crudo (compat con datasets locales).
        const circuit = payload instanceof Circuit
          ? payload
          : Circuit.fromAny(payload);

        this._stopTimer();
        this._state = {
          ...this._state,
          selectedCircuit: circuit,
          netlist: circuit?.netlist ?? [],
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
      }

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

      case 'SET_NETLIST': {
        // payload es un Component[] o JSON crudo. 
        const newNetlist = payload ?? [];
        this._state.netlist = newNetlist;
        if (this._state.selectedCircuit) {
          this._state.selectedCircuit = this._state.selectedCircuit.withNetlist(newNetlist);
        }
        break;
      }

      default:
        console.warn(`[Mediator] Acción desconocida: ${action}`);
        return;
    }

    this._bus.publish('STATE_CHANGED', this.getState());
  }

  // Operaciones asincronas (API)

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
   * Busca circuitos en la API segun los filtros activos.
   * @param {object} [params] - Parametros de busqueda opcionales 
   */
  async buscarCircuitos(params = {}) {
    this._setLoading('circuitos', true);
    try {
      const circuitosApi = await CircuitosService.getCircuitos(params);
      this._state.circuitosApi = circuitosApi;   // Circuit[]
    } catch (err) {
      console.error('[Mediator] Error al buscar circuitos:', err);
      this._state.circuitosApi = [];
    } finally {
      this._setLoading('circuitos', false);
    }
    this._bus.publish('STATE_CHANGED', this.getState());
  }

  /**
   * Carga el detalle de un circuito por ID y cambia la vista.
   * @param {number|string} id
   */
  async cargarCircuito(id) {
    this._setLoading('circuito', true);
    try {
      /** @type {Circuit} */
      const circuit = await CircuitosService.getCircuitoById(id);
      this._stopTimer();
      this._state = {
        ...this._state,
        selectedCircuit: circuit,
        netlist:         circuit.netlist,
        view:            'simulator',
        simStatus:       'detenido',
        simTime:         0,
        simResultadoDC:  null,
        simResultadoAC:  null,
        simError:        null,
        teoremaResultado: null,
        openAccordions:  {},
      };
      this._bus.publish('circuito:cargado', circuit);
    } catch (err) {
      console.error('[Mediator] Error al cargar circuito:', err);
    } finally {
      this._setLoading('circuito', false);
    }
    this._bus.publish('STATE_CHANGED', this.getState());
  }

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
   * Devuelve el nombre del circuito actual para enviar al backend de simulacion.
   * @returns {string|undefined}
   * @private
   */
  _nombreCircuitoActual() {
    return this._state.selectedCircuit?.nombre;
  }

  /**
   * Ejecuta la simulacion DC.
   */
  async simularDC(opciones = {}) {
    const netlistJSON = this._netlistParaBackend(opciones.netlist ?? this._state.netlist);
    const nombre_circuito = opciones.nombre_circuito ?? this._nombreCircuitoActual();

    this._bus.publish('simulacion:iniciada', { tipo: 'DC', netlist: netlistJSON });
    this._setLoading('simulacionDC', true);
    this._state.simError = null;

    try {
      const resultado = await SimulacionService.simularDC({ netlist: netlistJSON, nombre_circuito });
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
   * Ejecuta la simulacion AC.
   */
  async simularAC(opciones = {}) {
    const netlistJSON = this._netlistParaBackend(opciones.netlist ?? this._state.netlist);
    const nombre_circuito = opciones.nombre_circuito ?? this._nombreCircuitoActual();

    this._bus.publish('simulacion:iniciada', { tipo: 'AC', netlist: netlistJSON });
    this._setLoading('simulacionAC', true);
    this._state.simError = null;

    try {
      const resultado = await SimulacionService.simularAC({
        netlist: netlistJSON,
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

  async calcularTheveninNorton(opciones = {}) {
    const netlistJSON = this._netlistParaBackend(opciones.netlist ?? this._state.netlist);
    const nombre_circuito = opciones.nombre_circuito ?? this._nombreCircuitoActual();

    this._setLoading('teorema', true);
    this._state.simError = null;

    try {
      const resultado = await TeoremasService.calcularTheveninNorton({
        componenteCargaId: opciones.componenteCargaId,
        netlist: netlistJSON,
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

  async calcularSuperposicion(opciones = {}) {
    const netlistJSON = this._netlistParaBackend(opciones.netlist ?? this._state.netlist);
    const nombre_circuito = opciones.nombre_circuito ?? this._nombreCircuitoActual();

    this._setLoading('teorema', true);
    this._state.simError = null;

    try {
      const resultado = await TeoremasService.calcularSuperposicion({
        componenteObjetivoId: opciones.componenteObjetivoId,
        parametroAnalisis:    opciones.parametroAnalisis,
        netlist:              netlistJSON,
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

  /**
   * Transforma una fuente: voltaje <-> corriente.
   * @param {{ fuenteId: string, netlist?: Array }} opciones
   */
  async calcularTransformacionFuente(opciones = {}) {
    const netlistJSON = this._netlistParaBackend(opciones.netlist ?? this._state.netlist);
    const nombre_circuito = opciones.nombre_circuito ?? this._nombreCircuitoActual();
    this._setLoading('teorema', true);
    this._state.simError = null;
    try {
      const resultado = await TeoremasService.transformarFuente({
        fuenteId: opciones.fuenteId,
        netlist: netlistJSON,
        nombre_circuito,
      });
      this._state.teoremaResultado = { tipo: 'transformacion-fuente', ...resultado };
    } catch (err) {
      this._state.simError = err.message;
      console.error('[Mediator] Error en transformación de fuente:', err);
    } finally {
      this._setLoading('teorema', false);
    }
    this._bus.publish('STATE_CHANGED', this.getState());
  }

  // Analisis de circuitos (/api/analisis)

  /**
   * Ejecuta el analisis nodal DC completo.
   * Internamente usa simularDC pero almacena el resultado en analisisResultado
   * con tipo nodal para que los accordions lo puedan consumir.
   */
  async calcularNodal() {
    const netlistJSON = this._netlistParaBackend(this._state.netlist);
    this._setLoading('analisisNodal', true);
    this._state.simError = null;
    try {
      const resultado = await SimulacionService.simularDC({
        netlist: netlistJSON,
        nombre_circuito: this._nombreCircuitoActual(),
      });
      this._state.analisisResultado = { tipo: 'nodal', ...resultado };
    } catch (err) {
      this._state.simError = err.message;
      console.error('[Mediator] Error en análisis nodal:', err);
    } finally {
      this._setLoading('analisisNodal', false);
    }
    this._bus.publish('STATE_CHANGED', this.getState());
  }

  /**
   * Ejecuta el analisis transitorio.
   * @param {{ t_stop?: number, delta_t?: number }} [cfg]
   */
  async calcularTransitorio(cfg = {}) {
    const netlistJSON = this._netlistParaBackend(this._state.netlist);
    const configuracion_transitorio = {
      t_stop:  cfg.t_stop  ?? 0.05,
      delta_t: cfg.delta_t ?? 0.0005,
    };
    this._setLoading('analisisTransitorio', true);
    this._state.simError = null;
    try {
      const resultado = await AnalisisService.calcularTransitorio({
        netlist: netlistJSON,
        configuracion_transitorio,
      });
      this._state.analisisResultado = { tipo: 'transitorio', puntos: resultado };
    } catch (err) {
      this._state.simError = err.message;
      console.error('[Mediator] Error en análisis transitorio:', err);
    } finally {
      this._setLoading('analisisTransitorio', false);
    }
    this._bus.publish('STATE_CHANGED', this.getState());
  }

  /**
   * Calcula la resistencia equivalente entre dos nodos.
   * @param {{ nodoA: string, nodoB: string }} opciones
   */
  async calcularResistenciaEquivalente(opciones = {}) {
    const netlistJSON = this._netlistParaBackend(this._state.netlist);
    this._setLoading('analisisReq', true);
    this._state.simError = null;
    try {
      const resultado = await AnalisisService.calcularResistenciaEquivalente({
        netlist: netlistJSON,
        nodoA: opciones.nodoA,
        nodoB: opciones.nodoB,
        nombre_circuito: this._nombreCircuitoActual(),
      });
      this._state.analisisResultado = { tipo: 'resistencia-equivalente', ...resultado };
    } catch (err) {
      this._state.simError = err.message;
      console.error('[Mediator] Error en Req:', err);
    } finally {
      this._setLoading('analisisReq', false);
    }
    this._bus.publish('STATE_CHANGED', this.getState());
  }

  /**
   * Calcula el divisor de voltaje para un componente objetivo.
   * @param {{ componenteObjetivoId: string }} opciones
   */
  async calcularDivisorVoltaje(opciones = {}) {
    const netlistJSON = this._netlistParaBackend(this._state.netlist);
    this._setLoading('analisisDivisor', true);
    this._state.simError = null;
    try {
      const resultado = await AnalisisService.calcularDivisorVoltaje({
        netlist: netlistJSON,
        componenteObjetivoId: opciones.componenteObjetivoId,
        nombre_circuito: this._nombreCircuitoActual(),
      });
      this._state.analisisResultado = { tipo: 'divisor-voltaje', ...resultado };
    } catch (err) {
      this._state.simError = err.message;
      console.error('[Mediator] Error en divisor de voltaje:', err);
    } finally {
      this._setLoading('analisisDivisor', false);
    }
    this._bus.publish('STATE_CHANGED', this.getState());
  }

  /**
   * Calcula el divisor de corriente para un componente objetivo.
   * @param {{ componenteObjetivoId: string }} opciones
   */
  async calcularDivisorCorriente(opciones = {}) {
    const netlistJSON = this._netlistParaBackend(this._state.netlist);
    this._setLoading('analisisDivisor', true);
    this._state.simError = null;
    try {
      const resultado = await AnalisisService.calcularDivisorCorriente({
        netlist: netlistJSON,
        componenteObjetivoId: opciones.componenteObjetivoId,
        nombre_circuito: this._nombreCircuitoActual(),
      });
      this._state.analisisResultado = { tipo: 'divisor-corriente', ...resultado };
    } catch (err) {
      this._state.simError = err.message;
      console.error('[Mediator] Error en divisor de corriente:', err);
    } finally {
      this._setLoading('analisisDivisor', false);
    }
    this._bus.publish('STATE_CHANGED', this.getState());
  }

  // Helpers privados 

  /**
   * Convierte la netlist de instancias Component al formato plano que espera el backend.
   * El backend espera:  nodes: { n1: "1", n2: "2" }
   * El dominio guarda:  nodes: { n1: { nodo: "1", x: 100, y: 50 } }
   *
   * @param {Array} netlist - Array de Component | objeto plano
   * @returns {Array} netlist en formato backend
   */
  _netlistParaBackend(netlist) {
    return (netlist ?? []).map((c) => {
      // Si ya es un objeto plano (no instancia), convertir nodes si es necesario
      const raw = typeof c?.toBackendJSON === 'function' ? c.toBackendJSON() : { ...c };

      // Normalizar nodes: { pin: { nodo, x, y } } -> { pin: "nodoString" }
      const nodes = {};
      Object.entries(raw.nodes ?? {}).forEach(([pin, val]) => {
        nodes[pin] = typeof val === 'object' ? String(val.nodo ?? '') : String(val);
      });

      return {
        id:       raw.id,
        type:     raw.type,
        value:    raw.value,
        nodes,
        params:   raw.params   ?? {},
        position: raw.position ?? { x: 0, y: 0 },
        rotation: raw.rotation ?? 0,
      };
    });
  }

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

  _nombreCircuitoActual() {
    return (
      this._state.selectedCircuit?.nombre_circuito ??
      this._state.selectedCircuit?.nombre ??
      undefined
    );
  }
}

const mediator = new SimuCircuitMediator(eventBus);
export default mediator;

export { SimuCircuitMediator };