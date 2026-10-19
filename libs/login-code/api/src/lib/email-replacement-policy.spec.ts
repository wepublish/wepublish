import { codeSessionMayReplaceEmail } from './email-replacement-policy';
import { LoginCodeSecondFactor } from './login-code-second-factor';

describe('codeSessionMayReplaceEmail', () => {
  it('lets a placeholder address be replaced, as there is nothing to take over', () => {
    expect(
      codeSessionMayReplaceEmail({
        placeholderEmail: true,
        secondFactor: LoginCodeSecondFactor.none,
      })
    ).toBe(true);
  });

  // A real address may look fine and still be dead (outdated, abandoned), so
  // replacing it needs proof of holding the letter, not of the address being bad.
  it('lets a real address be replaced with the second factor from the letter', () => {
    expect(
      codeSessionMayReplaceEmail({
        placeholderEmail: false,
        secondFactor: LoginCodeSecondFactor.postalCode,
      })
    ).toBe(true);
  });

  it('keeps a real address unless a second factor guards it, so a found letter code alone cannot take the account over', () => {
    expect(
      codeSessionMayReplaceEmail({
        placeholderEmail: false,
        secondFactor: LoginCodeSecondFactor.none,
      })
    ).toBe(false);
  });
});
