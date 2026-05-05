import { useState, useEffect } from 'react';
import { FormularioCircuito }    from './FormularioCircuito';
import { PanelListaCircuitos }   from './PanelListaCircuitos';
import { ModalConfirmacion }     from '../shared/ModalConfirmacion';
import { circuitosAdminService } from '../../../services/admin/circuitosAdminService';

/**
 * CRUDCircuitos — Pestaña 2 del panel admin: alta/edicion de circuitos.
 *
 * `circuitosAdminService.obtenerCircuitos()` devuelve `Circuit[]`,
 * y `obtenerCircuitoPorId()` devuelve `{ circuito: Circuit, netlist: Component[] }`.
 */
export function CRUDCircuitos() {
  const [circuitos,        setCircuitos]    = useState([]);
  const [loadingLista,     setLoadingLista] = useState(false);
  const [panelAbierto,     setPanelAbierto] = useState(false);
  const [modo,             setModo]         = useState('crear');
  const [circuitoEditando, setCircuitoEditando] = useState(null);
  const [netlistEditando,  setNetlistEditando]  = useState([]);
  const [modalEliminar,    setModalEliminar]    = useState(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => { cargarLista(); }, []);

  async function cargarLista() {
    setLoadingLista(true);
    try {
      const data = await circuitosAdminService.obtenerCircuitos();
      setCircuitos(data);
    } catch { setCircuitos([]); }
    finally { setLoadingLista(false); }
  }

  function handleNuevo() {
    setModo('crear');
    setCircuitoEditando(null);
    setNetlistEditando([]);
    setPanelAbierto(false);
    setFormKey((k) => k + 1);
  }

  async function handleEditar(circuito) {
    try {
      const detalle = await circuitosAdminService.obtenerCircuitoPorId(circuito.id);
      setModo('editar');
      setCircuitoEditando(detalle.circuito ?? circuito);
      setNetlistEditando(detalle.netlist ?? []);
      setPanelAbierto(false);
      setFormKey((k) => k + 1);
    } catch {
      alert('No se pudo cargar el circuito.');
    }
  }

  async function handleEliminar(circuito) {
    try {
      await circuitosAdminService.eliminarCircuito({ id: circuito.id });
      setModalEliminar(null);
      if (modo === 'editar' && circuitoEditando?.id === circuito.id) {
        handleNuevo();
      }
      cargarLista();
    } catch { alert('Error al eliminar.'); }
  }

  function handleGuardado() {
    cargarLista();
  }

  return (
    <div className="admin-crud-container">

      <div className="admin-crud-actionbar">
        <div className="admin-crud-actionbar__group">
          <button className="admin-btn admin-btn--primary admin-btn--sm" onClick={handleNuevo}>
            + Nuevo
          </button>
          <button className="admin-btn admin-btn--secondary admin-btn--sm" onClick={() => setPanelAbierto(true)}>
            ≡ Ver listado ({circuitos.length})
          </button>
        </div>

        <div className="admin-mode-badge">
          <span className={`admin-mode-badge__dot ${modo === 'editar' ? 'admin-mode-badge__dot--editing' : ''}`} />
          {modo === 'editar'
            ? <>Editando: <strong style={{ color: 'var(--text)', marginLeft: 4 }}>{circuitoEditando?.nombre}</strong></>
            : 'Modo: Nuevo circuito'
          }
        </div>
      </div>

      <FormularioCircuito
        key={formKey}
        modo={modo}
        circuitoInicial={circuitoEditando}
        netlistInicial={netlistEditando}
        onGuardar={handleGuardado}
        onCancelar={handleNuevo}
      />

      <PanelListaCircuitos
        abierto={panelAbierto}
        circuitos={circuitos}
        loading={loadingLista}
        onCerrar={() => setPanelAbierto(false)}
        onEditar={handleEditar}
        onEliminar={(c) => setModalEliminar(c)}
      />

      <ModalConfirmacion
        abierto={!!modalEliminar}
        titulo="Eliminar circuito"
        mensaje={`¿Eliminar el circuito "${modalEliminar?.nombre}"? Esta acción no se puede deshacer.`}
        labelConfirmar="Eliminar"
        onConfirmar={() => handleEliminar(modalEliminar)}
        onCancelar={() => setModalEliminar(null)}
      />
    </div>
  );
}
