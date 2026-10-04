"use strict";

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("a.is-placeholder").forEach((link) => {
    link.addEventListener("click", (event) => event.preventDefault());
  });

  const copyButton = document.querySelector("#copy-bibtex");
  const bibtexCode = document.querySelector("#bibtex-code");
  let resetTimer;

  if (!copyButton || !bibtexCode) {
    return;
  }

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(bibtexCode.textContent.trim());
      copyButton.textContent = "Copied!";
      clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        copyButton.textContent = "Copy";
      }, 1800);
    } catch (error) {
      copyButton.textContent = "Try again";
      window.setTimeout(() => {
        copyButton.textContent = "Copy";
      }, 1800);
    }
  });
});
