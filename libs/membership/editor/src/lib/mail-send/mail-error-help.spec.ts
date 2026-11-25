import { MailLogState } from '@wepublish/editor/api';

import { mailErrorHelpKey } from './mail-log-common';

describe('mailErrorHelpKey', () => {
  it.each([
    ['bad_mailbox: smtp;554 5.7.1 User unknown', 'mailboxGone'],
    ['invalid_domain', 'mailboxGone'],
    ['mailbox_full: 452 4.2.2 Over quota', 'mailboxFull'],
    ['general: 451 4.7.1 Try again later', 'bounce'],
    // The receiving server's code says nothing about the sending setup here.
    ['general: 550 5.7.1 Message refused', 'bounce'],
  ])('explains the bounce «%s» as %s', (error, key) => {
    expect(mailErrorHelpKey(error, MailLogState.Bounced)).toBe(key);
    expect(mailErrorHelpKey(error, MailLogState.Deferred)).toBe(key);
  });

  it('keeps explaining a mail that could not be sent by its sending error', () => {
    expect(mailErrorHelpKey('550 mailbox unavailable')).toBe(
      'recipientRejected'
    );
    expect(
      mailErrorHelpKey('550 mailbox unavailable', MailLogState.Rejected)
    ).toBe('recipientRejected');
    expect(mailErrorHelpKey('something else', MailLogState.Rejected)).toBe(
      'generic'
    );
  });
});
