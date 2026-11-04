import test from 'node:test';
import assert from 'node:assert/strict';
import {getInitialLocale, countryFromCookie, LANGUAGE_STORAGE_KEY} from '../dist/initial-locale.mjs';

function hints(saved, languages, timeZone, country = null) {
  return {getSavedLanguage: () => saved, getCountry: () => country, getPreferredLanguages: () => languages, getTimeZone: () => timeZone};
}

test('a connection from Turkey opens in Turkish even with an English browser abroad-style setup', () => {
  assert.equal(getInitialLocale(hints(null, ['en-US'], 'America/New_York', 'TR')), 'tr');
  // A saved manual choice still wins over the country.
  assert.equal(getInitialLocale(hints('en', ['en-US'], 'UTC', 'TR')), 'en');
  // Another country does not force English on a Turkish browser or Turkey time zone.
  assert.equal(getInitialLocale(hints(null, ['tr-TR'], 'UTC', 'DE')), 'tr');
  assert.equal(getInitialLocale(hints(null, ['en-GB'], 'Europe/Istanbul', 'GB')), 'tr');
  assert.equal(getInitialLocale(hints(null, ['en-GB'], 'Europe/London', 'GB')), 'en');
  assert.equal(getInitialLocale({...hints(null, ['en-GB'], 'UTC'), getCountry: () => {throw Error('blocked');}}), 'en');
});

test('the country cookie is parsed strictly', () => {
  assert.equal(countryFromCookie('nc_ulke=TR'), 'TR');
  assert.equal(countryFromCookie('a=1; nc_ulke=tr; b=2'), 'TR');
  for (const value of [undefined, null, '', 'nc_ulke=', 'nc_ulke=T1X', 'nc_ulke=<s>', 'xnc_ulke=TR', 'nc_ulke=T R', 'a'.repeat(9000)]) {
    assert.equal(countryFromCookie(value), null);
  }
});

test('an explicit saved language overrides Turkish browser and Turkey time-zone hints', () => {
  assert.equal(getInitialLocale(hints('en', ['tr-TR'], 'Europe/Istanbul')), 'en');
  assert.equal(getInitialLocale(hints('tr', ['en-GB'], 'Europe/London')), 'tr');
  assert.equal(LANGUAGE_STORAGE_KEY, 'nutriklinik-language');
});

test('first visits use Turkish browser hints abroad or the Turkey time zone with an English browser', () => {
  assert.equal(getInitialLocale(hints(null, ['tr-TR', 'en-GB'], 'Europe/London')), 'tr');
  assert.equal(getInitialLocale(hints(null, ['en-US'], 'Europe/Istanbul')), 'tr');
  assert.equal(getInitialLocale(hints(null, ['en-GB', 'tr'], 'Europe/Paris')), 'tr');
  assert.equal(getInitialLocale(hints(null, ['TR-tr'], 'UTC')), 'tr');
});

test('English remains the fallback without a saved choice or usable Turkish hint', () => {
  for (const [saved, languages, zone] of [
    [null, ['en-GB'], 'Europe/London'],
    [undefined, [], undefined],
    ['de', ['de-DE'], 'Europe/Berlin'],
    ['TR', ['en-US'], 'UTC'],
    ['en<script>', ['tricks', 'tr_TR', 'tr-<script>'], 'Europe/Istanbul<script>'],
    [42, [null, {}, 42], {toString: () => 'Europe/Istanbul'}],
  ]) assert.equal(getInitialLocale(hints(saved, languages, zone)), 'en');
});

test('invalid stored values do not suppress usable offline Turkish hints', () => {
  assert.equal(getInitialLocale(hints('unrecognized', ['tr-TR'], 'UTC')), 'tr');
  assert.equal(getInitialLocale(hints('', ['en'], 'Europe/Istanbul')), 'tr');
});

test('blocked storage, navigator or Intl never stops initialization', () => {
  const blocked = () => {throw new Error('blocked browser setting');};
  assert.equal(getInitialLocale({getSavedLanguage: blocked, getPreferredLanguages: () => ['tr-TR'], getTimeZone: blocked}), 'tr');
  assert.equal(getInitialLocale({getSavedLanguage: blocked, getPreferredLanguages: blocked, getTimeZone: () => 'Europe/Istanbul'}), 'tr');
  assert.equal(getInitialLocale({getSavedLanguage: blocked, getPreferredLanguages: blocked, getTimeZone: blocked}), 'en');
  assert.equal(getInitialLocale({getSavedLanguage: null, getPreferredLanguages: {}, getTimeZone: null}), 'en');
});

test('malformed language collections cannot execute coercion or break initialization', () => {
  const untrusted = {toString() {throw new Error('Do not coerce language objects');}};
  assert.equal(getInitialLocale(hints(null, [untrusted], untrusted)), 'en');
  assert.equal(getInitialLocale(hints(null, 'tr-TR', 'UTC')), 'en');
  const throwingArray = new Proxy([], {get() {throw new Error('unavailable languages');}});
  assert.equal(getInitialLocale(hints(null, throwingArray, 'Europe/Istanbul')), 'tr');
});

test('auto-detection only reads hints and does not save a manual preference', () => {
  const calls = [];
  const locale = getInitialLocale({
    getSavedLanguage: () => {calls.push('saved'); return null;},
    getPreferredLanguages: () => {calls.push('languages'); return ['tr-TR'];},
    getTimeZone: () => {calls.push('timeZone'); return 'UTC';},
  });
  assert.equal(locale, 'tr');
  assert.deepEqual(calls, ['saved', 'languages']);
});

test('default browser readers use the existing preference key and navigator language fallback', t => {
  const names = ['localStorage', 'navigator', 'Intl'];
  const originals = new Map(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  t.after(() => {for (const [name, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name];
  }});
  const requestedKeys = [];
  Object.defineProperty(globalThis, 'localStorage', {configurable: true, value: {
    getItem: key => {requestedKeys.push(key); return null;},
    setItem: () => {throw Error('Automatic choice must not be written');},
  }});
  Object.defineProperty(globalThis, 'navigator', {configurable: true, value: {language: 'tr-TR'}});
  Object.defineProperty(globalThis, 'Intl', {configurable: true, value: {DateTimeFormat: () => ({resolvedOptions: () => ({timeZone: 'Europe/London'})})}});
  assert.equal(getInitialLocale(), 'tr');
  assert.deepEqual(requestedKeys, [LANGUAGE_STORAGE_KEY]);
  Object.defineProperty(globalThis, 'navigator', {configurable: true, value: {languages: ['en-GB'], language: 'en-GB'}});
  Object.defineProperty(globalThis, 'Intl', {configurable: true, value: {DateTimeFormat: () => ({resolvedOptions: () => ({timeZone: 'Europe/Istanbul'})})}});
  assert.equal(getInitialLocale(), 'tr');
  Object.defineProperty(globalThis, 'Intl', {configurable: true, value: undefined});
  assert.equal(getInitialLocale(), 'en');
});
