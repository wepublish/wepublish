import { ForbiddenException } from '@nestjs/common';
import {
  CanGetUsers,
  CanManageUserDeliveryMode,
  CanSendMailTemplates,
} from '@wepublish/permissions';
import { MailRecipientBase } from './mail-send.model';
import { SavedAudienceFilterResolver } from './saved-audience-filter.resolver';
import { SavedAudienceFilterService } from './saved-audience-filter.service';

const session = (permissions: string[], userId = 'editor-1') =>
  ({
    type: 'user',
    user: { id: userId },
    roles: [{ id: 'role-1', permissionIDs: permissions }],
  }) as any;

const setup = () => {
  const service = {
    list: vi.fn(async () => []),
    create: vi.fn(async () => ({ id: 'f1' })),
    update: vi.fn(async () => ({ id: 'f1' })),
    delete: vi.fn(async () => ({ id: 'f1' })),
  };

  return {
    service,
    resolver: new SavedAudienceFilterResolver(
      service as unknown as SavedAudienceFilterService
    ),
  };
};

const input = {
  name: 'A',
  audience: { base: MailRecipientBase.allUsers },
};

describe('SavedAudienceFilterResolver', () => {
  // The filter is the same in both tools, so whoever may use one of them may
  // use the saved filters.
  it.each([
    ['manual messages', CanSendMailTemplates.id],
    ['the channel assignment', CanManageUserDeliveryMode.id],
  ])('lets someone who may use %s work with them', async (_tool, id) => {
    const { resolver, service } = setup();
    const actor = session([id]);

    await resolver.savedAudienceFilters(actor);
    await resolver.createSavedAudienceFilter(actor, input);
    await resolver.updateSavedAudienceFilter(actor, 'f1', { name: 'B' });
    await resolver.deleteSavedAudienceFilter(actor, 'f1');

    expect(service.list).toHaveBeenCalled();
    expect(service.create).toHaveBeenCalledWith(input, 'editor-1');
    expect(service.update).toHaveBeenCalledWith('f1', { name: 'B' });
    expect(service.delete).toHaveBeenCalledWith('f1');
  });

  it('turns everyone else away, from every operation', async () => {
    const { resolver, service } = setup();
    const actor = session([CanGetUsers.id]);

    await expect(resolver.savedAudienceFilters(actor)).rejects.toThrow(
      ForbiddenException
    );
    await expect(
      resolver.createSavedAudienceFilter(actor, input)
    ).rejects.toThrow(ForbiddenException);
    await expect(
      resolver.updateSavedAudienceFilter(actor, 'f1', { name: 'B' })
    ).rejects.toThrow(ForbiddenException);
    await expect(
      resolver.deleteSavedAudienceFilter(actor, 'f1')
    ).rejects.toThrow(ForbiddenException);

    for (const method of Object.values(service)) {
      expect(method).not.toHaveBeenCalled();
    }
  });
});
