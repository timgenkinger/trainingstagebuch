/* Wird von scripts/release.sh und vom GitHub-Workflow automatisch gepflegt.
   Nicht von Hand bearbeiten. */
export const APP_VERSION = '1.9.1';
export const RELEASE_DATE = '2026-09-03';
export const BUILD = 'lokal';
export const APP_NAME = 'Rettungshund Trainingstagebuch';
export function versionString() {
  return BUILD && BUILD !== 'lokal' ? `v${APP_VERSION} (Build ${BUILD})` : `v${APP_VERSION}`;
}
