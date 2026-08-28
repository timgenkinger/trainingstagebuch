/* Wird von scripts/release.sh und vom GitHub-Workflow automatisch gepflegt.
   Nicht von Hand bearbeiten. */
export const APP_VERSION = '1.3.0';
export const RELEASE_DATE = '2026-08-28';
export const BUILD = 'lokal';
export const APP_NAME = 'Rettungshund Trainingstagebuch';
export function versionString() {
  return BUILD && BUILD !== 'lokal' ? `v${APP_VERSION} (Build ${BUILD})` : `v${APP_VERSION}`;
}
