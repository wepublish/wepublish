import { testMailInput } from './test-mail-input';

describe('testMailInput', () => {
  it('sends only the fields a test mail accepts, without the letter stationery', () => {
    expect(
      testMailInput({
        contextId: 'account',
        subscriptionId: 'subscription-1',
        subject: 'Test-E-Mail',
        htmlContent: '<p>Hallo</p>',
        textContent: 'Hallo',
        letterLayoutId: null,
        letterAppendixId: 'qr-bill',
      })
    ).toEqual({
      contextId: 'account',
      subscriptionId: 'subscription-1',
      subject: 'Test-E-Mail',
      htmlContent: '<p>Hallo</p>',
      textContent: 'Hallo',
    });
  });

  it('keeps the attachments chosen on the draft', () => {
    expect(
      testMailInput({
        contextId: 'account',
        subject: 'Test-E-Mail',
        htmlContent: '<p>Hallo</p>',
        attachmentIds: ['contract', 'terms'],
      })
    ).toEqual({
      contextId: 'account',
      subject: 'Test-E-Mail',
      htmlContent: '<p>Hallo</p>',
      attachmentIds: ['contract', 'terms'],
    });
  });
});
