// Bilingual text helper shared by the engine and the scales. Each text is { tr, en }; a function
// argument receives a number formatter for its language.
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Gökay Duman
const LOCALES = { tr: 'tr-TR', en: 'en-GB' };
const formatter = (lang) => (x, digits = 0) => {
  if (x === null || x === undefined || !Number.isFinite(x)) return '–';
  return Number(x).toLocaleString(LOCALES[lang], { minimumFractionDigits: digits, maximumFractionDigits: digits });
};
export const B = (tr, en) => ({
  tr: typeof tr === 'function' ? tr(formatter('tr')) : tr,
  en: typeof en === 'function' ? en(formatter('en')) : en,
});
