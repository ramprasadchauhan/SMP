// localStorage holds only visual preferences (theme, sidebar). Access can
// throw in private windows or when storage is blocked, so it is guarded.
export function readPref(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writePref(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Preference simply won't persist.
  }
}
