import { UserRole } from '@prisma/client';
import {
  AgendaAdminPermissions,
  AllPermissions,
  CanGetEvents,
  CanGetTags,
  EditorPermissions,
  PeerPermissions,
} from '@wepublish/permissions';
import { UserRoleDataloader } from './user-role.dataloader';
import { UserRoleResolver } from './user-role.resolver';
import { UserRoleService } from './user-role.service';

const role = (id: string, permissionIDs: string[] = []) =>
  ({ id, permissionIDs }) as unknown as UserRole;

const resolver = new UserRoleResolver(
  {} as UserRoleService,
  {} as UserRoleDataloader
);

describe('UserRoleResolver.permissions', () => {
  it.each([
    ['admin', AllPermissions],
    ['editor', EditorPermissions],
    ['peer', PeerPermissions],
    ['agenda-admin', AgendaAdminPermissions],
  ] as const)('gives the predefined %s role its set', async (id, expected) => {
    expect(await resolver.permissions(role(id))).toEqual(expected);
  });

  it('filters every permission by the stored ids of a custom role', async () => {
    expect(
      await resolver.permissions(
        role('custom', [CanGetTags.id, CanGetEvents.id, 'CAN_UNKNOWN'])
      )
    ).toEqual(
      AllPermissions.filter(
        ({ id }) => id === CanGetTags.id || id === CanGetEvents.id
      )
    );
  });
});
