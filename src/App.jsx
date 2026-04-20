import { useMediator } from './hooks/useMediator';
import { Library }     from './components/Library/index';
import { Simulator }   from './components/Simulator/index';

/**
 * App — Raíz de la aplicación.
 * Usa useMediator para conectar con el Mediator (patrón Mediator)
 * y el EventBus (patrón Observer). Toda la lógica de estado y API
 * fluye a través del Mediator; los componentes solo reciben state,
 * dispatch y api.
 */
export default function App() {
  const { state, dispatch, api } = useMediator();

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d' }}>
      {state.selectedCircuit
        ? <Simulator state={state} dispatch={dispatch} api={api} />
        : <Library   state={state} dispatch={dispatch} api={api} />
      }
    </div>
  );
}