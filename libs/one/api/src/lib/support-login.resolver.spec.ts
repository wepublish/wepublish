import { SupportLoginResolver } from './support-login.resolver';

describe('SupportLoginResolver', () => {
  const previous = process.env['WEP_ONE_IMPERSONATION'];

  afterEach(() => {
    if (previous === undefined) {
      delete process.env['WEP_ONE_IMPERSONATION'];
    } else {
      process.env['WEP_ONE_IMPERSONATION'] = previous;
    }
  });

  it('can be asked by the login page, before anyone is signed in', () => {
    expect(
      Reflect.getMetadata(
        'public',
        SupportLoginResolver.prototype.supportLoginEnabled
      )
    ).toBe(true);
  });

  it('offers the support login unless the medium switched impersonation off', () => {
    delete process.env['WEP_ONE_IMPERSONATION'];
    expect(new SupportLoginResolver().supportLoginEnabled()).toBe(true);

    process.env['WEP_ONE_IMPERSONATION'] = 'false';
    expect(new SupportLoginResolver().supportLoginEnabled()).toBe(false);
  });
});
