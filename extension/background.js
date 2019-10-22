/**
 * @param {HTMLElement} linkDOMnode
 * @param {HTMLElement} document HTMLdocument
 */
function setNewUrlToLinkNode(linkDOMnode) {
  const oldUrl = linkDOMnode.getAttribute("href");
  linkDOMnode.setAttribute("href", getUrlWithNewhash(oldUrl, linkDOMnode));
}

/**
 * @param {String} urlString
 * @param {HTMLElement} domNode need for detect document
 * @return {String} new url with new hash
 */
function getUrlWithNewhash(urlString, domNode) {
  const searchHashPreffix = "cssReloadHash";
  const baseUrl = domNode.ownerDocument.baseURI;
  var newUrl = new URL(urlString, baseUrl);
  newUrl.searchParams.set(searchHashPreffix, Date.now());
  return newUrl;
}

/**
 * @param {HTMLElement} styleDOMnode
 * @param {HTMLElement} document HTMLdocument
 */
function setNewUrlToStyleNode(styleDOMnode) {
  const cssString = styleDOMnode.innerHTML;
  const re = /(?:@import)\s(?:url\()?\s?["\'](.*?)["\']\s?\)?(?:[^;]*);?/gi;
  let newString = cssString;
  cssString.replace(re, (match, g1) => {
    const newUrl = getUrlWithNewhash(g1, styleDOMnode);
    newString = newString.replace(g1, newUrl);
  });
  styleDOMnode.innerHTML = newString;
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
function updateStyleForDocument(document) {
  const linkList = getLinkNodeListFromDocument(document);
  linkList.forEach(setNewUrlToLinkNode);

  const styleNodeList = getStyleNodeListFromDocument(document);
  styleNodeList.forEach(setNewUrlToStyleNode);
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
  const doc = getDocumentFromIframe(iframeNodeElement);
  return doc && doc.readyState === "complete";
}

/**
 * @param {HTMLElement} iframeNodeElement
 * @return {HTMLElement} document from iframe
 */
function getDocumentFromIframe(iframeNodeElement) {
  return iframeNodeElement.contentDocument;
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
  const correctChildIframes = allChildIframes.filter(
    checkCorrectIframeDocument
  );
  const childDocuments = correctChildIframes.map(getDocumentFromIframe);

  return [window.document, ...childDocuments];
}

/**
 */
function refreshStyle() {
  console.log("Start refreshStyle");

  const documents = getAllDocumentsFromWindow(window);
  documents.forEach(updateStyleForDocument);
}

window.addEventListener("load", () => {
  setTimeout(refreshStyle, 700);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponce) => {
  console.log("Background message listener:", request, sender, sendResponce);
  if (request.update) {
    refreshStyle();
  }
});
