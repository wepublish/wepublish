import { invoiceMailRecipient } from './bexio-test-mailbox';

describe('invoiceMailRecipient', () => {
  const review = { APP_ENVIRONMENT: 'review' };
  const mailbox = 'bexio@abc.resend.app';

  it('sends to the test mailbox for a recipient on its domain', () => {
    expect(
      invoiceMailRecipient('nw-00001@abc.resend.app', mailbox, review)
    ).toBe(mailbox);
  });

  it('compares the domain without case', () => {
    expect(
      invoiceMailRecipient('NW-00001@ABC.Resend.App', mailbox, review)
    ).toBe(mailbox);
  });

  it('leaves recipients on other domains alone', () => {
    expect(invoiceMailRecipient('reader@example.ch', mailbox, review)).toBe(
      'reader@example.ch'
    );
  });

  it('does not treat a subdomain as the same domain', () => {
    expect(
      invoiceMailRecipient('reader@x.abc.resend.app', mailbox, review)
    ).toBe('reader@x.abc.resend.app');
  });

  it('leaves the recipient alone without a test mailbox', () => {
    expect(invoiceMailRecipient('nw-00001@abc.resend.app', null, review)).toBe(
      'nw-00001@abc.resend.app'
    );
  });

  it('never redirects on production', () => {
    expect(
      invoiceMailRecipient('nw-00001@abc.resend.app', mailbox, {
        APP_ENVIRONMENT: 'production',
      })
    ).toBe('nw-00001@abc.resend.app');
  });

  it('never redirects on a deployment without APP_ENVIRONMENT', () => {
    expect(invoiceMailRecipient('nw-00001@abc.resend.app', mailbox, {})).toBe(
      'nw-00001@abc.resend.app'
    );
  });
});
