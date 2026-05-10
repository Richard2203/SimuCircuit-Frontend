import { useState, useRef, useCallback } from 'react';
import { uploadImage }          from '../../services/suggestion/cloudinaryService';
import { sendSuggestionEmail }  from '../../services/suggestion/emailService';

/** @typedef {'idle'|'uploading'|'sending'|'success'|'error'} SubmitStatus */

const INITIAL_FORM = { nombre: '', tema: '', foto: null };

/**
 * @returns {{
 *   form:         { nombre: string, tema: string, foto: File|null },
 *   status:       SubmitStatus,
 *   errorMessage: string,
 *   fileRef:      React.RefObject,
 *   canSubmit:    boolean,
 *   handleChange: (e: Event) => void,
 *   handleFile:   (e: Event) => void,
 *   handleRemoveFile: () => void,
 *   handleSubmit: (e: Event) => Promise<void>,
 * }}
 */
export function useSuggestionForm() {
  const [form,         setForm]         = useState(INITIAL_FORM);
  const [status,       setStatus]       = useState(/** @type {SubmitStatus} */ ('idle'));
  const [errorMessage, setErrorMessage] = useState('');
  const fileRef = useRef(null);

  /* Handlers de campos */

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleFile = useCallback((e) => {
    const file = e.target.files?.[0] ?? null;
    setForm(prev => ({ ...prev, foto: file }));
  }, []);

  const handleRemoveFile = useCallback(() => {
    setForm(prev => ({ ...prev, foto: null }));
    if (fileRef.current) fileRef.current.value = '';
  }, []);

  /* Submit: Cloudinary -> EmailJS */

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.tema.trim()) return;

    setErrorMessage('');

    try {
      /* Paso 1: subir imagen */
      let photoUrl = '';
      if (form.foto) {
        setStatus('uploading');
        photoUrl = await uploadImage(form.foto);
      }

      /* Paso 2: enviar correo con la URL resultante */
      setStatus('sending');
      await sendSuggestionEmail({
        circuitName: form.nombre.trim(),
        topic:       form.tema.trim(),
        photoUrl,
      });

      /* Exito: limpiar formulario */
      setStatus('success');
      setForm(INITIAL_FORM);
      if (fileRef.current) fileRef.current.value = '';

    } catch (err) {
      console.error('[SuggestionForm]', err);
      setErrorMessage(err.message ?? 'Error desconocido');
      setStatus('error');
    }
  }, [form]);

  const canSubmit =
    form.nombre.trim().length > 0 &&
    form.tema.trim().length   > 0 &&
    status !== 'uploading'        &&
    status !== 'sending';

  return {
    form,
    status,
    errorMessage,
    fileRef,
    canSubmit,
    handleChange,
    handleFile,
    handleRemoveFile,
    handleSubmit,
  };
}
