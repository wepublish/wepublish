import { SettingName } from '@wepublish/editor/api';
import { isLoginCodeEnabled } from './login-code-enabled';

const setting = (name: SettingName, value: unknown) => ({ name, value });

describe('isLoginCodeEnabled', () => {
  it('is on once the medium switched login codes on', () => {
    expect(
      isLoginCodeEnabled([setting(SettingName.LoginCodeEnabled, true)])
    ).toBe(true);
  });

  it.each([
    ['switched off', [setting(SettingName.LoginCodeEnabled, false)]],
    ['never set', [setting(SettingName.LoginCodeMaxUses, 5)]],
    ['still loading', undefined],
  ])('is off while %s', (_label, settings) => {
    expect(isLoginCodeEnabled(settings)).toBe(false);
  });
});
