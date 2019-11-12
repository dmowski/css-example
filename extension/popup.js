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

  const checkForUrl = async function(url) {
    const urlList = await getUrlList();
    if (urlList.includes(url)) {
      sendMessage({
        watch: true,
      });
    }
  };

  const getUrlList = async function() {
    return new Promise(resolve => {
      chrome.storage.sync.get("urlList", function(result) {
        const urlList = result.urlList || [];
        resolve(urlList);
      });
    });
  };

  const saveUrlList = async function(arrayOfUrl) {
    return new Promise(resolve => {
      chrome.storage.sync.set({ urlList: arrayOfUrl }, function() {
        console.log("Saved", arrayOfUrl);
        resolve();
      });
    });
  };

  const saveUrl = async function(url) {
    const urlList = await getUrlList();
    if (!urlList.includes(url)) {
      urlList.push(url);
    }
    await saveUrlList(urlList);
  };

  const removeUrl = async function(url) {
    const urlList = await getUrlList();
    if (urlList.includes(url)) {
      urlList = urlList.filter(urlFromStorage => urlFromStorage !== url);
    }
    await saveUrlList(urlList);
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
        await saveUrl(request.url);
      } else {
        actionButton.innerText = "Run live reload";
        await checkForUrl(request.url);
      }

      actionButton.classList.toggle(
        "action-button__active",
        request.watchStatus
      );
    }
  );

  window.addEventListener("load", () => {
    const actionButton = document.querySelector(".action-button");

    actionButton.addEventListener("click", async e => {
      const runWatch = !e.target.classList.contains("action-button__active");
      if (!runWatch) {
        await removeUrl(window.lastUrl);
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
