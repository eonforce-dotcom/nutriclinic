import { dateValid, labDefs } from './import.mjs';

// Hospital-entered context only. Never changes patient inputs or clinical rules.
const SCHEMA = 'clinic-lab-references-0.1.0';
const analytes = Object.keys(labDefs);
const fields = ['schemaVersion', 'clinicName', 'source', 'version', 'effectiveFrom', 'effectiveTo', 'ageMin', 'ageMax', 'sex', 'rows'];
const rowFields = ['enabled', 'lower', 'upper', 'unit'];
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const own = (value, key) => plain(value) ? Object.getOwnPropertyDescriptor(value, key)?.value : undefined;
const missing = value => value === null || value === undefined || (typeof value === 'string' && !value.trim());
const number = value => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || !/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?$/.test(value.trim())) return null;
  const parsed = Number(value.trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};
const cleanText = value => typeof value === 'string' ? value.trim() : '';
const validDate = value => dateValid(value) && !value.startsWith('0000-');
const units = key => [labDefs[key].unit, ...(key === 'albumin' ? ['g/dL'] : []), ...(['neutrophils', 'lymphocytes'].includes(key) ? ['cells/µL'] : []), ...(key === 'potassium' ? ['mEq/L'] : [])];
const factor = (key, unit) => key === 'albumin' && unit === 'g/dL' ? 10 : ['neutrophils', 'lymphocytes'].includes(key) && unit === 'cells/µL' ? 0.001 : 1;
const converted = (key, value, unit) => {
  const output = value === null ? null : value * factor(key, unit);
  return Number.isFinite(output) ? output : null;
};

// Same collection-time contract as engine.mjs: unzoned wall times stay separate
// from zoned instants; dates are the written ISO days, independent of the host.
const collectionTimestamp = value => {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})?$/.exec(value);
  if (!match || !validDate(match[1])) return null;
  const [year, month, day] = match[1].split('-').map(Number);
  const hour = Number(match[2]), minute = Number(match[3]), second = Number(match[4] || 0);
  if (hour > 23 || minute > 59 || second > 59) return null;
  const zone = match[6] || '';
  let offset = 0;
  if (zone && zone !== 'Z') {
    const zoneHour = Number(zone.slice(1, 3)), zoneMinute = Number(zone.slice(4, 6));
    if (zoneHour > 14 || zoneMinute > 59 || (zoneHour === 14 && zoneMinute !== 0)) return null;
    offset = (zoneHour * 60 + zoneMinute) * (zone[0] === '-' ? -1 : 1);
  }
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, Number((match[5] || '').padEnd(3, '0')));
  return { time: date.getTime() - offset * 60000, zoned: Boolean(zone), date: match[1] };
};

export function emptyReferenceProfile() {
  return {
    schemaVersion: SCHEMA, clinicName: '', source: '', version: '', effectiveFrom: '', effectiveTo: '',
    ageMin: 18, ageMax: 120, sex: 'all',
    rows: Object.fromEntries(analytes.map(key => [key, { enabled: false, lower: null, upper: null, unit: labDefs[key].unit }])),
  };
}

export function validateReferenceProfile(value) {
  const profile = emptyReferenceProfile(), errors = [];
  const error = (code, path) => errors.push({ code, path });
  if (!plain(value)) return { valid: false, errors: [{ code: 'invalid-profile', path: 'profile' }], profile };
  for (const key of Object.keys(value)) if (!fields.includes(key)) error('unknown-field', key);
  if (own(value, 'schemaVersion') !== SCHEMA) error('unsupported-schema', 'schemaVersion');
  for (const [key, max] of [['clinicName', 160], ['source', 500], ['version', 80]]) {
    const raw = own(value, key);
    profile[key] = cleanText(raw);
    if (!profile[key] || profile[key].length > max || /[\u0000-\u001f\u007f]/.test(profile[key])) error('invalid-text', key);
  }
  profile.effectiveFrom = cleanText(own(value, 'effectiveFrom'));
  profile.effectiveTo = cleanText(own(value, 'effectiveTo'));
  if (!validDate(profile.effectiveFrom)) error('invalid-date', 'effectiveFrom');
  if (profile.effectiveTo && !validDate(profile.effectiveTo)) error('invalid-date', 'effectiveTo');
  if (validDate(profile.effectiveFrom) && validDate(profile.effectiveTo) && profile.effectiveTo < profile.effectiveFrom) error('reversed-date-range', 'effectiveTo');
  for (const key of ['ageMin', 'ageMax']) {
    profile[key] = number(own(value, key));
    if (profile[key] === null || profile[key] < 18 || profile[key] > 120) error('invalid-age-range', key);
  }
  if (profile.ageMin !== null && profile.ageMax !== null && profile.ageMin > profile.ageMax) error('reversed-age-range', 'ageMax');
  profile.sex = cleanText(own(value, 'sex'));
  if (!['all', 'female', 'male'].includes(profile.sex)) error('invalid-sex', 'sex');
  const rawRows = own(value, 'rows');
  if (!plain(rawRows)) error('invalid-rows', 'rows');
  else {
    for (const key of Object.keys(rawRows)) if (!analytes.includes(key)) error('unknown-analyte', `rows.${key}`);
    for (const key of analytes) {
      const raw = own(rawRows, key);
      if (raw === undefined) continue;
      const path = `rows.${key}`;
      if (!plain(raw)) { error('invalid-row', path); continue; }
      for (const field of Object.keys(raw)) if (!rowFields.includes(field)) error('unknown-field', `${path}.${field}`);
      const row = profile.rows[key];
      row.enabled = own(raw, 'enabled') === true;
      if (typeof own(raw, 'enabled') !== 'boolean') error('invalid-enabled', `${path}.enabled`);
      row.unit = cleanText(own(raw, 'unit'));
      if (!units(key).includes(row.unit)) error('unsupported-unit', `${path}.unit`);
      for (const bound of ['lower', 'upper']) {
        const input = own(raw, bound);
        row[bound] = missing(input) ? null : number(input);
        if (!missing(input) && (row[bound] === null || row[bound] < 0 || !Number.isFinite(converted(key, row[bound], row.unit)))) error('invalid-bound', `${path}.${bound}`);
      }
      if (row.enabled && row.lower === null && row.upper === null) error('missing-bounds', path);
      if (row.lower !== null && row.upper !== null && row.lower >= row.upper) error('reversed-or-equal-bounds', path);
    }
  }
  return { valid: errors.length === 0, errors, profile };
}

// Retain configuration only; imported results/confirmations have no authority.
export function restoreReferenceProfile(snapshotOrProfile) {
  const wrapped = plain(snapshotOrProfile) && Object.hasOwn(snapshotOrProfile, 'profileSnapshot');
  if (wrapped && own(snapshotOrProfile, 'profileValid') === false) return emptyReferenceProfile();
  const source = wrapped ? own(snapshotOrProfile, 'profileSnapshot') : snapshotOrProfile;
  if (!plain(source)) return emptyReferenceProfile();
  const checked = validateReferenceProfile(source);
  // Do not turn an invalid original (for example an unknown unit/field or a
  // malformed bound) into a valid profile by dropping its invalid components.
  return checked.valid ? checked.profile : emptyReferenceProfile();
}

const flagState = input => {
  const raw = own(input, 'inputErrors');
  if (raw === undefined) return { malformed: false, fields: new Set() };
  if (!Array.isArray(raw)) return { malformed: true, fields: new Set() };
  const items = Array.from(raw);
  if (items.some(key => typeof key !== 'string' || !key.trim())) return { malformed: true, fields: new Set() };
  return { malformed: false, fields: new Set(items.map(key => key.trim())) };
};

export function evaluateReferenceProfile(input, value, { applicabilityConfirmed = false } = {}) {
  const checked = validateReferenceProfile(value), profile = checked.profile, data = plain(input) ? input : {};
  const flags = flagState(data);
  const results = analytes.map(key => {
    const row = profile.rows[key], def = labDefs[key];
    const result = { analyte: key, status: 'not-applicable', reason: 'row-disabled', value: null, unit: def.unit, lower: converted(key, row.lower, row.unit), upper: converted(key, row.upper, row.unit) };
    const unavailable = reason => ({ ...result, status: 'unavailable', reason });
    const notApplicable = reason => ({ ...result, reason });
    if (!row.enabled) return result;
    if (!checked.valid) return notApplicable('invalid-profile');
    if (applicabilityConfirmed !== true) return notApplicable('applicability-unconfirmed');
    const dateKey = key === 'uun' ? 'uunDate' : 'labDate';
    const dependencies = ['age', 'sex', 'labsConfirmed', 'visitDate', dateKey, key, ...(key === 'uun' ? ['collectionComplete', 'collectionStart', 'collectionEnd', 'urineVolume'] : [])];
    if (flags.malformed) return unavailable('invalid-error-metadata');
    if (dependencies.some(field => flags.fields.has(field))) return unavailable('flagged-input');
    if (own(data, 'labsConfirmed') !== true) return unavailable('laboratory-unconfirmed');
    const age = own(data, 'age'), sex = own(data, 'sex');
    if (typeof age !== 'number' || !Number.isFinite(age)) return unavailable('invalid-patient-age');
    if (age < 18 || age > 120 || age < profile.ageMin || age > profile.ageMax) return notApplicable('age-mismatch');
    if (!['female', 'male'].includes(sex)) return unavailable('invalid-patient-sex');
    if (profile.sex !== 'all' && sex !== profile.sex) return notApplicable('sex-mismatch');
    const specimenDate = own(data, dateKey), visitDate = own(data, 'visitDate');
    if (!validDate(specimenDate) || !validDate(visitDate)) return unavailable('invalid-patient-date');
    if (specimenDate > visitDate) return notApplicable('specimen-after-assessment');
    if (specimenDate < profile.effectiveFrom || (profile.effectiveTo && specimenDate > profile.effectiveTo)) return notApplicable('profile-date-mismatch');
    if (key === 'uun') {
      if (own(data, 'collectionComplete') !== true) return unavailable('collection-unconfirmed');
      const start = collectionTimestamp(own(data, 'collectionStart')), end = collectionTimestamp(own(data, 'collectionEnd'));
      if (!start || !end) return unavailable('invalid-collection-time');
      if (start.zoned !== end.zoned) return unavailable('mixed-collection-time-basis');
      if (Math.abs((end.time - start.time) / 3600000 - 24) > 0.1 + 1e-9) return unavailable('invalid-collection-duration');
      if (end.date !== specimenDate) return unavailable('collection-date-mismatch');
      const volume = own(data, 'urineVolume');
      if (typeof volume !== 'number' || !Number.isFinite(volume) || volume <= 0) return unavailable('invalid-urine-volume');
    }
    const measurement = own(data, key);
    if (missing(measurement)) return unavailable('missing-measurement');
    if (typeof measurement !== 'number' || !Number.isFinite(measurement) || measurement < def.min || measurement > def.max) return unavailable('invalid-measurement');
    return { ...result, value: measurement, status: result.lower !== null && measurement < result.lower ? 'below' : result.upper !== null && measurement > result.upper ? 'above' : 'within', reason: null };
  });
  return { schemaVersion: SCHEMA, profileSnapshot: structuredClone(profile), profileValid: checked.valid, profileErrors: structuredClone(checked.errors), results, clinicalValidation: false };
}
