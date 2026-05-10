const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const DEST_EMAIL  = import.meta.env.VITE_DEST_EMAIL;

const EMAILJS_API = 'https://api.emailjs.com/api/v1.0/email/send';

/**
 * @typedef {Object} SuggestionPayload
 * @property {string} circuitName — nombre del circuito sugerido
 * @property {string} topic       — tema al que pertenece
 * @property {string} photoUrl    — URL publica de Cloudinary
 */

/**
 * Envia la sugerencia de circuito al correo de destino.
 *
 * @param {SuggestionPayload} payload
 * @returns {Promise<void>}
 * @throws {Error} si el envio falla o las variables de entorno no estan configuradas
 */
export async function sendSuggestionEmail({ circuitName, topic, photoUrl }) {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    throw new Error(
      'EmailJS no está configurado. ' +
      'Define VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID y VITE_EMAILJS_PUBLIC_KEY en tu .env'
    );
  }

  const body = JSON.stringify({
    service_id:  SERVICE_ID,
    template_id: TEMPLATE_ID,
    user_id:     PUBLIC_KEY,
    template_params: {
      to_email:     DEST_EMAIL,
      circuit_name: circuitName,
      topic,
      photo_url:    photoUrl || 'Sin imagen adjunta',
    },
  });

  const res = await fetch(EMAILJS_API, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`EmailJS error ${res.status}: ${detail}`);
  }
}
