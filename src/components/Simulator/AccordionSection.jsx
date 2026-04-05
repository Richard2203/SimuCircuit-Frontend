/**
 * AccordionSection — Sección colapsable del panel de cálculos.
 * El estado abierto/cerrado vive en el Mediator (openAccordions).
 *
 * @param {{
 *   id: string,
 *   title: string,
 *   icon: string,
 *   state: object,
 *   dispatch: Function,
 *   children: React.ReactNode
 * }} props
 */
export function AccordionSection({ id, title, icon, state, dispatch, children }) {
  const isOpen = !!state.openAccordions[id];

  return (
    <div className="accordion-wrap">
      <button
        className="accordion-header"
        onClick={() => dispatch('TOGGLE_ACCORDION', id)}
        aria-expanded={isOpen}
        aria-controls={`accordion-body-${id}`}
      >
        <div className="accordion-title">
          <span className="accordion-icon">{icon}</span>
          <span>{title}</span>
        </div>
        <span className="accordion-chevron">{isOpen ? '∧' : '∨'}</span>
      </button>

      {isOpen && (
        <div
          id={`accordion-body-${id}`}
          className="accordion-body"
          role="region"
        >
          {children}
        </div>
      )}
    </div>
  );
}
