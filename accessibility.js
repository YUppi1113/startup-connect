(function () {
  const modalState = new WeakMap();

  function trapFocus(modal) {
    const focusable = modal.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    function handle(e) {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      } else if (e.key === 'Escape') {
        closeModal(modal.id);
      }
    }
    modal.addEventListener('keydown', handle);
  }

  window.openModal = function (id, opener) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('hidden');
    modalState.set(modal, opener || document.activeElement);
    const first = modal.querySelector('input, button, select, textarea, a[href]');
    if (first) first.focus();
    if (!modal.dataset.trap) {
      trapFocus(modal);
      modal.dataset.trap = 'true';
    }
  };

  window.closeModal = function (id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('hidden');
    const opener = modalState.get(modal);
    if (opener) opener.focus();
  };
})();
