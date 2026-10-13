/** Why an admin action sends the user no mail. */
export enum ActionMailNoMailReason {
  /** No template is assigned to the event. */
  noTemplate = 'noTemplate',
  /** Paying the first period of a subscription sends no payment confirmation. */
  firstPeriod = 'firstPeriod',
  /** The payment confirmation was already sent or suppressed for this invoice. */
  alreadyHandled = 'alreadyHandled',
  /** The action concerns nothing a mail could be sent about. */
  notApplicable = 'notApplicable',
}
