import { AuthSessionType, UserSession } from '@wepublish/authentication/api';
import { AUTHENTICATED_METADATA_KEY } from '@wepublish/authentication/api';
import { FEATURE_METADATA_KEY } from '@wepublish/features/api';
import { PERMISSIONS_METADATA_KEY } from '@wepublish/permissions/api';
import { GiftCodeInvoiceResolver } from './gift-code-invoice.resolver';
import { GiftCodeInvoiceService } from './gift-code-invoice.service';

const metadataOf = (key: string) =>
  Reflect.getMetadata(
    key,
    GiftCodeInvoiceResolver.prototype.payInvoiceWithGiftCode
  );

describe('GiftCodeInvoiceResolver', () => {
  it('requires the gift-codes feature and a login, but no permission', () => {
    expect(metadataOf(FEATURE_METADATA_KEY)).toEqual(['gift-codes']);
    expect(metadataOf(AUTHENTICATED_METADATA_KEY)).toBe(true);
    expect(metadataOf(PERMISSIONS_METADATA_KEY)).toBeUndefined();
  });

  it('pays the invoice for the session user', async () => {
    const service = {
      payInvoice: vi.fn().mockResolvedValue({ id: 'inv-1' }),
    };
    const resolver = new GiftCodeInvoiceResolver(
      service as unknown as GiftCodeInvoiceService
    );
    const session = {
      type: AuthSessionType.User,
      user: { id: 'user-1' },
      roles: [],
    } as unknown as UserSession;
    const input = { invoiceId: 'inv-1', code: 'ABCD-EFGH-JKMN' };

    await expect(
      resolver.payInvoiceWithGiftCode(input, session)
    ).resolves.toEqual({ id: 'inv-1' });
    expect(service.payInvoice).toHaveBeenCalledWith('user-1', input);
  });
});
