(function() {
  const updateMessage = {
    update: true,
  };
  const refreshActionHandler = () => {
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      tabs => {
        chrome.tabs.sendMessage(tabs[0].id, updateMessage);
        window.close();
      }
    );
  };
  window.addEventListener("load", () => {
    const button = document.getElementById("refreshButton");
    button.addEventListener("click", refreshActionHandler);

    refreshActionHandler();
  });
})();
