"use strict";

const toogleIcon = isSetActive => {
  if (isSetActive) {
    chrome.browserAction.setIcon({ path: "images/naz_128.png" });
  } else {
    chrome.browserAction.setIcon({ path: "images/naz_d_128.png" });
  }
};

chrome.runtime.onMessage.addListener(async (request, sender, sendResponce) => {
  if (!sender.tab || sender.tab.active !== true) {
    return;
  }

  if ("watchStatus" in request) {
    toogleIcon(request.watchStatus);
  }
});

const sendMessage = message => {
  chrome.tabs.query(
    {
      active: true,
      currentWindow: true,
    },
    tabs => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, message);
      }
    }
  );
};

chrome.tabs.onActiveChanged.addListener(() => {
  toogleIcon(false);
  sendMessage({
    getInfo: true,
  });
});

chrome.browserAction.onClicked.addListener(() => {
  sendMessage({
    toggleState: true,
    getInfo: true,
  });
});
