import { MailLogState } from '@prisma/client';
import { shouldUpdateMailLogState } from './mail.webhook';

describe('shouldUpdateMailLogState', () => {
  it('moves a mail forward', () => {
    expect(
      shouldUpdateMailLogState(MailLogState.submitted, MailLogState.delivered)
    ).toBe(true);
    expect(
      shouldUpdateMailLogState(MailLogState.deferred, MailLogState.delivered)
    ).toBe(true);
    expect(
      shouldUpdateMailLogState(MailLogState.delivered, MailLogState.bounced)
    ).toBe(true);
  });

  it('keeps a bounce when a late send event arrives', () => {
    expect(
      shouldUpdateMailLogState(MailLogState.bounced, MailLogState.delivered)
    ).toBe(false);
    expect(
      shouldUpdateMailLogState(MailLogState.rejected, MailLogState.deferred)
    ).toBe(false);
  });

  it('does not fall back from delivered to deferred', () => {
    expect(
      shouldUpdateMailLogState(MailLogState.delivered, MailLogState.deferred)
    ).toBe(false);
  });

  it('accepts a retried event for the same state', () => {
    expect(
      shouldUpdateMailLogState(MailLogState.bounced, MailLogState.bounced)
    ).toBe(true);
  });
});
