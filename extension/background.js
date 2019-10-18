chrome.runtime.onMessage.addListener((request, sender, sendResponce) => {});

chrome.browserAction.onClicked.addListener(tab => {
  chrome.tabs.create({
    url: "popup.html",
  });
});

//chrome.extension.getBackgroundPage();
