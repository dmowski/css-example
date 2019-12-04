const updatingList = {};
const extensionPreffix = "__cssLiveReload__";
const refresherProperty = extensionPreffix + "refresher";

async function digestMessage(message) {
  const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8); // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join(""); // convert bytes to hex string
  return hashHex;
}

function getFileHash(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const urlWithSalt = new URL(url.toString());
    urlWithSalt.searchParams.set("saltForGetHash", Date.now());
    xhr.open("HEAD", urlWithSalt, true);
    xhr.onreadystatechange = async () => {
      if (xhr.readyState == 4 && xhr.status != 304) {
        const lastModified = xhr.getResponseHeader("last-modified");
        const hash = await digestMessage(lastModified);
        if (updatingList[url] !== hash) {
          //TODO: bug with skip updating for iframes
          setTimeout(() => {
            updatingList[url] = hash;
          }, 1000);
          resolve(hash);
        } else {
          resolve();
        }
      }
    };
    xhr.send();
  });
}

/**
 * @param {HTMLElement} linkDOMnode
 * @param {HTMLElement} document HTMLdocument
 */
async function setNewUrlToLinkNode(linkDOMnode) {
  const oldUrl = linkDOMnode.getAttribute("href");
  const newUrl = await getUrlWithNewhash(oldUrl, linkDOMnode);
  if (newUrl) {
    linkDOMnode.setAttribute("href", newUrl);
  }
}

/**
 * @param {String} urlString
 * @param {HTMLElement} domNode need for detect document
 * @return {String} new url with new hash
 */
async function getUrlWithNewhash(urlString, domNode) {
  const searchHashPreffix = "cssReloadHash";
  const baseUrl = domNode.ownerDocument.baseURI;
  var newUrl = new URL(urlString, baseUrl);
  const hash = await getFileHash(newUrl);
  if (!hash) {
    return;
  }

  newUrl.searchParams.set(searchHashPreffix, hash);
  return newUrl;
}

/**
 * @param {HTMLElement} styleDOMnode
 * @param {HTMLElement} document HTMLdocument
 */
async function setNewUrlToStyleNode(styleDOMnode) {
  const cssString = styleDOMnode.innerHTML;
  // TODO: simpilfy regexp
  const re = /(?:@import)\s(?:url\()?\s?["\'](.*?)["\']\s?\)?(?:[^;]*);?/gi;
  let newString = cssString;
  const updatingLinks = [];

  //TODO: check for copy of imports
  cssString.replace(re, (match, g1) => {
    const replacePromise = new Promise(async (resolve, reject) => {
      const newUrl = await getUrlWithNewhash(g1, styleDOMnode);
      if (newUrl) {
        newString = newString.replace(g1, newUrl);
      }
      resolve();
    });
    updatingLinks.push(replacePromise);
  });

  await Promise.all(updatingLinks);
  if (styleDOMnode.innerHTML !== newString) {
    styleDOMnode.innerHTML = newString;
  }
}

/**
 * @param {HTMLElement} document HTMLdocument
 */
async function updateStyleForDocument(document) {
  const linkList = [...document.querySelectorAll("link[rel=stylesheet]")];
  const updatingOfLinks = linkList.map(setNewUrlToLinkNode);

  const styleNodeList = [...document.querySelectorAll("style")];
  styleNodeList.map(setNewUrlToStyleNode);

  const updatingOfStyleTags = [];

  await Promise.all([...updatingOfLinks, ...updatingOfStyleTags]);
}

/**
 * @param {Object} window
 * @return {Array.HTMLElement} iframeList: [<iframe >]
 */
function getIframesRecursive(win) {
  let iframes = [...win.document.querySelectorAll("iframe")];
  iframes = iframes.filter(checkCorrectIframeDocument);

  let allChildIframes = [];
  iframes.forEach(iframe => {
    const childIframeWindow = iframe.contentWindow;
    const childIframesRecursive = getIframesRecursive(childIframeWindow);
    allChildIframes = [...allChildIframes, ...childIframesRecursive];
  });

  return [...allChildIframes, ...iframes];
}

/**
 * @param {HTMLElement} iframeNodeElement
 * @return {Boolean} true if document correct for work
 */
function checkCorrectIframeDocument(iframeNodeElement) {
  const doc = iframeNodeElement.contentDocument;
  return doc && doc.readyState === "complete";
}

/**
 * @param {Object} window
 * @return {Array.HTMLElement} list of documents form all iframes
 */
function getAllDocumentsFromWindow(window) {
  const allChildIframes = getIframesRecursive(window);
  const childDocuments = allChildIframes
    .filter(checkCorrectIframeDocument)
    .map(iframe => iframe.contentDocument);

  return [window.document, ...childDocuments];
}

async function refreshStyle() {
  const documents = getAllDocumentsFromWindow(window);
  const updatingDocuments = documents.map(updateStyleForDocument);
  await Promise.all(updatingDocuments);
}

const toggleInterval = isRun => {
  if (isRun) {
    window[refresherProperty] = setInterval(refreshStyle, 700);
  } else {
    clearInterval(window[refresherProperty]);
    delete window[refresherProperty];
  }
};

const isRunnedWatcher = () => {
  return !!window[refresherProperty];
};

// -----------------

const getUrlList = async function() {
  return new Promise(resolve => {
    chrome.storage.sync.get("urlList", function(result) {
      const urlList = result.urlList || [];
      resolve(urlList);
    });
  });
};

const getCurrentUrl = () => {
  return window.location.origin;
};

const isUrlForWatcher = async () => {
  const urlList = await getUrlList();
  const currentUrl = getCurrentUrl();
  return urlList.includes(currentUrl);
};

const saveUrlList = async function(arrayOfUrl) {
  return new Promise(resolve => {
    chrome.storage.sync.set({ urlList: arrayOfUrl }, function() {
      resolve();
    });
  });
};

const removeUrl = async function() {
  const currentUrl = getCurrentUrl();
  const urlList = await getUrlList();

  if (urlList.includes(currentUrl)) {
    const newUrlList = urlList.filter(
      urlFromStorage => urlFromStorage !== currentUrl
    );
    await saveUrlList(newUrlList);
  }
};

const saveCurrentUrl = async function() {
  const currentUrl = getCurrentUrl();
  const urlList = await getUrlList();
  if (!urlList.includes(currentUrl)) {
    urlList.push(currentUrl);
  }
  await saveUrlList(urlList);
};

///------------------------

function sendRefreshStatus() {
  chrome.runtime.sendMessage({
    watchStatus: isRunnedWatcher(),
  });
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponce) => {
  if (request.watch === true) {
    toggleInterval(true);
    saveCurrentUrl();
  }

  if (request.watch === false) {
    toggleInterval(false);
    removeUrl();
  }

  if (request.getInfo === true) {
    sendRefreshStatus();
  }
});

///------------------------

(async () => {
  const isNeedRun = await isUrlForWatcher();
  if (isNeedRun) {
    toggleInterval(true);
    sendRefreshStatus();
  }
})();
