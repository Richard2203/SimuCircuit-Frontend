/**
 * catalogoComponentesService — Catalogo de componentes y categorias para el admin.
 *
 * Se cachea en memoria para no golpear el backend en cada apertura del formulario.
 * La cache se invalida manualmente con invalidarCache() o al hacer logout.
 */

import { apiClient } from '../simulator/apiClient';

let _cache        = null;
let _cachePromise = null;

/**
 * Obtiene el catalogo crudo del backend (con cache de sesion).
 * @returns {Promise<object>}
 */
async function fetchCatalogoCrudo() {
  if (_cache)        return _cache;
  if (_cachePromise) return _cachePromise;

  _cachePromise = apiClient
    .get('/api/admin/circuitos-lista/componentes')
    .then((res) => {
      _cache = res;
      return res;
    })
    .catch((e) => {
      // Permitir reintento si falla
      _cachePromise = null;
      throw e;
    });

  return _cachePromise;
}

/** Invalida la cache */
function invalidarCache() {
  _cache        = null;
  _cachePromise = null;
}

export const catalogoComponentesService = {
  fetchCatalogoCrudo,
  invalidarCache,
};