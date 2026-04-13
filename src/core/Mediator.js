import eventBus from './EventBus';

/**
 * SimuCircuitMediator — Pattern: Mediator
 * Hub central que coordina toda la comunicación entre componentes.
 * Ningún componente se habla directamente con otro; todo pasa por aquí.
 *
 * Eventos publicados al bus:
 *  - STATE_CHANGED  → cuando el estado global cambia
 *  - SIM_TICK       → cada segundo mientras la simulación está activa
 */

const INITIAL_STATE = {
  view: 'library',            // 'library' | 'simulator'
  selectedCircuit: null,
  simStatus: 'detenido',      // 'detenido' | 'activo' | 'pausado'
  simTime: 0,                 // segundos transcurridos
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
};

class SimuCircuitMediator {
  constructor(bus) {
    this._bus = bus;
    this._state = { ...INITIAL_STATE, filters: { ...INITIAL_STATE.filters } };
    this._timer = null;
  }

  /** Retorna una copia superficial del estado actual */
  getState() {
    return { ...this._state };
  }

  /**
   * Punto de entrada único para todos los cambios de estado.
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
          view: 'simulator',
          simStatus: 'detenido',
          simTime: 0,
          openAccordions: {},
        };
        break;

      case 'GO_LIBRARY':
        this._stopTimer();
        this._state = {
          ...this._state,
          view: 'library',
          simStatus: 'detenido',
          simTime: 0,
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

      default:
        console.warn(`[Mediator] Acción desconocida: ${action}`);
        return;
    }

    this._bus.publish('STATE_CHANGED', this.getState());
  }

  // ─── Helpers privados ───────────────────────────────────────

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
}

// Singleton compartido
const mediator = new SimuCircuitMediator(eventBus);
export default mediator;


// exportancia para pruebas unitarias y de integracion
export { SimuCircuitMediator };