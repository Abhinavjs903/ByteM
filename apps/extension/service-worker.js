chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);
  }
});

chrome.runtime.onStartup?.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "BYTEM_GET_ACTIVE_TAB") return;
  chrome.tabs.query({ active: true, lastFocusedWindow: true }).then(tabs => {
    sendResponse({ url: tabs[0]?.url ?? "", title: tabs[0]?.title ?? "" });
  }).catch(error => sendResponse({ error: String(error) }));
  return true;
});
