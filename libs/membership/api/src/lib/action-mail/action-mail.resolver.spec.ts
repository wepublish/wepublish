import {
  PaymentPeriodicity,
  SubscriptionDeactivationReason,
} from '@prisma/client';
import {
  CanCreateInvoice,
  CanCreateSubscription,
  CanCreateUser,
} from '@wepublish/permissions';
import { PERMISSIONS_METADATA_KEY } from '@wepublish/permissions/api';

import { ActionMailResolver } from './action-mail.resolver';
import { ActionMailService } from './action-mail.service';

const mail = {
  event: 'SUBSCRIBE',
  mailTemplateId: 'mt-1',
  mailTemplateName: 'Template',
};
const noMail = { event: 'RENEWAL_SUCCESS', noMailReason: 'firstPeriod' };

const setup = () => {
  const service = {
    forSubscriptionCreation: vi.fn().mockResolvedValue(mail),
    forSubscriptionCancellation: vi.fn().mockResolvedValue(mail),
    forAccountCreation: vi.fn().mockResolvedValue(mail),
    forInvoicePayment: vi.fn().mockResolvedValue(noMail),
  };

  return {
    resolver: new ActionMailResolver(service as unknown as ActionMailService),
    service,
  };
};

const permissionsOf = (method: keyof ActionMailResolver) =>
  Reflect.getMetadata(
    PERMISSIONS_METADATA_KEY,
    ActionMailResolver.prototype[method]
  );

describe('ActionMailResolver', () => {
  // only someone who may run the action may ask what it would send
  it.each([
    ['subscriptionCreationMail', CanCreateSubscription],
    ['subscriptionCancellationMail', CanCreateSubscription],
    ['accountCreationMail', CanCreateUser],
    ['invoicePaymentMail', CanCreateInvoice],
  ] as const)('guards %s like its mutation', (method, permission) => {
    expect(permissionsOf(method)).toEqual([permission]);
  });

  it('looks up the mail of a subscription about to be created', async () => {
    const { resolver, service } = setup();
    const draft = {
      memberPlanID: 'plan-1',
      paymentMethodID: 'pm-1',
      paymentPeriodicity: PaymentPeriodicity.monthly,
      autoRenew: false,
    };

    await expect(resolver.subscriptionCreationMail(draft)).resolves.toBe(mail);
    expect(service.forSubscriptionCreation).toHaveBeenCalledWith(draft);
  });

  it('looks up the mail of a cancellation with its reason', async () => {
    const { resolver, service } = setup();

    await resolver.subscriptionCancellationMail(
      'sub-1',
      SubscriptionDeactivationReason.invoiceNotPaid
    );

    expect(service.forSubscriptionCancellation).toHaveBeenCalledWith(
      'sub-1',
      SubscriptionDeactivationReason.invoiceNotPaid
    );
  });

  it('looks up the registration mail', async () => {
    const { resolver, service } = setup();

    await expect(resolver.accountCreationMail()).resolves.toBe(mail);
    expect(service.forAccountCreation).toHaveBeenCalled();
  });

  it('passes on why paying the invoice sends nothing', async () => {
    const { resolver, service } = setup();

    await expect(resolver.invoicePaymentMail('inv-1')).resolves.toBe(noMail);
    expect(service.forInvoicePayment).toHaveBeenCalledWith('inv-1');
  });
});
