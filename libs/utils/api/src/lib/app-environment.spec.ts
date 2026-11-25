import {
  isLoadTestAllowed,
  isSimulatedPaymentAllowed,
} from './app-environment';

describe('isSimulatedPaymentAllowed', () => {
  it.each(['local', 'review', 'staging', 'development'])(
    'allows simulated payments on %s',
    APP_ENVIRONMENT => {
      expect(isSimulatedPaymentAllowed({ APP_ENVIRONMENT })).toBe(true);
    }
  );

  it('forbids simulated payments on production', () => {
    expect(isSimulatedPaymentAllowed({ APP_ENVIRONMENT: 'production' })).toBe(
      false
    );
  });

  it('forbids simulated payments when the environment is not declared', () => {
    expect(isSimulatedPaymentAllowed({})).toBe(false);
    expect(isSimulatedPaymentAllowed({ APP_ENVIRONMENT: '' })).toBe(false);
  });
});

describe('isLoadTestAllowed', () => {
  it.each(['local', 'review', 'development'])(
    'allows load tests on %s',
    APP_ENVIRONMENT => {
      expect(isLoadTestAllowed({ APP_ENVIRONMENT })).toBe(true);
    }
  );

  it.each(['production', 'staging'])(
    'forbids load tests on %s',
    APP_ENVIRONMENT => {
      expect(isLoadTestAllowed({ APP_ENVIRONMENT })).toBe(false);
    }
  );

  it('forbids load tests when the environment is not declared', () => {
    expect(isLoadTestAllowed({})).toBe(false);
  });
});
