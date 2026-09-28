import { createKvMock } from '@wepublish/kv-ttl-cache/api';
import { SettingName } from '@wepublish/settings/api';
import { LoginCodeSecondFactor } from './login-code-second-factor';
import {
  LoginCodeSecondFactorService,
  SECOND_FACTOR_MAX_FAILURES,
} from './login-code-second-factor.service';
import {
  SecondFactorInvalidError,
  TooManyAttemptsError,
} from './login-code.errors';

const createService = (value: unknown) => {
  const prisma = {
    setting: {
      findUnique: jest.fn(
        async ({ where }: { where: { name: SettingName } }) =>
          where.name === SettingName.LOGIN_CODE_SECOND_FACTOR ? { value } : null
      ),
    },
  };

  return {
    prisma,
    service: new LoginCodeSecondFactorService(prisma as never, createKvMock()),
  };
};

const user = {
  id: 'user-1',
  firstName: 'Anna',
  name: 'Muster',
  address: { zipCode: '8000', city: 'Zürich' },
};

describe('LoginCodeSecondFactorService', () => {
  it('falls back to none when the setting is missing or invalid', async () => {
    await expect(createService(undefined).service.getFactor()).resolves.toBe(
      LoginCodeSecondFactor.none
    );
    await expect(createService('nope').service.getFactor()).resolves.toBe(
      LoginCodeSecondFactor.none
    );
    await expect(createService('city').service.getFactor()).resolves.toBe(
      LoginCodeSecondFactor.city
    );
  });

  it('passes without an answer when no factor is configured', async () => {
    const { service } = createService('none');

    await expect(service.assert(user, undefined)).resolves.toBeUndefined();
  });

  it('rejects a wrong answer and accepts the right one afterwards', async () => {
    const { service } = createService('postalCode');

    await expect(service.assert(user, '8001')).rejects.toBeInstanceOf(
      SecondFactorInvalidError
    );
    await expect(service.assert(user, '8000')).resolves.toBeUndefined();
  });

  it('rejects a missing answer when a factor is configured', async () => {
    const { service } = createService('lastName');

    await expect(service.assert(user, undefined)).rejects.toBeInstanceOf(
      SecondFactorInvalidError
    );
  });

  it('locks the user after too many failures, even for the right answer', async () => {
    const { service } = createService('postalCode');

    for (let i = 1; i < SECOND_FACTOR_MAX_FAILURES; i++) {
      await expect(service.assert(user, 'wrong')).rejects.toBeInstanceOf(
        SecondFactorInvalidError
      );
    }

    await expect(service.assert(user, 'wrong')).rejects.toBeInstanceOf(
      TooManyAttemptsError
    );
    await expect(service.assert(user, '8000')).rejects.toBeInstanceOf(
      TooManyAttemptsError
    );
    await expect(
      service.assert({ ...user, id: 'user-2' }, '8000')
    ).resolves.toBeUndefined();
  });

  it('reports whether the user can satisfy the factor', async () => {
    const { service } = createService('postalCode');

    await expect(service.isAvailable(user)).resolves.toBe(true);
    await expect(service.isAvailable({ ...user, address: null })).resolves.toBe(
      false
    );
  });

  it('masks the configured attribute', async () => {
    const { service } = createService('firstName');

    await expect(service.mask(user)).resolves.toEqual({
      ...user,
      firstName: null,
    });
  });
});
