import { CanGetArticle } from './permissions';

/**
 * Permissions a reader may hold through a role without counting as staff:
 * reading past the paywall, which media hand out to partners or journalists.
 */
const READER_PERMISSION_IDS: ReadonlySet<string> = new Set([CanGetArticle.id]);

/**
 * Whether the given effective permissions (predefined ones of the admin and
 * editor roles included) grant nothing beyond reader access.
 */
export const grantsOnlyReaderAccess = (permissionIDs: readonly string[]) =>
  permissionIDs.every(id => READER_PERMISSION_IDS.has(id));
