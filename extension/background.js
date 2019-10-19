/**
 * @param {HTMLElement} linkDOMnode
 * @param {HTMLElement} document HTMLdocument
 */
function setNewUrlToLinkNode(linkDOMnode) {
  const searchHashPreffix = "cssReloadHash";
  const oldUrl = linkDOMnode.getAttribute("href");
  const baseUrl = linkDOMnode.ownerDocument.location.toString();
  var newUrl = new URL(oldUrl, baseUrl);
  newUrl.searchParams.set(searchHashPreffix, Date.now());
  linkDOMnode.setAttribute("href", newUrl);
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
 */
function updateStyleForDocument(document) {
  const linkList = getLinkNodeListFromDocument(document);
  linkList.forEach(setNewUrlToLinkNode);
}

/**
 * @param {Object} window
 * @return {Array.HTMLElement} iframeList: [<iframe >]
 */
function getIframesRecursive(window) {
  return [...document.querySelectorAll("iframe")];
}

/**
 * @param {HTMLElement} iframeNodeElement
 * @return {Boolean} true if document correct for work
 */
function checkCorrectIframeDocument(iframeNodeElement) {
  return iframeNodeElement.contentDocument.readyState === "complete";
}

/**
 * @param {HTMLElement} iframeNodeElement
 * @return {HTMLElement} document from iframe
 */
function getDocumentFromIframe(iframeNodeElement) {
  return iframeNodeElement.contentDocument;
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
