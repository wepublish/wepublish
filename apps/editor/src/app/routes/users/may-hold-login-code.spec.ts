import { mayHoldLoginCode } from './may-hold-login-code';

const role = (...permissionIDs: string[]) => ({
  permissions: permissionIDs.map(id => ({ id })),
});

describe('mayHoldLoginCode', () => {
  it('holds for a reader without roles', () => {
    expect(mayHoldLoginCode([])).toBe(true);
    expect(mayHoldLoginCode(undefined)).toBe(true);
  });

  it('holds for a reader whose role only lets them past the paywall', () => {
    expect(mayHoldLoginCode([role('CAN_GET_ARTICLE')])).toBe(true);
  });

  it('does not hold for staff', () => {
    expect(
      mayHoldLoginCode([role('CAN_GET_ARTICLE'), role('CAN_LOGIN_EDITOR')])
    ).toBe(false);
  });
});
