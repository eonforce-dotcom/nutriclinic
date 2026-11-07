// First-visit language. Order: the user's saved choice > connection country
// (hosted site: Cloudflare country passed by nginx in the nc_ulke cookie) >
// Turkish browser language > Turkey time zone > English. Hints are only read,
// never saved; a manual choice in the language menu is saved and always wins.
export const LANGUAGE_STORAGE_KEY = 'nutriklinik-language';
export const COUNTRY_COOKIE = 'nc_ulke';

const readSafely = (reader, fallback) => {
  try { return typeof reader === 'function' ? reader() : fallback; } catch { return fallback; }
};

const browserLanguages = () => {
  const browser = globalThis.navigator;
  const languages = readSafely(() => browser?.languages, []);
  const language = readSafely(() => browser?.language, null);
  const offered = readSafely(() => Array.isArray(languages) ? languages.slice(0, 15) : [], []);
  return [...offered, language];
};

// ISO 3166 alpha-2 code from the nc_ulke cookie, or null (desktop edition, no cookie, XX/T1 etc.).
export function countryFromCookie(cookie) {
  if (typeof cookie !== 'string' || cookie.length > 8192) return null;
  for (const part of cookie.split(';')) {
    const [name, value = ''] = part.trim().split('=');
    if (name === COUNTRY_COOKIE && /^[A-Za-z]{2}$/.test(value)) return value.toUpperCase();
  }
  return null;
}

export function getInitialLocale({
  getSavedLanguage = () => globalThis.localStorage?.getItem(LANGUAGE_STORAGE_KEY),
  getCountry = () => countryFromCookie(globalThis.document?.cookie),
  getPreferredLanguages = browserLanguages,
  getTimeZone = () => globalThis.Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone,
} = {}) {
  const saved = readSafely(getSavedLanguage, null);
  if (saved === 'en' || saved === 'tr') return saved;
  if (readSafely(getCountry, null) === 'TR') return 'tr';
  const turkishLanguage = readSafely(() => {
    const languages = readSafely(getPreferredLanguages, []);
    return Array.isArray(languages) && languages.slice(0, 16).some(language =>
      typeof language === 'string' && language.length <= 64 && /^tr(?:-[a-z0-9]{1,8})*$/i.test(language.trim()));
  }, false);
  if (turkishLanguage || readSafely(getTimeZone, null) === 'Europe/Istanbul') return 'tr';
  return 'en';
}
