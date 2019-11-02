const updatingList = {};

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
 * @return {Array.HTMLElement} NodeList: [<link rel="stylesheet" href="css/main.css">]
 */
function getLinkNodeListFromDocument(document) {
  return [...document.querySelectorAll("link[rel=stylesheet]")];
}

/**
 * @param {HTMLElement} document HTMLdocument
 * @return {Array.HTMLElement} NodeList: [<style >]
 */
function getStyleNodeListFromDocument(document) {
  return [...document.querySelectorAll("style")];
}

/**
 * @param {Object} window HTMLdocument
 * @return {Array.HTMLElement} NodeList: [<iframe >]
 */
function getIframeNodeListFromDocument(win) {
  return [...win.document.querySelectorAll("iframe")];
}

/**
 * @param {HTMLElement} document HTMLdocument
 */
async function updateStyleForDocument(document) {
  const linkList = getLinkNodeListFromDocument(document);
  const updatingOfLinks = linkList.map(setNewUrlToLinkNode);

  const styleNodeList = getStyleNodeListFromDocument(document);
  styleNodeList.map(setNewUrlToStyleNode);

  const updatingOfStyleTags = [];

  await Promise.all([...updatingOfLinks, ...updatingOfStyleTags]);
}

/**
 * @param {Object} window
 * @return {Array.HTMLElement} iframeList: [<iframe >]
 */
function getIframesRecursive(win) {
  let iframes = getIframeNodeListFromDocument(win);
  iframes = iframes.filter(checkCorrectIframeDocument);

  let allChildIframes = [];
  iframes.forEach(iframe => {
    const childIframeWindow = getWindowFromIframe(iframe);
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
 * @param {HTMLElement} iframeNodeElement
 * @return {Object} window from iframe
 */
function getWindowFromIframe(iframeNodeElement) {
  return iframeNodeElement.contentWindow;
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

/**
 */
async function refreshStyle() {
  console.log("Start refreshStyle");

  const documents = getAllDocumentsFromWindow(window);
  const updatingDocuments = documents.map(updateStyleForDocument);
  await Promise.all(updatingDocuments);
  console.log("End Of Updating");
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponce) => {
  console.log("Background message listener:", request, sender, sendResponce);
  if (request.update) {
    setInterval(refreshStyle, 700);
  }
});
