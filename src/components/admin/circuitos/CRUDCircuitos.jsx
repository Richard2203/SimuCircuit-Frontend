import { useState, useEffect } from 'react';
import { circuitosAdminService } from '../../../services/admin/circuitosAdminService';
import { FormularioCircuito }    from './FormularioCircuito';
import { PanelListaCircuitos }   from './PanelListaCircuitos';

/**
 * CRUDCircuitos — Pestaña 2 del panel: gestion completa de circuitos.
 * Orquesta: FormularioCircuito, PanelListaCircuitos, modales.
 */
export function CRUDCircuitos() {
  const [circuitos,  setCircuitos]  = useState([]);
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [modoForm,   setModoForm]   = useState('crear'); // 'crear' | 'editar'
  const [editCircuito, setEditCircuito] = useState(null);
  const [editNetlist,  setEditNetlist]  = useState([]);
  const [cargandoEdit, setCargandoEdit] = useState(false);

  useEffect(() => { cargarCircuitos(); }, []);

  async function cargarCircuitos() {
    try {
      const data = await circuitosAdminService.obtenerCircuitos();
      setCircuitos(data);
    } catch (e) {
      console.error('Error cargando circuitos:', e);
    }
  }

  async function handleEliminar(circuito) {
    try {
      await circuitosAdminService.eliminarCircuito({ id: circuito.id });
      cargarCircuitos();
    } catch {
      alert('Error al eliminar el circuito.');
    }
  }

  async function handleSeleccionarEditar(circuito) {
    setCargandoEdit(true);
    try {
      const detalle = await circuitosAdminService.obtenerCircuitoPorId({ id: circuito.id });
      setEditCircuito(detalle?.circuito ?? circuito);
      setEditNetlist(detalle?.netlist  ?? []);
      setModoForm('editar');
    } catch {
      setEditCircuito(circuito);
      setEditNetlist([]);
      setModoForm('editar');
    } finally {
      setCargandoEdit(false);
    }
  }

  function handleNuevoCircuito() {
    setEditCircuito(null);
    setEditNetlist([]);
    setModoForm('crear');
  }

  function handleGuardado() {
    cargarCircuitos();
    // Permanecer en el formulario para confirmacion visual
  }

  return (
    <div style={container}>

      {/* ── Barra de acciones ── */}
      <div style={actionBar}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={handleNuevoCircuito} style={btnPrimary}>
            + Nuevo circuito
          </button>
          <button onClick={() => setPanelAbierto(true)} style={btnSecondary}>
            ≡ Ver listado ({circuitos.length})
          </button>
        </div>

        {cargandoEdit && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cargando datos del circuito…</span>
        )}
      </div>

      {/* ── Indicador de modo ── */}
      <div style={modoBadge}>
        <span style={modoDot(modoForm)} />
        {modoForm === 'crear' ? 'Modo: Nuevo circuito' : `Modo: Editando — ${editCircuito?.nombre_circuito ?? editCircuito?.nombre ?? '…'}`}
      </div>

      {/* ── Formulario principal ── */}
      <FormularioCircuito
        key={modoForm === 'editar' ? (editCircuito?.id ?? 'edit') : 'nuevo'}
        modo={modoForm}
        circuitoInicial={editCircuito}
        netlistInicial={editNetlist}
        onGuardar={handleGuardado}
        onCancelar={() => { setModoForm('crear'); setEditCircuito(null); setEditNetlist([]); }}
      />

      {/* ── Panel lateral de lista ── */}
      <PanelListaCircuitos
        abierto={panelAbierto}
        circuitos={circuitos}
        onCerrar={() => setPanelAbierto(false)}
        onEditar={handleSeleccionarEditar}
        onEliminar={handleEliminar}
      />
    </div>
  );
}

const container  = { display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, flex: 1 };
const actionBar  = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '4px 0', flexWrap: 'wrap' };
const btnPrimary  = { padding: '9px 18px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const btnSecondary= { padding: '9px 18px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 13, cursor: 'pointer' };
const modeBadge  = { fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', alignSelf: 'flex-start' };
const modoBadge  = modeBadge;
const modoDot    = (modo) => ({
  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
  background: modo === 'crear' ? 'var(--success)' : 'var(--warning)',
});
