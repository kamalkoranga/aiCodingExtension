// Set default state when extension is first installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ enabled: false });
  chrome.action.setBadgeText({ text: "OFF" });
  chrome.action.setBadgeBackgroundColor({ color: "red" });
});

// Toggle when icon is clicked
chrome.action.onClicked.addListener(async () => {
  const { enabled } = await chrome.storage.local.get("enabled");
  const newState = !enabled;
  await chrome.storage.local.set({ enabled: newState });

  chrome.action.setBadgeText({ text: newState ? "ON" : "OFF" });
  chrome.action.setBadgeBackgroundColor({ color: newState ? "green" : "red" });
});
