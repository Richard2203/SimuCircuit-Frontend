import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { catalogoComponentesService } from '../../../services/admin/catalogoComponentesService';
import { construirCatalogosDesdeAPI, CATALOGO_VACIO } from './modelosCatalog';

/**
 * CatalogoComponentesContext - El catalogo se obtiene UNA sola vez por sesion
 *
 * Si el catalogo esta cargando, se recibe CATALOGO_VACIO y se espera del flag loading.
 */

const CatalogoContext = createContext({
  catalogo: CATALOGO_VACIO,
  loading:  false,
  error:    null,
  recargar: () => {},
});

export function CatalogoComponentesProvider({ children }) {
  const [catalogo, setCatalogo] = useState(CATALOGO_VACIO);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await catalogoComponentesService.fetchCatalogoCrudo();
      setCatalogo(construirCatalogosDesdeAPI(raw));
    } catch (e) {
      setError(e?.message ?? 'Error al cargar el catálogo de componentes.');
      setCatalogo(CATALOGO_VACIO);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    // Al desmontar el provider invalidamos la cache para que
    // la proxima sesion pida los datos al backend de nuevo.
    return () => { catalogoComponentesService.invalidarCache(); };
  }, [cargar]);

  const recargar = useCallback(() => {
    catalogoComponentesService.invalidarCache();
    cargar();
  }, [cargar]);

  const value = useMemo(
    () => ({ catalogo, loading, error, recargar }),
    [catalogo, loading, error, recargar]
  );

  return (
    <CatalogoContext.Provider value={value}>
      {children}
    </CatalogoContext.Provider>
  );
}

/**
 * Hook para acceder al catalogo cargado.
 *
 * @returns {{
 *   catalogo: {
 *     MODELOS_BJT: Array,
 *     MODELOS_FET: Array,
 *     MODELOS_REGULADOR: Array,
 *     MODELOS_DIODO: Array,
 *     MODELOS_LED: Array,
 *     categorias: Array<{id:number, nombre:string, materia:string}>,
 *     unidades_medida: Array,
 *     fuentes: object,
 *   },
 *   loading: boolean,
 *   error: string | null,
 *   recargar: () => void,
 * }}
 */
export function useCatalogoComponentes() {
  return useContext(CatalogoContext);
}