/**
 * apiClient — Cliente HTTP base
 * Centraliza fetch, manejo de errores y serialización para toda la capa de servicios.
 */

const BASE_URL = 'http://localhost:3001';

/**
 * Error enriquecido para respuestas de la API.
 */
export class ApiError extends Error {
  constructor(mensaje, status, data = null) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Wrapper de fetch con manejo de errores centralizado.
 * @param {string} path - Ruta relativa a BASE_URL
 * @param {RequestInit} options - Opciones de fetch
 * @returns {Promise<any>} - Cuerpo JSON de la respuesta
 */
async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;

  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  let body;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(`Respuesta no válida del servidor (${response.status})`, response.status);
  }

  if (!response.ok) {
    const mensaje = body?.mensaje ?? `Error ${response.status}`;
    throw new ApiError(mensaje, response.status, body);
  }

  return body;
}

export const apiClient = {
  get(path) {
    return request(path);
  },

  post(path, body) {
    return request(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};