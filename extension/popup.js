/*
let xhr = new XMLHttpRequest();
xhr.open("GET", window.location + "?as=" + Date.now());
xhr.send();
xhr.onload = function () {
    console.log(`Loaded: ${xhr.status} ${xhr.response}`);
};

xhr.onerror = function () {
    console.log(`Network Error`);
};

xhr.onprogress = function (event) {
    console.log(`Received ${event.loaded} of ${event.total}`);
};
*/

chrome.runtime.sendMessage({
  url: window.location.href,
  count: 12,
});
