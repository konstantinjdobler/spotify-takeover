export function removeActionFromUrl() {
  var uri = window.location.toString();
  if (uri.indexOf("?action=") > 0) {
    var clean_uri = uri.substring(0, uri.indexOf("?"));
    window.history.replaceState({}, document.title, clean_uri);
  }
}

export const isProd = process.env.NODE_ENV === "production";
export const API_URL = isProd ? "https://roadtrip-api.konstantin-dobler.de" : "http://localhost:33333";
