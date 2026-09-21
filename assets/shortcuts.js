(() => {
  "use strict";

  function isTyping(target) {
    return target instanceof HTMLInputElement
      || target instanceof HTMLTextAreaElement
      || target instanceof HTMLSelectElement
      || target?.isContentEditable;
  }

  function click(selector) {
    const element = document.querySelector(selector);
    if (element instanceof HTMLElement) element.click();
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
      return;
    }

    if (isTyping(event.target)) return;

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      click("#openCaseButton");
      return;
    }

    if (event.key === "1") click('[data-view="overview"]');
    if (event.key === "2") click('[data-view="cases"]');
    if (event.key === "3") click('[data-view="analytics"]');

    if (event.key.toLowerCase() === "n") click("#openCaseButton");
    if (event.key.toLowerCase() === "e") click("#exportButton");

    if (event.key === "/" && location.hash === "#cases") {
      event.preventDefault();
      document.querySelector("#caseSearch")?.focus();
    }
  });
})();
