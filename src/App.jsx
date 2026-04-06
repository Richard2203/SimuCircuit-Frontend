import { useReducer } from 'react'
import { Library }   from './components/Library/index'
import { Simulator } from './components/Simulator/index'

const initialState = {
  selectedCircuit: null,
  simStatus:       'inactivo',
  activeTab:       'calcs',
  filters: {
    search: '', difficulty: '', unit: '',
    topic: '', type: '', components: [],
  },
  openAccordions: {},
}

function reducer(state, { type, payload }) {
  switch (type) {
    case 'SELECT_CIRCUIT':
      return { ...state, selectedCircuit: payload, simStatus: 'inactivo' }
    case 'GO_LIBRARY':
      return { ...state, selectedCircuit: null, simStatus: 'inactivo' }
    case 'SIM_INICIAR':
      return { ...state, simStatus: 'activo' }
    case 'SIM_PAUSAR':
      return { ...state, simStatus: 'pausado' }
    case 'SIM_REINICIAR':
      return { ...state, simStatus: 'inactivo' }
    case 'SET_TAB':
      return { ...state, activeTab: payload }
    case 'TOGGLE_ACCORDION':
      return {
        ...state,
        openAccordions: {
          ...state.openAccordions,
          [payload]: !state.openAccordions[payload],
        },
      }
    case 'SET_FILTER':
      return { ...state, filters: { ...state.filters, ...payload } }
    case 'CLEAR_FILTERS':
      return { ...state, filters: initialState.filters }
    default:
      return state
  }
}

function useAppDispatch(rawDispatch) {
  return (type, payload) => {
    if (typeof type === 'string') rawDispatch({ type, payload })
    else rawDispatch(type)
  }
}

export default function App() {
  const [state, rawDispatch] = useReducer(reducer, initialState)
  const dispatch = useAppDispatch(rawDispatch)

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d' }}>
      {state.selectedCircuit
        ? <Simulator state={state} dispatch={dispatch} />
        : <Library   state={state} dispatch={dispatch} />
      }
    </div>
  )
}
