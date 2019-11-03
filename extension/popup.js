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

      const actionButton = document.querySelector(".action-button");
      if (request.watchStatus === true) {
        actionButton.innerText = "Stop live reload";
      } else {
        actionButton.innerText = "Run live reload";
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
      sendMessage({
        watch: !e.target.classList.contains("action-button__active"),
      });
    });

    sendMessage({
      getInfo: true,
    });
  });
})();
