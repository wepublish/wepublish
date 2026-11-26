import { ForbiddenException } from '@nestjs/common';
import {
  AUTHENTICATED_METADATA_KEY,
  AuthSessionType,
  TokenSession,
  UserSession,
} from '@wepublish/authentication/api';
import { FEATURE_METADATA_KEY } from '@wepublish/features/api';
import { PERMISSIONS_METADATA_KEY } from '@wepublish/permissions/api';
import { GiftCodeRedemptionAction } from './gift-code-redemption.model';
import { GiftCodeRedemptionResolver } from './gift-code-redemption.resolver';
import { GiftCodeRedemptionService } from './gift-code-redemption.service';

const metadataOf = (key: string) =>
  Reflect.getMetadata(key, GiftCodeRedemptionResolver.prototype.redeemGiftCode);

const setup = () => {
  const redemption = {
    action: GiftCodeRedemptionAction.paidInvoice,
    subscription: { id: 'sub-1' },
    invoice: { id: 'inv-1' },
  };
  const service = { redeem: vi.fn().mockResolvedValue(redemption) };
  const resolver = new GiftCodeRedemptionResolver(
    service as unknown as GiftCodeRedemptionService
  );

  return { resolver, service, redemption };
};

describe('GiftCodeRedemptionResolver', () => {
  it('requires the gift-codes feature and a login, but no permission', () => {
    expect(metadataOf(FEATURE_METADATA_KEY)).toEqual(['gift-codes']);
    expect(metadataOf(AUTHENTICATED_METADATA_KEY)).toBe(true);
    expect(metadataOf(PERMISSIONS_METADATA_KEY)).toBeUndefined();
  });

  it('redeems the code for the session user', async () => {
    const { resolver, service, redemption } = setup();
    const session = {
      type: AuthSessionType.User,
      user: { id: 'user-1' },
      roles: [],
    } as unknown as UserSession;

    await expect(
      resolver.redeemGiftCode({ code: 'ABCD-EFGH-JKMN' }, session)
    ).resolves.toBe(redemption);
    expect(service.redeem).toHaveBeenCalledWith('user-1', 'ABCD-EFGH-JKMN');
  });

  it('refuses a session without a user', async () => {
    const { resolver, service } = setup();
    const session = {
      type: AuthSessionType.Token,
      token: { id: 'token-1' },
      roles: [],
    } as unknown as TokenSession;

    expect(() =>
      resolver.redeemGiftCode({ code: 'ABCD-EFGH-JKMN' }, session)
    ).toThrow(ForbiddenException);
    expect(service.redeem).not.toHaveBeenCalled();
  });
});
