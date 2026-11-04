import { encryptSecrets } from './encrypt-secrets';

const encrypt = (value: string) => `enc(${value})`;

describe('encryptSecrets', () => {
  it('encrypts a secret that was typed in', () => {
    expect(
      encryptSecrets({ id: 'x', apiKey: 'key' }, ['apiKey'], encrypt)
    ).toEqual({ id: 'x', apiKey: 'enc(key)' });
  });

  it('drops an empty secret, so the stored one stays', () => {
    expect(
      encryptSecrets(
        { id: 'x', apiKey: '', webhookEndpointSecret: 'hook' },
        ['apiKey', 'webhookEndpointSecret'],
        encrypt
      )
    ).toEqual({ id: 'x', webhookEndpointSecret: 'enc(hook)' });
  });

  it('passes null through, which clears the secret on purpose', () => {
    expect(encryptSecrets({ apiKey: null }, ['apiKey'], encrypt)).toEqual({
      apiKey: null,
    });
  });

  it('leaves out what was not sent', () => {
    expect(encryptSecrets({ id: 'x' }, ['apiKey'], encrypt)).toEqual({
      id: 'x',
    });
  });
});
