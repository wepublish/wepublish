import { templateUsesPurl } from './mail-data';

describe('templateUsesPurl', () => {
  it.each([
    ['the link', { htmlContent: '<a href="{{purl}}">Anmelden</a>' }],
    ['the typed code', { textContent: 'Ihr Code: {{ purlCode }}' }],
    ['the QR code', { htmlContent: '{{PURLQR}}' }],
    ['the subject', { subject: 'Code {{purlCode}}' }],
  ])('holds when a template shows %s', (_name, template) => {
    expect(templateUsesPurl(template)).toBe(true);
  });

  it('does not hold for a template without any of them', () => {
    expect(
      templateUsesPurl({
        subject: 'Hallo {{user_firstName}}',
        htmlContent: '<a href="{{jwt}}">Login</a> {{purlx}}',
        textContent: null,
      })
    ).toBe(false);
  });
});
