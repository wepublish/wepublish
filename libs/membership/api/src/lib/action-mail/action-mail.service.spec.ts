import { NotFoundException } from '@nestjs/common';
import {
  PaymentPeriodicity,
  PrismaClient,
  SubscriptionDeactivationReason,
  SubscriptionEvent,
  UserEvent,
} from '@prisma/client';
import { MailContext } from '@wepublish/mail/api';

import { RenewalSuccessMailService } from '../renewal-mail/renewal-success-mail.service';
import { ActionMailNoMailReason } from './action-mail-reason';
import { SubscriptionEventDictionary } from '../subscription-event-dictionary/subscription-event-dictionary';
import { ActionMailService } from './action-mail.service';

const templates: Record<string, string> = {
  'mt-subscribe': 'Abo abgeschlossen',
  'mt-deactivated': 'Abo gekündigt',
  'mt-unpaid': 'Deaktivierung wegen unbezahlter Rechnung',
  'mt-account': 'Registrierung',
  'mt-renewal': 'Zahlung erhalten',
};

const setup = ({
  subscription = {
    id: 'sub-1',
    memberPlanID: 'plan-1',
    paymentMethodID: 'pm-1',
    paymentPeriodicity: PaymentPeriodicity.yearly,
    autoRenew: true,
  } as unknown,
  flowTemplate = 'mt-subscribe' as string | null,
  accountTemplate = 'mt-account' as string | null,
  paymentMail = { mailTemplateId: 'mt-renewal' } as
    | { mailTemplateId: string }
    | { noMailReason: ActionMailNoMailReason },
} = {}) => {
  const prisma = {
    subscription: { findUnique: vi.fn().mockResolvedValue(subscription) },
    mailTemplate: {
      findUnique: vi.fn(async ({ where: { id } }: { where: { id: string } }) =>
        templates[id] ? { id, name: templates[id] } : null
      ),
    },
  };
  const mailContext = {
    getUserTemplateId: vi.fn().mockResolvedValue(accountTemplate),
  };
  const renewalSuccessMail = {
    templateForPayment: vi.fn().mockResolvedValue(paymentMail),
  };
  const lookup = vi
    .spyOn(
      SubscriptionEventDictionary.prototype,
      'getSubsciptionTemplateIdentifier'
    )
    .mockImplementation(async (_subscription, event) =>
      event === SubscriptionEvent.SUBSCRIBE ? (flowTemplate ?? undefined)
      : event === SubscriptionEvent.DEACTIVATION_BY_USER ? 'mt-deactivated'
      : event === SubscriptionEvent.DEACTIVATION_UNPAID ? 'mt-unpaid'
      : undefined
    );

  const service = new ActionMailService(
    prisma as unknown as PrismaClient,
    mailContext as unknown as MailContext,
    renewalSuccessMail as unknown as RenewalSuccessMailService
  );

  return { service, lookup, mailContext, renewalSuccessMail };
};

afterEach(() => vi.restoreAllMocks());

const draft = {
  memberPlanID: 'plan-1',
  paymentMethodID: 'pm-1',
  paymentPeriodicity: PaymentPeriodicity.yearly,
  autoRenew: true,
};

describe('ActionMailService', () => {
  describe('subscription creation', () => {
    it('names the subscribe template of the matching flow', async () => {
      const { service, lookup } = setup();

      await expect(service.forSubscriptionCreation(draft)).resolves.toEqual({
        event: SubscriptionEvent.SUBSCRIBE,
        mailTemplateId: 'mt-subscribe',
        mailTemplateName: 'Abo abgeschlossen',
      });
      expect(lookup).toHaveBeenCalledWith(
        expect.objectContaining(draft),
        SubscriptionEvent.SUBSCRIBE
      );
    });

    it('says so when the flow assigns no template', async () => {
      const { service } = setup({ flowTemplate: null });

      await expect(service.forSubscriptionCreation(draft)).resolves.toEqual({
        event: SubscriptionEvent.SUBSCRIBE,
        noMailReason: ActionMailNoMailReason.noTemplate,
      });
    });
  });

  describe('subscription cancellation', () => {
    it('names the cancellation template', async () => {
      const { service } = setup();

      await expect(
        service.forSubscriptionCancellation(
          'sub-1',
          SubscriptionDeactivationReason.userSelfDeactivated
        )
      ).resolves.toEqual({
        event: SubscriptionEvent.DEACTIVATION_BY_USER,
        mailTemplateId: 'mt-deactivated',
        mailTemplateName: 'Abo gekündigt',
      });
    });

    // the same event the cancellation itself sends (MemberContext)
    it('names the unpaid template when cancelling for an unpaid invoice', async () => {
      const { service } = setup();

      await expect(
        service.forSubscriptionCancellation(
          'sub-1',
          SubscriptionDeactivationReason.invoiceNotPaid
        )
      ).resolves.toEqual({
        event: SubscriptionEvent.DEACTIVATION_UNPAID,
        mailTemplateId: 'mt-unpaid',
        mailTemplateName: 'Deaktivierung wegen unbezahlter Rechnung',
      });
    });

    it('rejects an unknown subscription', async () => {
      const { service } = setup({ subscription: null });

      await expect(
        service.forSubscriptionCancellation(
          'missing',
          SubscriptionDeactivationReason.none
        )
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('account creation', () => {
    it('names the registration template', async () => {
      const { service, mailContext } = setup();

      await expect(service.forAccountCreation()).resolves.toEqual({
        event: UserEvent.ACCOUNT_CREATION,
        mailTemplateId: 'mt-account',
        mailTemplateName: 'Registrierung',
      });
      expect(mailContext.getUserTemplateId).toHaveBeenCalledWith(
        UserEvent.ACCOUNT_CREATION,
        false
      );
    });

    it('says so without a registration template', async () => {
      const { service } = setup({ accountTemplate: null });

      await expect(service.forAccountCreation()).resolves.toEqual({
        event: UserEvent.ACCOUNT_CREATION,
        noMailReason: ActionMailNoMailReason.noTemplate,
      });
    });
  });

  describe('invoice payment', () => {
    it('names the template the payment would send', async () => {
      const { service, renewalSuccessMail } = setup();

      await expect(service.forInvoicePayment('inv-1')).resolves.toEqual({
        event: SubscriptionEvent.RENEWAL_SUCCESS,
        mailTemplateId: 'mt-renewal',
        mailTemplateName: 'Zahlung erhalten',
      });
      expect(renewalSuccessMail.templateForPayment).toHaveBeenCalledWith(
        'inv-1'
      );
    });

    // e.g. the first period: the admin is told why nothing goes out
    it('passes on why the payment sends nothing', async () => {
      const { service } = setup({
        paymentMail: { noMailReason: ActionMailNoMailReason.firstPeriod },
      });

      await expect(service.forInvoicePayment('inv-1')).resolves.toEqual({
        event: SubscriptionEvent.RENEWAL_SUCCESS,
        noMailReason: ActionMailNoMailReason.firstPeriod,
      });
    });
  });
});
