import {
  MailTemplateContext,
  SubscriptionEvent,
  UserEvent,
} from '@wepublish/editor/api';

const PURPOSES: Partial<
  Record<SubscriptionEvent | UserEvent, MailTemplateContext>
> = {
  [SubscriptionEvent.Subscribe]: MailTemplateContext.Subscription,
  [SubscriptionEvent.ConfirmSubscription]: MailTemplateContext.Subscription,
  [SubscriptionEvent.DeactivationByUser]: MailTemplateContext.Subscription,
  [SubscriptionEvent.DeactivationUnpaid]: MailTemplateContext.Subscription,
  [SubscriptionEvent.RenewalSuccess]: MailTemplateContext.Renewal,
  [SubscriptionEvent.RenewalFailed]: MailTemplateContext.Renewal,
  [SubscriptionEvent.InvoiceCreation]: MailTemplateContext.InvoiceCreation,
  [SubscriptionEvent.Custom]: MailTemplateContext.Custom,
  [UserEvent.AccountCreation]: MailTemplateContext.Account,
  [UserEvent.LoginLink]: MailTemplateContext.Account,
  [UserEvent.PasswordReset]: MailTemplateContext.Account,
  [UserEvent.EmailChange]: MailTemplateContext.EmailChange,
};

/**
 * The purpose a template for an event is normally written for. The chooser
 * starts narrowed to it; nothing stops a template of another purpose from
 * being picked. Undefined where any template will do.
 */
export const purposeOfEvent = (
  event: SubscriptionEvent | UserEvent
): MailTemplateContext | undefined => PURPOSES[event];
