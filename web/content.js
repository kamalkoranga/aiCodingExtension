(function () {
  let popup = null;

  async function isEnabled() {
    const { enabled } = await chrome.storage.local.get("enabled");
    return !!enabled; // force true/false
  }

  document.addEventListener("mouseup", async () => {
    if (!(await isEnabled())) {
      if (popup) { popup.remove(); popup = null; }
      return;
    }

    const selectedText = window.getSelection().toString().trim();
    if (!selectedText) {
      if (popup) { popup.remove(); popup = null; }
      return;
    }

    if (popup) popup.remove();

    popup = document.createElement("div");
    popup.innerText = selectedText;
    popup.style.position = "absolute";
    popup.style.background = "#333";
    popup.style.color = "white";
    popup.style.padding = "8px 12px";
    popup.style.borderRadius = "6px";
    popup.style.fontSize = "14px";
    popup.style.zIndex = "999999";
    popup.style.maxWidth = "250px";
    popup.style.wordWrap = "break-word";
    popup.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";

    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    popup.style.top = `${window.scrollY + rect.bottom + 5}px`;
    popup.style.left = `${window.scrollX + rect.left}px`;

    document.body.appendChild(popup);
  });

  document.addEventListener("mousedown", (e) => {
    if (popup && !popup.contains(e.target)) {
      popup.remove();
      popup = null;
    }
  });
})();
