import { useSuggestionForm } from './useSuggestionForm';

/* Labels segun el estado del submit */
const STATUS_LABELS = {
  uploading: 'Subiendo imagen…',
  sending:   'Enviando correo…',
};

/* Sub-componente: campo de archivo custom */
function FileField({ foto, fileRef, onFile, onRemove }) {
  return (
    <div className="footer-field">
      <label className="filter-label" htmlFor="sug-foto">
        Foto del circuito{' '}
        <span style={{ color: 'var(--text-hint)', fontWeight: 400, textTransform: 'none' }}>
          (opcional)
        </span>
      </label>

      <label className="footer-file-label" htmlFor="sug-foto">
        <input
          ref={fileRef}
          id="sug-foto"
          type="file"
          name="foto"
          accept="image/*"
          onChange={onFile}
          style={{ display: 'none' }}
        />
        <span className={`footer-file-btn${foto ? ' footer-file-btn--has-file' : ''}`}>
          <span className="footer-file-icon">{foto ? '🖼️' : '📎'}</span>
          <span className="footer-file-name">
            {foto ? foto.name : 'Seleccionar imagen…'}
          </span>
          {foto && (
            <span
              className="footer-file-clear"
              role="button"
              tabIndex={0}
              title="Quitar imagen"
              onClick={ev => { ev.preventDefault(); onRemove(); }}
              onKeyDown={ev => ev.key === 'Enter' && onRemove()}
            >
              ✕
            </span>
          )}
        </span>
      </label>
    </div>
  );
}

/* Sub-componente: feedback de resultado */
function SubmitFeedback({ status, errorMessage }) {
  if (status === 'success') {
    return (
      <span className="footer-feedback footer-feedback--ok">
        ✓ ¡Sugerencia enviada con éxito!
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="footer-feedback footer-feedback--err" title={errorMessage}>
        ✗ Error al enviar. Inténtalo de nuevo.
      </span>
    );
  }
  return null;
}

/* Componente principal */
export function SuggestionForm() {
  const {
    form, status, errorMessage,
    fileRef, canSubmit,
    handleChange, handleFile, handleRemoveFile, handleSubmit,
  } = useSuggestionForm();

  const isBusy    = status === 'uploading' || status === 'sending';
  const btnLabel  = isBusy ? STATUS_LABELS[status] : '✉ Enviar sugerencia';

  return (
    <div className="footer-suggest-section">
      {/* Encabezado */}
      <div className="footer-suggest-header">
        <span className="footer-suggest-icon">💡</span>
        <div>
          <h3 className="footer-section-title">Sugiere un Circuito</h3>
          <p className="footer-section-desc">
            ¿Tienes un circuito que te gustaría ver en el simulador?
            Envíanos tu sugerencia y lo consideramos para una próxima actualización.
          </p>
        </div>
      </div>

      {/* Formulario */}
      <form className="footer-form" onSubmit={handleSubmit} noValidate>

        {/* Fila: nombre y tema */}
        <div className="footer-form-row">
          <div className="footer-field">
            <label className="filter-label" htmlFor="sug-nombre">
              Nombre del circuito <span className="footer-required">*</span>
            </label>
            <input
              id="sug-nombre"
              className="filter-input"
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ej. Filtro paso-bajas RC"
              maxLength={120}
              required
              autoComplete="off"
            />
          </div>

          <div className="footer-field">
            <label className="filter-label" htmlFor="sug-tema">
              Tema <span className="footer-required">*</span>
            </label>
            <input
              id="sug-tema"
              className="filter-input"
              type="text"
              name="tema"
              value={form.tema}
              onChange={handleChange}
              placeholder="Ej. Corriente Alterna"
              maxLength={120}
              required
              autoComplete="off"
            />
          </div>
        </div>

        {/* Campo de imagen */}
        <FileField
          foto={form.foto}
          fileRef={fileRef}
          onFile={handleFile}
          onRemove={handleRemoveFile}
        />

        {/* Acciones y feedback */}
        <div className="footer-form-actions">
          <button
            type="submit"
            className="control-btn primary"
            disabled={!canSubmit}
          >
            {isBusy && <span className="footer-spinner" />}
            {btnLabel}
          </button>

          <SubmitFeedback status={status} errorMessage={errorMessage} />
        </div>
      </form>
    </div>
  );
}
