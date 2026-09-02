import { User, UserAddress } from '@prisma/client';
import { LetterAddress } from './letter-provider/letter-provider.interface';

export class LetterAddressError extends Error {}

const COUNTRY_CODES: Record<string, string> = {
  schweiz: 'CH',
  suisse: 'CH',
  svizzera: 'CH',
  svizra: 'CH',
  switzerland: 'CH',
  deutschland: 'DE',
  germany: 'DE',
  allemagne: 'DE',
  österreich: 'AT',
  oesterreich: 'AT',
  austria: 'AT',
  autriche: 'AT',
  liechtenstein: 'LI',
  frankreich: 'FR',
  france: 'FR',
  francia: 'FR',
  italien: 'IT',
  italy: 'IT',
  italia: 'IT',
  italie: 'IT',
};

const FIELD_LIMITS = {
  name: 45,
  street: 40,
  pobox: 45,
  number: 10,
  zip: 8,
  city: 25,
};

export function normalizeCountry(country: string | null): string | null {
  const value = country?.trim();

  if (!value) {
    return null;
  }

  if (/^[a-zA-Z]{2}$/.test(value)) {
    return value.toUpperCase();
  }

  return COUNTRY_CODES[value.toLowerCase()] ?? null;
}

function truncate(value: string, limit: number): string {
  return value.length > limit ? value.slice(0, limit) : value;
}

export type UserWithAddress = User & { address: UserAddress | null };

export function toLetterAddress(user: UserWithAddress): LetterAddress {
  const address = user.address;

  if (!address) {
    throw new LetterAddressError(`User ${user.id} has no address`);
  }

  const name =
    address.company?.trim() ||
    [user.firstName, user.name].filter(Boolean).join(' ').trim();

  if (!name) {
    throw new LetterAddressError(`User ${user.id} has no name to address`);
  }

  const primaryStreet = address.streetAddress?.trim();
  const secondaryStreet = address.streetAddress2?.trim();

  if (!primaryStreet && !secondaryStreet) {
    throw new LetterAddressError(`User ${user.id} has no street address`);
  }

  if (!address.zipCode?.trim() || !address.city?.trim()) {
    throw new LetterAddressError(`User ${user.id} has no zip code or city`);
  }

  const country = normalizeCountry(address.country);

  if (!country) {
    throw new LetterAddressError(
      `User ${user.id} has no usable country (${address.country ?? 'empty'})`
    );
  }

  const street = primaryStreet || (secondaryStreet as string);
  const number =
    primaryStreet ?
      address.streetAddressNumber?.trim()
    : address.streetAddress2Number?.trim();

  return {
    name: truncate(name, FIELD_LIMITS.name),
    street: truncate(street, FIELD_LIMITS.street),
    number: number ? truncate(number, FIELD_LIMITS.number) : undefined,
    zip: truncate(address.zipCode.trim(), FIELD_LIMITS.zip),
    city: truncate(address.city.trim(), FIELD_LIMITS.city),
    country,
  };
}

export function canReceiveLetters(user: UserWithAddress): boolean {
  try {
    toLetterAddress(user);

    return true;
  } catch {
    return false;
  }
}
