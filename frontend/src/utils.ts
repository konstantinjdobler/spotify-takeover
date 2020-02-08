export function removeActionFromUrl() {
  var uri = window.location.toString();
  if (uri.indexOf("?action=") > 0) {
    var clean_uri = uri.substring(0, uri.indexOf("?"));
    window.history.replaceState({}, document.title, clean_uri);
  }
}

export const isProd = process.env.REACT_APP_IS_PRODUCTION === "true";
export const API_URL = isProd ? process.env.REACT_APP_API_URL! : "http://localhost:33333";
