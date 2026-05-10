const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const UPLOAD_URL    = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**
 * Sube un archivo de imagen a Cloudinary.
 *
 * @param {File} file — archivo de imagen seleccionado por el usuario
 * @returns {Promise<string>} URL publica de la imagen subida
 * @throws {Error} si la subida falla o las variables de entorno no estan configuradas
 */
export async function uploadImage(file) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary no está configurado. ' +
      'Define VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET en tu .env'
    );
  }

  const formData = new FormData();
  formData.append('file',         file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder',        'simucircuit/suggestions');

  const res = await fetch(UPLOAD_URL, { method: 'POST', body: formData });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Cloudinary error ${res.status}: ${detail}`);
  }

  const { secure_url } = await res.json();
  return secure_url;
}
