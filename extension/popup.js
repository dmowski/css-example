(function() {
  const sendMessage = message => {
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      tabs => {
        chrome.tabs.sendMessage(tabs[0].id, message);
      }
    );
  };

  const checkForUrl = function(url) {
    const urlList = getUrlList();
    if (urlList.includes(url)) {
      sendMessage({
        watch: true,
      });
    }
  };

  const getUrlList = function() {
    const stringFromStorage = localStorage.getItem("urlList");
    return stringFromStorage ? JSON.parse(stringFromStorage) : [];
  };

  const saveUrlList = function(arrayOfUrl) {
    const stringForSave = JSON.stringify(arrayOfUrl || []);
    localStorage.setItem("urlList", stringForSave);
  };

  const saveUrl = function(url) {
    const urlList = getUrlList();
    if (!urlList.includes(url)) {
      urlList.push(url);
    }
    saveUrlList(urlList);
  };

  const removeUrl = function(url) {
    const urlList = getUrlList();
    if (urlList.includes(url)) {
      urlList = urlList.filter(urlFromStorage => urlFromStorage !== url);
    }
    saveUrlList(urlList);
  };

  chrome.runtime.onMessage.addListener(
    async (request, sender, sendResponce) => {
      if (!sender.tab || sender.tab.active !== true) {
        return;
      }

      window.lastUrl = request.url;
      const actionButton = document.querySelector(".action-button");
      if (request.watchStatus === true) {
        actionButton.innerText = "Stop live reload";
        saveUrl(request.url);
      } else {
        actionButton.innerText = "Run live reload";
        checkForUrl(request.url);
      }

      actionButton.classList.toggle(
        "action-button__active",
        request.watchStatus
      );
    }
  );

  window.addEventListener("load", () => {
    const actionButton = document.querySelector(".action-button");

    actionButton.addEventListener("click", e => {
      const runWatch = !e.target.classList.contains("action-button__active");
      if (!runWatch) {
        removeUrl(window.lastUrl);
      }
      sendMessage({
        watch: runWatch,
      });
    });

    sendMessage({
      getInfo: true,
    });
  });
})();
