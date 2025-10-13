import { Row } from './row';
import { createUser, deleteUser, findUserByEmail } from './private-api';
import { randomUUID } from 'crypto';
import { deleteUserSubscriptions } from './subscription';
import { UserInput } from '../../api/private';
import { slugify } from '../posts/utils';

const deleteUserWhenFound = false;

export async function migrateUser(row: Row) {
  const {
    streetAddress,
    zipCode,
    city,
    country,
    firstName,
    companyOrLastName,
    dateOfBirth,
  } = row;
  let { email } = row;

  email = email.trim().toLowerCase();

  if (!email || email === '0') {
    email = `user+${slugify(
      [firstName, companyOrLastName].filter(e => e).join('-')
    )}@mannschaft.com`;
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    console.debug('         user exists ', email);
    if (deleteUserWhenFound) {
      console.debug('         user delete ', email);
      await deleteUserSubscriptions(existingUser);
      await deleteUser(existingUser.id);
    } else {
      return existingUser;
    }
  }
  const input: UserInput = {
    active: true,
    address: {
      streetAddress,
      zipCode,
      city,
      country: mapCountry(country),
    },
    email,
    emailVerifiedAt: new Date().toISOString(),
    firstName,
    flair: undefined,
    name: companyOrLastName.substring(0, 50),
    properties: [],
    roleIDs: undefined,
    userImageID: undefined,
    birthday: dateOfBirth ? dateOfBirth.toISOString() : undefined,
  };
  console.debug('         user create ', email);
  return await createUser({ ...input, password: randomUUID() });
}

const countryMappings: { [key: string]: string } = {
  Grossbritannien: 'Großbritannien',
};

const mapCountry = (country: string) => {
  if (country in countryMappings) {
    return countryMappings[country];
  }
  return country;
};
