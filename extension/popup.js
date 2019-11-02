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

  chrome.runtime.onMessage.addListener(
    async (request, sender, sendResponce) => {
      if (!sender.tab || sender.tab.active !== true) {
        return;
      }
      const startWatchButton = document.getElementById("start-watch");
      const stopWatchButton = document.getElementById("stop-watch");
      if (request.watchStatus === true) {
        startWatchButton.style.display = "none";
        stopWatchButton.style.display = "block";
      } else {
        startWatchButton.style.display = "block";
        stopWatchButton.style.display = "none";
      }
    }
  );

  window.addEventListener("load", () => {
    const startWatchButton = document.getElementById("start-watch");
    startWatchButton.addEventListener("click", () => {
      sendMessage({
        watch: true,
      });
    });

    const stopWatchButton = document.getElementById("stop-watch");
    stopWatchButton.addEventListener("click", () => {
      sendMessage({
        watch: false,
      });
    });

    sendMessage({
      getInfo: true,
    });
  });
})();
