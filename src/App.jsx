import { useMediator } from './hooks/useMediator';
import { Library }   from './components/Library';
import { Simulator } from './components/Simulator';
import './styles/global.css';

/**
 * App — Componente raíz de SimuCircuit.
 *
 * Arquitectura:
 *  - useMediator()  → suscribe al EventBus (Observer) y expone dispatch
 *  - dispatch()     → envía acciones al Mediator (Mediator)
 *  - Mediator       → actualiza estado y publica STATE_CHANGED al bus
 *  - Componentes    → solo reciben state + dispatch, sin acoplamiento entre sí
 *
 * Flujo de datos:
 *  User action → dispatch(action) → Mediator → eventBus.publish() → setState → re-render
 */
function App() {
  const [state, dispatch] = useMediator();

  return (
    <div className="app-root">
      {state.view === 'library' ? (
        <Library state={state} dispatch={dispatch} />
      ) : (
        <Simulator state={state} dispatch={dispatch} />
      )}
    </div>
  );
}

export default App;
