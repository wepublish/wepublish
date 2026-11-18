import { grantsOnlyReaderAccess } from '@wepublish/permissions';

/**
 * Staff never get a login code; the API refuses to issue one. Mirrors that
 * rule on the roles the editor loads, whose permissions already include the
 * predefined ones of the admin and editor roles.
 */
export const mayHoldLoginCode = (
  roles?: { permissions: { id: string }[] }[] | null
) =>
  grantsOnlyReaderAccess(
    (roles ?? []).flatMap(role => role.permissions.map(({ id }) => id))
  );
