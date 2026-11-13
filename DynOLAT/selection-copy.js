document.addEventListener("copy", event => {
  if (event.defaultPrevented || !event.clipboardData) return;

  const active = document.activeElement;
  const editing = active?.isContentEditable || active instanceof HTMLTextAreaElement
    || (active instanceof HTMLInputElement
      && !["checkbox", "radio", "range", "button", "submit", "reset"].includes(active.type));
  if (editing) return;

  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;

  // Keep paragraph breaks and code indentation, but omit empty boundary lines.
  const text = selection.toString().replace(/^(?:[ \t]*\r?\n)+|(?:\r?\n[ \t]*)+$/g, "");
  if (!text) return;

  // Rich selection HTML can contain adjacent, nonselectable media and their
  // accessible labels. Copy only the selected text, without link/media markup.
  event.clipboardData.clearData();
  event.clipboardData.setData("text/plain", text);
  event.preventDefault();
});
