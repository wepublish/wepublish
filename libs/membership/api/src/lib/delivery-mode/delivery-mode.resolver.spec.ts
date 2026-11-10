import { DeliverySuggestionKind, MailChannel } from '@prisma/client';
import { UserSession } from '@wepublish/authentication/api';
import { FEATURE_METADATA_KEY } from '@wepublish/features/api';
import { PERMISSIONS_METADATA_KEY } from '@wepublish/permissions/api';
import {
  CanGetUser,
  CanGetUsers,
  CanManageUserDeliveryMode,
} from '@wepublish/permissions';
import { DeliveryModeResolver } from './delivery-mode.resolver';
import { DeliverySuggestionService } from './delivery-suggestion.service';
import { UserDeliveryPreferenceService } from './user-delivery-preference.service';

const session = { user: { id: 'admin' } } as UserSession;

function setup() {
  const preferences = {
    get: vi.fn(async () => ({ channel: MailChannel.letter })),
    set: vi.fn(async () => undefined),
    setForAudience: vi.fn(async () => ({
      changed: 1,
      skippedWithoutAddress: 0,
    })),
    previewAudience: vi.fn(),
    listBulkChanges: vi.fn(async () => ({ nodes: [], totalCount: 0 })),
    channelCounts: vi.fn(async () => []),
    listByChannel: vi.fn(async () => ({ nodes: [], totalCount: 0 })),
  };
  const suggestions = {
    list: vi.fn(),
    counts: vi.fn(),
    userSuggestion: vi.fn(async () => null),
    keep: vi.fn(async () => undefined),
    confirm: vi.fn(async () => undefined),
    confirmAll: vi.fn(),
    recomputeAll: vi.fn(async () => ({ skipped: true })),
  };
  const resolver = new DeliveryModeResolver(
    preferences as unknown as UserDeliveryPreferenceService,
    suggestions as unknown as DeliverySuggestionService
  );

  return { resolver, preferences, suggestions };
}

describe('DeliveryModeResolver', () => {
  it('ships dark behind both letter features', () => {
    expect(
      Reflect.getMetadata(FEATURE_METADATA_KEY, DeliveryModeResolver)
    ).toEqual(['paper-letters', 'paper-letter-flow']);
  });

  it('needs the delivery-mode permission to change anything', () => {
    for (const method of [
      'setUserDeliveryMode',
      'confirmDeliverySuggestion',
      'confirmAllDeliverySuggestions',
      'setDeliveryModeForAudience',
      'recomputeDeliverySuggestions',
      'deliveryModeBulkChanges',
      'keepDeliverySuggestion',
    ] as const) {
      expect(
        Reflect.getMetadata(
          PERMISSIONS_METADATA_KEY,
          DeliveryModeResolver.prototype[method]
        )
      ).toEqual([CanManageUserDeliveryMode]);
    }
  });

  it('records who switched a user and answers with the new state', async () => {
    const { resolver, preferences } = setup();

    await expect(
      resolver.setUserDeliveryMode(session, 'u1', MailChannel.letter, 'moved')
    ).resolves.toEqual({ channel: MailChannel.letter });
    expect(preferences.set).toHaveBeenCalledWith('u1', MailChannel.letter, {
      origin: 'manual',
      reason: 'moved',
      changedByUserId: 'admin',
    });
  });

  it('confirms a suggestion in the name of the admin', async () => {
    const { resolver, suggestions } = setup();

    await expect(
      resolver.confirmDeliverySuggestion(session, 's1')
    ).resolves.toBe(true);
    expect(suggestions.confirm).toHaveBeenCalledWith('s1', 'admin');
  });

  it('switches an audience in the name of the admin', async () => {
    const { resolver, preferences } = setup();
    const audience = { base: 'allUsers' } as any;

    await resolver.setDeliveryModeForAudience(
      session,
      audience,
      MailChannel.mail
    );

    expect(preferences.setForAudience).toHaveBeenCalledWith(
      audience,
      MailChannel.mail,
      'admin'
    );
  });

  it('reports zeros when a recompute was skipped', async () => {
    const { resolver } = setup();

    await expect(resolver.recomputeDeliverySuggestions()).resolves.toEqual({
      toLetter: 0,
      toMail: 0,
      removed: 0,
    });
  });

  it('pages the bulk switches with sensible defaults', async () => {
    const { resolver, preferences } = setup();

    await resolver.deliveryModeBulkChanges();

    expect(preferences.listBulkChanges).toHaveBeenCalledWith(0, 20, undefined);
  });

  it('pages the bulk switches of one channel', async () => {
    const { resolver, preferences } = setup();

    await resolver.deliveryModeBulkChanges(40, 20, MailChannel.letter);

    expect(preferences.listBulkChanges).toHaveBeenCalledWith(
      40,
      20,
      MailChannel.letter
    );
  });

  it('lets anyone who may list people read the channel overview', () => {
    for (const method of [
      'deliveryChannelCounts',
      'usersByDeliveryChannel',
    ] as const) {
      expect(
        Reflect.getMetadata(
          PERMISSIONS_METADATA_KEY,
          DeliveryModeResolver.prototype[method]
        )
      ).toEqual([CanGetUsers]);
    }
  });

  it("shows a person's open suggestion to whoever may see that person", () => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_METADATA_KEY,
        DeliveryModeResolver.prototype.userDeliverySuggestion
      )
    ).toEqual([CanGetUser]);
  });

  it('counts the people per channel', async () => {
    const { resolver, preferences } = setup();
    preferences.channelCounts.mockResolvedValue([
      { channel: MailChannel.mail, userCount: 7 },
    ] as never);

    await expect(resolver.deliveryChannelCounts()).resolves.toEqual([
      { channel: MailChannel.mail, userCount: 7 },
    ]);
  });

  it('pages the people of a channel with sensible defaults and a cap', async () => {
    const { resolver, preferences } = setup();

    await resolver.usersByDeliveryChannel(MailChannel.letter);
    await resolver.usersByDeliveryChannel(MailChannel.mail, 'muster', 20, 1000);

    expect(preferences.listByChannel).toHaveBeenNthCalledWith(
      1,
      MailChannel.letter,
      undefined,
      0,
      20
    );
    expect(preferences.listByChannel).toHaveBeenNthCalledWith(
      2,
      MailChannel.mail,
      'muster',
      20,
      100
    );
  });

  it('keeps a suggestion in the name of the admin', async () => {
    const { resolver, suggestions } = setup();

    await expect(resolver.keepDeliverySuggestion(session, 's1')).resolves.toBe(
      true
    );
    expect(suggestions.keep).toHaveBeenCalledWith('s1', 'admin');
  });

  it("answers with a person's open suggestion", async () => {
    const { resolver, suggestions } = setup();

    await expect(resolver.userDeliverySuggestion('u1')).resolves.toBeNull();
    expect(suggestions.userSuggestion).toHaveBeenCalledWith('u1');
  });

  it('pages suggestions with sensible defaults', async () => {
    const { resolver, suggestions } = setup();

    await resolver.deliverySuggestions(DeliverySuggestionKind.toLetter);

    expect(suggestions.list).toHaveBeenCalledWith(
      DeliverySuggestionKind.toLetter,
      0,
      20
    );
  });
});
