(function () {
  "use strict";

  const modalShell = document.getElementById("zrTukarModalShell");
  if (!modalShell) return;

  const modalBackdrop = document.getElementById("zrTukarModalBackdrop");
  const modalClose = document.getElementById("zrTukarModalClose");
  const optionGrid = document.getElementById("zrTukarOptionGrid");

  function openModal() {
    modalShell.hidden = false;
    modalShell.classList.add("is-open");
    document.body.classList.add("zr-modal-open");
  }

  function closeModal() {
    modalShell.classList.remove("is-open");
    document.body.classList.remove("zr-modal-open");
    window.setTimeout(function () {
      modalShell.hidden = true;
    }, 140);
  }

  function onOptionGridClick(event) {
    const card = event.target && event.target.closest
      ? event.target.closest(".zr-option-card")
      : null;
    if (!card) return;

    if (card.classList.contains("active")) {
      event.preventDefault();
      openModal();
    }
  }

  if (modalBackdrop) modalBackdrop.addEventListener("click", closeModal);
  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (optionGrid) optionGrid.addEventListener("click", onOptionGridClick);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !modalShell.hidden) {
      closeModal();
    }
  });

  // Auto-open form popup on category pages so users do not need to scroll.
  openModal();
})();
