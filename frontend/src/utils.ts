export function removeActionFromUrl() {
  var uri = window.location.toString();
  if (uri.indexOf("?action=") > 0) {
    var clean_uri = uri.substring(0, uri.indexOf("?"));
    window.history.replaceState({}, document.title, clean_uri);
  }
}

export const isProd = process.env.NODE_ENV === "production";
export const API_URL = isProd ? "https://roadtrip-api.konstantin-dobler.de" : "http://localhost:33333";

export const delay = (t: number) => new Promise(resolve => setTimeout(resolve, t));

// Get the prefix for this browser.
export function getPrefix() {
  // Check to see if the browser supports the unprefixed property.
  if ("hidden" in document) {
    // No prefix needed, return null.
    return null;
  }

  // Loop through all the possible prefixes.
  var prefixes = ["moz", "ms", "o", "webkit"];

  for (var i = 0; i < prefixes.length; i++) {
    var testPrefix = prefixes[i] + "Hidden";
    if (testPrefix in document) {
      return prefixes[i];
    }
  }

  // The API must not be supported in this browser.
  return null;
}

// Prefix the hidden property.
export function getHiddenProperty(prefix: string | null) {
  if (prefix) {
    return prefix + "Hidden";
  } else {
    return "hidden";
  }
}

// Prefix the visbilityState property.
export function getVisibilityStateProperty(prefix: string | null) {
  if (prefix) {
    return prefix + "VisibilityState";
  } else {
    return "visibilityState";
  }
}

// Prefix the visibilitychange event.
export function getVisibilityEvent(prefix: string | null) {
  if (prefix) {
    return prefix + "visibilitychange";
  } else {
    return "visibilitychange";
  }
}
