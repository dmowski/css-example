/**
 * @param {String} urlString /sdsdad.php
 * @return {String} /sdsdad.php?cssReloadHash=12344455
 */
function setNewHashToUrl(urlString) {}

/**
 * @param {HTMLElement} linkDOMnode <link rel="stylesheet" href="css/main.css">
 * @return {String} css/main.css
 */
function getUrlFromLinkNode(linkDOMnode) {}

/**
 * @param {HTMLElement} linkDOMnode <link rel="stylesheet" href="css/main.css">
 * @param {String} urlString /sdsdad.php
 */
function setUrlToLinkNode(linkDOMnode, newUrl) {}

/**
 * @param {HTMLElement} document HTMLdocument
 * @return {Array.HTMLElement} NodeList: [<link rel="stylesheet" href="css/main.css">]
 */
function getLinkNodeListFromDocument(document) {}

/**
 * @param {HTMLElement} document HTMLdocument
 */
function updateStyleForDocument(document) {
  const linkList = getLinkNodeListFromDocument(document);
  linkList.forEach(link => {
    const oldUrl = getUrlFromLinkNode(link);
    const newUrl = setNewHashToUrl(oldUrl);
    setUrlToLinkNode(link, newUrl);
  });
}

/**
 * @param {Object} window
 * @return {Array.HTMLElement} iframeList: [<iframe >]
 */
function getIframesRecursive(window) {}

/**
 * @param {HTMLElement} iframeNodeElement
 * @return {Boolean} true if document correct for work
 */
function checkCorrectIframeDocument(iframeNodeElement) {}

/**
 * @param {HTMLElement} iframeNodeElement
 * @return {HTMLElement} document from iframe
 */
function getDocumentFromIframe(iframeNodeElement) {}

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
  const documents = getAllDocumentsFromWindow(window);
  documents.forEach(updateStyleForDocument);
}
