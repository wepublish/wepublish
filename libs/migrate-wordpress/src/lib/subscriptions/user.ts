import {Row} from './row'
import {createUser, deleteUser, findUserByEmail} from './private-api'
import {randomUUID} from 'crypto'
import {deleteUserSubscriptions} from './subscription'

const deleteUserWhenFound = true

export async function migrateUser(row: Row) {
  const {email, streetAddress, zipCode, city, country, firstName, companyOrLastName} = row

  const existingUser = await findUserByEmail(email)
  if (existingUser) {
    console.debug('         user exists ', email)
    if (deleteUserWhenFound) {
      console.debug('         user delete ', email)
      await deleteUserSubscriptions(existingUser)
      await deleteUser(existingUser.id)
    } else {
      return existingUser
    }
  }

  console.debug('         user create ', email)
  return await createUser({
    active: true,
    address: {
      streetAddress,
      zipCode,
      city,
      country
    },
    email,
    emailVerifiedAt: new Date().toISOString(),
    firstName,
    flair: undefined,
    name: companyOrLastName,
    preferredName: undefined,
    properties: [],
    roleIDs: undefined,
    userImageID: undefined,
    password: randomUUID()
  })
}
