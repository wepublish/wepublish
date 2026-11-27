import { bounceReasonOf } from './bounce-reason';

describe('bounceReasonOf', () => {
  it("reads Mandrill's description and diagnosis from a webhook event", () => {
    expect(
      bounceReasonOf(
        JSON.stringify({
          event: 'soft_bounce',
          msg: {
            bounce_description: 'bad_mailbox',
            diag: '554 5.7.1 Recipient address rejected: User unknown',
          },
        })
      )
    ).toBe('bad_mailbox: 554 5.7.1 Recipient address rejected: User unknown');
  });

  it('reads them from a polled Mandrill message', () => {
    expect(
      bounceReasonOf(
        JSON.stringify({ state: 'bounced', bounce_description: 'bad_mailbox' })
      )
    ).toBe('bad_mailbox');
  });

  it('makes do with the diagnosis alone', () => {
    expect(
      bounceReasonOf(JSON.stringify({ msg: { diag: '452 mailbox full' } }))
    ).toBe('452 mailbox full');
  });

  it("reads Mailgun's delivery status, falling back on its reason", () => {
    expect(
      bounceReasonOf(
        JSON.stringify({
          event: 'failed',
          reason: 'bounce',
          'delivery-status': { message: '550 No such user' },
        })
      )
    ).toBe('550 No such user');
    expect(
      bounceReasonOf(JSON.stringify({ event: 'failed', reason: 'bounce' }))
    ).toBe('bounce');
  });

  it.each([null, undefined, '', 'not json', '[]', '"text"', '{}'])(
    'has nothing to say about %j',
    mailData => {
      expect(bounceReasonOf(mailData)).toBeNull();
    }
  );

  it('ignores values that are not text', () => {
    expect(
      bounceReasonOf(JSON.stringify({ msg: { diag: { nested: true } } }))
    ).toBeNull();
  });
});
