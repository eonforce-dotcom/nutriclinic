// Deployment edition. The desktop launcher serves 'local' (records on this
// computer). The hosted copy at sahnoroloji.org/nutriclinic is published with
// EDITION = 'server' (records in the NutriClinic server database).
export const EDITION = 'local';
let edition = EDITION;

export const isServerEdition = () => edition === 'server';
export const editionText = (local, server) => isServerEdition() ? server : local;
export function setEditionForTests(value) { edition = value === 'server' ? 'server' : 'local'; }

// Static index.html wording that differs by edition carries its server-edition
// Turkish source in data-server-text; i18n then translates it like any source text.
export function applyEditionText(root = globalThis.document) {
  if (!isServerEdition() || !root?.querySelectorAll) return;
  for (const element of root.querySelectorAll('[data-server-text]')) element.textContent = element.getAttribute('data-server-text');
}
