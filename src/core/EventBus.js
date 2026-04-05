/**
 * EventBus — Pattern: Observer (pub/sub)
 * Desacopla emisores de receptores. Ningún componente
 * necesita conocer quién escucha sus eventos.
 */
class EventBus {
  constructor() {
    this._subscribers = {};
  }

  /**
   * Suscribirse a un evento.
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función a ejecutar
   * @returns {Function} Función para cancelar la suscripción
   */
  subscribe(event, callback) {
    if (!this._subscribers[event]) {
      this._subscribers[event] = [];
    }
    this._subscribers[event].push(callback);

    // Retorna un unsubscribe para limpiar en useEffect
    return () => {
      this._subscribers[event] = this._subscribers[event].filter(
        (fn) => fn !== callback
      );
    };
  }

  /**
   * Publicar un evento con datos opcionales.
   * @param {string} event - Nombre del evento
   * @param {*} data - Datos a enviar a los suscriptores
   */
  publish(event, data) {
    const handlers = this._subscribers[event] || [];
    handlers.forEach((fn) => fn(data));
  }
}

// Singleton compartido por toda la app
const eventBus = new EventBus();
export default eventBus;
