// Persistence transport only. Clinical inputs/outputs are restored by the caller.
// Patient data are never put in localStorage or sent to a configurable host.
const SCHEMA = 'nutriklinik-local-workspace-0.1.0';
// Relative to the page: /api/local/ on the desktop launcher, /nutriclinic/api/local/ when hosted.
const PREFIX = 'api/local/';
const MAX_BYTES = 16 * 1024 * 1024;
const KEEPALIVE_BYTES = 60 * 1024;
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const copy = value => structuredClone(value);
const validRevision = value => Number.isSafeInteger(value) && value >= 0;
const validSnapshot = value => value === null || (plain(value) && value.schema === SCHEMA && plain(value.current) && Array.isArray(value.records) && value.records.length <= 200 && Array.isArray(value.importedComparisons));
const validWorkspace = value => plain(value) && validRevision(value.revision) && Object.hasOwn(value, 'snapshot') && validSnapshot(value.snapshot) && (value.updatedAt === null || typeof value.updatedAt === 'string');

/**
 * Snapshot shape: {schema,current,records,importedComparisons}. capture() and
 * apply() are synchronous callbacks owned by the app. apply() must validate
 * raw clinical data and reset confirmations; this controller never grants them.
 * onStatus receives metadata only. All public operations resolve {ok,...}.
 */
export function createLocalRecordStore({ capture, apply, onStatus = () => {}, fetchImpl = globalThis.fetch,
  debounceMs = 350, requestTimeoutMs = 15000, setTimer = globalThis.setTimeout, clearTimer = globalThis.clearTimeout } = {}) {
  if (typeof capture !== 'function' || typeof apply !== 'function' || typeof fetchImpl !== 'function') throw Error('Persistence callbacks are required');
  let token = null, revision = null, updatedAt = null, loaded = false, disposed = false, applying = false;
  let phase = 'idle', errorCode = null, lock = null, version = 0, savedVersion = 0, hasSavedWorkspace = false;
  let startPromise = null, savePromise = null, timer = null, keepaliveNext = false, queuedCapture = null, writing = false;
  // Hosted guest mode: 'guest' (open site, own records only) or 'full' (signed in). Null on the desktop edition.
  let access = null;
  const activeRequests = new Set();
  const dirty = () => version > savedVersion;
  const getState = () => ({ phase, revision, updatedAt, dirty: dirty(), saving: writing, access,
    loaded, hasSavedWorkspace, errorCode, conflict: lock === 'conflict' || lock === 'edited-during-load',
    reloadRequired: lock === 'reload-required', disposed });
  const notify = () => { try { onStatus(getState()); } catch { /* A view cannot authorize a write. */ } };
  const status = (next, code = null) => { if (disposed) return; phase = next; errorCode = code; notify(); };
  const failure = code => ({ ok: false, code });
  const cancelTimer = () => { if (timer !== null) clearTimer(timer); timer = null; };
  async function request(route, { method = 'GET', data, keepalive = false, bootstrap = false, reauthenticated = false } = {}) {
    if (disposed) return failure('disposed');
    // route is constructed solely by the fixed public methods below.
    if (typeof route !== 'string' || !/^(bootstrap|workspace|backup|backups|restore|patients|guests|(?:patient|draft|guest-patients|guest-patient)(?:\?.*)?)$/.test(route)) return failure('invalid-route');
    const controller = new AbortController();
    activeRequests.add(controller);
    const timeout = requestTimeoutMs > 0 ? setTimer(() => controller.abort(), requestTimeoutMs) : null;
    try {
      const headers = { Accept: 'application/json' };
      if (!bootstrap) headers['X-NutriKlinik-Token'] = token;
      if (data !== undefined) headers['Content-Type'] = 'application/json';
      const response = await fetchImpl(PREFIX + route, { method, headers, ...(data === undefined ? {} : { body: data }),
        credentials: 'same-origin', redirect: 'error', cache: 'no-store', keepalive, signal: controller.signal });
      if (disposed) return failure('disposed');
      if(!bootstrap&&!reauthenticated&&(response.status===401||response.status===403)){
        // A local server restart rotates the in-memory request token. Refresh
        // only that token; retain the old CAS revision and never overwrite a
        // workspace that another tab saved while this one was disconnected.
        const fresh=await request('bootstrap',{bootstrap:true});
        if(!fresh.ok||typeof fresh.value?.token!=='string'||fresh.value.token.length<16||fresh.value.storage?.available===false)return failure('access-refused');
        token=fresh.value.token;
        return request(route,{method,data,keepalive,reauthenticated:true});
      }
      if (response.status === 409) return failure('conflict');
      if (!response.ok) return failure(response.status === 401 || response.status === 403 ? 'access-refused' : 'storage-request-failed');
      const result = await response.json();
      if (disposed) return failure('disposed');
      return { ok: true, value: result };
    } catch {
      return failure(disposed ? 'disposed' : 'storage-unreachable');
    } finally {
      activeRequests.delete(controller);
      if (timeout !== null) clearTimer(timeout);
    }
  }
  function noteFailure(result) {
    if (disposed) return result;
    if (result.code === 'conflict') { lock = 'conflict'; status('conflict', result.code); }
    else status('error', result.code);
    return result;
  }
  function applyStored(snapshot) {
    applying = true;
    try {
      const result = apply(copy(snapshot));
      if (result && typeof result.then === 'function') throw Error('apply must be synchronous');
    } finally { applying = false; }
  }
  function schedule() {
    cancelTimer();
    if (!disposed && loaded && !lock && dirty()) timer = setTimer(() => { timer = null; void flush(); }, debounceMs);
  }
  async function start() {
    if (disposed) return failure('disposed');
    if (loaded) return lock ? failure(lock) : { ok: true, revision, restored: hasSavedWorkspace };
    if (startPromise) return startPromise;
    status('loading');
    startPromise = (async () => {
      const bootstrap = await request('bootstrap', { bootstrap: true });
      if (!bootstrap.ok) return noteFailure(bootstrap);
      if (!plain(bootstrap.value) || typeof bootstrap.value.token !== 'string' || bootstrap.value.token.length < 16 || bootstrap.value.storage?.available === false) return noteFailure(failure('storage-unavailable'));
      token = bootstrap.value.token;
      access = bootstrap.value.access === 'guest' || bootstrap.value.access === 'full' ? bootstrap.value.access : null;
      const remote = await request('workspace');
      if (!remote.ok) return noteFailure(remote);
      if (!validWorkspace(remote.value)) return noteFailure(failure('invalid-workspace-response'));
      if (disposed) return failure('disposed');
      revision = remote.value.revision; updatedAt = remote.value.updatedAt; loaded = true;
      hasSavedWorkspace = remote.value.snapshot !== null;
      if (dirty() && hasSavedWorkspace) {
        lock = 'edited-during-load'; status('conflict', lock);
        return failure(lock);
      }
      if (hasSavedWorkspace) {
        try { applyStored(remote.value.snapshot); }
        catch { lock = 'restore-failed'; return noteFailure(failure(lock)); }
        savedVersion = version;
      }
      status(dirty() ? 'dirty' : 'ready');
      schedule();
      return { ok: true, revision, restored: hasSavedWorkspace };
    })();
    try { return await startPromise; }
    finally { startPromise = null; }
  }
  function changed() {
    if (disposed || applying) return;
    version++;
    if (!lock) status(savePromise ? 'saving' : loaded ? 'dirty' : phase === 'loading' ? 'loading' : 'dirty');
    else notify();
    schedule();
  }
  async function drain() {
    while (dirty() && !disposed && !lock) {
      let sentVersion = version;
      const expectedRevision = revision;
      let snapshot, body;
      try {
        if (queuedCapture && queuedCapture.version > savedVersion) {
          snapshot = queuedCapture.snapshot; sentVersion = queuedCapture.version; queuedCapture = null;
        } else snapshot = copy(capture());
        if (!validSnapshot(snapshot) || snapshot === null) return noteFailure(failure('invalid-local-snapshot'));
        body = JSON.stringify({ expectedRevision, snapshot });
        if (new TextEncoder().encode(body).byteLength > MAX_BYTES) return noteFailure(failure('snapshot-too-large'));
      } catch { return noteFailure(failure('capture-failed')); }
      const keepalive = keepaliveNext;
      keepaliveNext = false;
      if (keepalive && new TextEncoder().encode(body).byteLength > KEEPALIVE_BYTES) return noteFailure(failure('keepalive-too-large'));
      status('saving');
      const response = await request('workspace', { method: 'PUT', data: body, keepalive });
      if (!response.ok) return noteFailure(response);
      const saved = response.value;
      if (!validWorkspace(saved) || saved.revision !== expectedRevision + 1) {
        lock = 'save-response-invalid';
        return noteFailure(failure(lock));
      }
      if (disposed) return failure('disposed');
      revision = saved.revision; updatedAt = saved.updatedAt;
      savedVersion = Math.max(savedVersion, sentVersion); hasSavedWorkspace = true;
      // Further edits are still dirty until their own durable acknowledgement.
      if (dirty()) notify();
    }
    if (disposed) return failure('disposed');
    if (lock) return failure(lock);
    status('ready');
    return { ok: true, revision, updatedAt };
  }
  async function flush({ keepalive = false } = {}) {
    cancelTimer();
    if (disposed) return failure('disposed');
    // Capture before the first await. A caller may be switching patients after
    // awaiting this flush; this snapshot belongs to the case at call time.
    if (dirty() && !lock) {
      try {
        const snapshot = copy(capture());
        if (!validSnapshot(snapshot) || snapshot === null) return noteFailure(failure('invalid-local-snapshot'));
        queuedCapture = { version, snapshot };
      } catch { return noteFailure(failure('capture-failed')); }
    }
    if (keepalive) keepaliveNext = true;
    if (!loaded) { const initial = await start(); if (!initial.ok) return initial; }
    if (lock) return failure(lock);
    if (savePromise) return savePromise;
    if (!dirty()) { keepaliveNext = false; return { ok: true, revision, updatedAt }; }
    writing = true;
    savePromise = drain();
    notify();
    try { return await savePromise; }
    finally { savePromise = null; writing = false; keepaliveNext = false; if (!dirty()) queuedCapture = null; notify(); }
  }
  async function ensureToken() {
    if (!token) {
      const initial = await start();
      if (!initial.ok && !token) return initial;
    }
    return disposed ? failure('disposed') : { ok: true };
  }
  async function read(route) {
    const initialized = await ensureToken();
    if (!initialized.ok) return initialized;
    return request(route);
  }
  async function backup() {
    const saved = await flush();
    if (!saved.ok) return saved;
    const result = await request('backup', { method: 'POST', data: '{}' });
    if (!result.ok) return noteFailure(result);
    if (!plain(result.value?.backup) || typeof result.value.backup.file !== 'string') return failure('invalid-backup-response');
    return { ok: true, backup: copy(result.value.backup) };
  }
  async function listPatients() {
    const result = await read('patients');
    if (!result.ok) return result;
    if (!Array.isArray(result.value?.patients)) return failure('invalid-patients-response');
    return { ok: true, patients: copy(result.value.patients) };
  }
  async function loadPatient(studyId, offset = 0, limit = 200) {
    if (typeof studyId !== 'string' || studyId.length > 160 || !Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 200) return failure('invalid-patient-request');
    const query = new URLSearchParams({ studyId, offset: String(offset), limit: String(limit) });
    const result = await read('patient?' + query.toString());
    if (!result.ok) return result;
    const value = result.value;
    if (!Array.isArray(value?.records) || !Number.isSafeInteger(value.total) || value.total < value.records.length || value.offset !== offset || value.limit !== limit || typeof value.hasMore !== 'boolean') return failure('invalid-patient-response');
    return { ok: true, ...copy(value) };
  }
  async function listBackups() {
    const result = await read('backups');
    if (!result.ok) return result;
    if (!Array.isArray(result.value?.backups)) return failure('invalid-backups-response');
    return { ok: true, backups: copy(result.value.backups) };
  }
  async function loadDraft(draftId) {
    if (typeof draftId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(draftId)) return failure('invalid-draft-request');
    const result = await read('draft?' + new URLSearchParams({ draftId }).toString());
    if (!result.ok) return result;
    if (!plain(result.value)) return failure('invalid-draft-response');
    return { ok: true, ...copy(result.value) };
  }
  // Full access only: read-only views of guest spaces. Nothing here writes.
  const validGuest = value => typeof value === 'string' && /^misafir-[a-f0-9]{40}$/.test(value);
  async function listGuests() {
    const result = await read('guests');
    if (!result.ok) return result;
    if (!Array.isArray(result.value?.guests)) return failure('invalid-guests-response');
    return { ok: true, guests: copy(result.value.guests) };
  }
  async function listGuestPatients(guest) {
    if (!validGuest(guest)) return failure('invalid-guest');
    const result = await read('guest-patients?' + new URLSearchParams({ guest }).toString());
    if (!result.ok) return result;
    if (!Array.isArray(result.value?.patients)) return failure('invalid-patients-response');
    return { ok: true, patients: copy(result.value.patients) };
  }
  async function loadGuestPatient(guest, studyId, offset = 0, limit = 200) {
    if (!validGuest(guest) || typeof studyId !== 'string' || studyId.length > 160 || !Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 200) return failure('invalid-patient-request');
    const result = await read('guest-patient?' + new URLSearchParams({ guest, studyId, offset: String(offset), limit: String(limit) }).toString());
    if (!result.ok) return result;
    if (!Array.isArray(result.value?.records) || !Number.isSafeInteger(result.value.total)) return failure('invalid-patient-response');
    return { ok: true, ...copy(result.value) };
  }
  async function restoreBackup(backupFile) {
    if (typeof backupFile !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,180}$/.test(backupFile) || backupFile.includes('..')) return failure('invalid-backup-file');
    if (dirty() || savePromise) return failure('unsaved-changes');
    const initialized = await start();
    if (!initialized.ok) return initialized;
    const prior = revision;
    const result = await request('restore', { method: 'POST', data: JSON.stringify({ expectedRevision: revision, backupFile }) });
    if (!result.ok) return noteFailure(result);
    if (!validWorkspace(result.value) || result.value.revision <= prior) {
      lock = 'restore-response-invalid'; return noteFailure(failure(lock));
    }
    revision = result.value.revision; updatedAt = result.value.updatedAt;
    hasSavedWorkspace = result.value.snapshot !== null; lock = 'reload-required';
    status('restored', lock);
    return { ok: true, revision, reloadRequired: true, safetyBackup: copy(result.value.safetyBackup ?? null) };
  }
  async function reloadSavedWorkspace({ discardPending = false } = {}) {
    if (disposed) return failure('disposed');
    if (savePromise || (dirty() && !discardPending)) return failure('unsaved-changes');
    cancelTimer();
    const initial = await ensureToken();
    if (!initial.ok) return initial;
    const before = version;
    const remote = await request('workspace');
    if (!remote.ok) return noteFailure(remote);
    if (!validWorkspace(remote.value)) return noteFailure(failure('invalid-workspace-response'));
    if (version !== before) { lock = 'edited-during-load'; status('conflict', lock); return failure(lock); }
    try { applyStored(remote.value.snapshot); }
    catch { lock = 'restore-failed'; return noteFailure(failure(lock)); }
    revision = remote.value.revision; updatedAt = remote.value.updatedAt; loaded = true;
    hasSavedWorkspace = remote.value.snapshot !== null; savedVersion = version; lock = null;
    status('ready');
    return { ok: true, revision, restored: hasSavedWorkspace };
  }
  function dispose() {
    if (disposed) return;
    cancelTimer(); disposed = true;
    for (const controller of activeRequests) controller.abort();
    phase = 'disposed'; errorCode = 'disposed'; notify();
  }
  return { start, changed, flush, backup, listPatients, loadPatient, loadDraft, listBackups, restoreBackup, reloadSavedWorkspace, getState, dispose,
    listGuests, listGuestPatients, loadGuestPatient };
}
