import { registerEnumType } from '@nestjs/graphql';
import { createHash, timingSafeEqual } from 'crypto';

export enum LoginCodeSecondFactor {
  none = 'none',
  postalCode = 'postalCode',
  city = 'city',
  firstName = 'firstName',
  lastName = 'lastName',
}

registerEnumType(LoginCodeSecondFactor, {
  name: 'LoginCodeSecondFactor',
  description:
    'Attribute printed on the letter that a restricted session must confirm before it can claim the account with a real email address.',
});

export const LOGIN_CODE_SECOND_FACTORS = Object.values(LoginCodeSecondFactor);

export const DEFAULT_LOGIN_CODE_SECOND_FACTOR = LoginCodeSecondFactor.none;

export const parseLoginCodeSecondFactor = (
  value: unknown
): LoginCodeSecondFactor =>
  LOGIN_CODE_SECOND_FACTORS.includes(value as LoginCodeSecondFactor) ?
    (value as LoginCodeSecondFactor)
  : DEFAULT_LOGIN_CODE_SECOND_FACTOR;

export type SecondFactorUser = {
  firstName?: string | null;
  name?: string | null;
  address?: {
    zipCode?: string | null;
    city?: string | null;
  } | null;
};

const MIN_POSTAL_DIGITS = 4;

export const normalizeSecondFactorAnswer = (
  value: string | null | undefined
): string =>
  (value ?? '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');

export const secondFactorValue = (
  factor: LoginCodeSecondFactor,
  user: SecondFactorUser
): string | null => {
  switch (factor) {
    case LoginCodeSecondFactor.postalCode:
      return user.address?.zipCode ?? null;
    case LoginCodeSecondFactor.city:
      return user.address?.city ?? null;
    case LoginCodeSecondFactor.firstName:
      return user.firstName ?? null;
    case LoginCodeSecondFactor.lastName:
      return user.name ?? null;
    default:
      return null;
  }
};

export const hasSecondFactor = (
  factor: LoginCodeSecondFactor,
  user: SecondFactorUser
): boolean =>
  factor === LoginCodeSecondFactor.none ||
  normalizeSecondFactorAnswer(secondFactorValue(factor, user)).length > 0;

const digest = (value: string) => createHash('sha256').update(value).digest();

const safeEqual = (expected: string, given: string) =>
  expected.length > 0 && timingSafeEqual(digest(expected), digest(given));

export const matchesSecondFactor = (
  factor: LoginCodeSecondFactor,
  user: SecondFactorUser,
  answer: string | null | undefined
): boolean => {
  if (factor === LoginCodeSecondFactor.none) {
    return true;
  }

  const expected = normalizeSecondFactorAnswer(secondFactorValue(factor, user));
  const given = normalizeSecondFactorAnswer(answer);

  if (!expected || !given) {
    return false;
  }

  if (safeEqual(expected, given)) {
    return true;
  }

  if (factor !== LoginCodeSecondFactor.postalCode) {
    return false;
  }

  const expectedDigits = expected.replace(/\D/g, '');
  const givenDigits = given.replace(/\D/g, '');

  return (
    expectedDigits.length >= MIN_POSTAL_DIGITS &&
    safeEqual(expectedDigits, givenDigits)
  );
};

export const maskSecondFactor = <T extends SecondFactorUser>(
  factor: LoginCodeSecondFactor,
  user: T
): T => {
  switch (factor) {
    case LoginCodeSecondFactor.postalCode:
      return user.address ?
          { ...user, address: { ...user.address, zipCode: null } }
        : user;
    case LoginCodeSecondFactor.city:
      return user.address ?
          { ...user, address: { ...user.address, city: null } }
        : user;
    case LoginCodeSecondFactor.firstName:
      return { ...user, firstName: null };
    case LoginCodeSecondFactor.lastName:
      return { ...user, name: '' };
    default:
      return user;
  }
};
