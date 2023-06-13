import {ApolloServer} from 'apollo-server-express'
import {
  CreateSession,
  CreateUser,
  DeleteUser,
  ResetUserPassword,
  UpdateUser,
  User,
  UserInput,
  UserList
} from '../api/private'

import {createGraphQLTestClientWithPrisma, generateRandomString} from '../utility'
import {UpdatePaymentProviderCustomers} from '../api/public'
import snapshotDiff from 'snapshot-diff'

let testServerPrivate: ApolloServer
let testServerPublic: ApolloServer

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithPrisma()
    testServerPrivate = setupClient.testServerPrivate
    testServerPublic = setupClient.testServerPublic
  } catch (error) {
    console.log('Error', error)
    throw new Error('Error during test setup')
  }
})

describe('Users', () => {
  describe('can be created/updated/edited/deleted:', () => {
    const ids: string[] = []

    beforeAll(async () => {
      const input: UserInput = {
        name: 'Bruce Wayne',
        email: `${generateRandomString()}@wepublish.ch`,
        emailVerifiedAt: new Date().toISOString(),
        properties: [],
        active: true,
        roleIDs: []
      }
      const res = await testServerPrivate.executeOperation({
        query: CreateUser,
        variables: {
          input,
          password: 'p@$$w0rd'
        }
      })

      ids.unshift(res.data?.createUser.id)
    })

    describe('public', () => {
      describe('updatePaymentProviderCustomers', () => {
        test('can add payment provider customers', async () => {
          const addPaymentProviderCustomers = await testServerPublic.executeOperation({
            query: UpdatePaymentProviderCustomers,
            variables: {
              customers: [
                {
                  paymentProviderID: '123-123',
                  customerID: '1234-1234'
                },
                {
                  paymentProviderID: '122-122',
                  customerID: '1233-1233'
                }
              ]
            }
          })

          expect(addPaymentProviderCustomers).toMatchSnapshot()
        })

        test('can update payment provider customers', async () => {
          const addPaymentProviderCustomers = await testServerPublic.executeOperation({
            query: UpdatePaymentProviderCustomers,
            variables: {
              customers: [
                {
                  paymentProviderID: '123-123',
                  customerID: '1234-1234'
                },
                {
                  paymentProviderID: '122-122',
                  customerID: '1233-1233'
                }
              ]
            }
          })

          const updatePaymentProviderCustomers = await testServerPublic.executeOperation({
            query: UpdatePaymentProviderCustomers,
            variables: {
              customers: [
                {
                  paymentProviderID: '123-123',
                  customerID: '1234-1234'
                },
                {
                  paymentProviderID: '121-121',
                  customerID: '1222-1222'
                }
              ]
            }
          })

          expect(
            snapshotDiff(addPaymentProviderCustomers, updatePaymentProviderCustomers)
          ).toMatchSnapshot()
        })
      })
    })

    describe('private', () => {
      test('can be created', async () => {
        const input: UserInput = {
          name: 'Robin Wayne',
          email: `${generateRandomString()}@wepublish.ch`,
          emailVerifiedAt: new Date().toISOString(),
          properties: [],
          active: true,
          roleIDs: []
        }

        const res = await testServerPrivate.executeOperation({
          query: CreateUser,
          variables: {
            input,
            password: 'pwd123'
          }
        })

        expect(res).toMatchSnapshot({
          data: {
            createUser: {
              id: expect.any(String),
              email: expect.any(String),
              emailVerifiedAt: expect.any(Date)
            }
          }
        })
        ids.unshift(res.data?.createUser.id)
      })

      test('can be read in list', async () => {
        const res = await testServerPrivate.executeOperation({
          query: UserList,
          variables: {
            take: 100
          }
        })

        expect(res.data?.users.nodes).not.toHaveLength(0)
      })

      test('can be read by id', async () => {
        const res = await testServerPrivate.executeOperation({
          query: User,
          variables: {
            id: ids[0]
          }
        })

        expect(res).toMatchSnapshot({
          data: {
            user: {
              id: expect.any(String),
              email: expect.any(String),
              emailVerifiedAt: expect.any(Date)
            }
          }
        })
      })

      test('can be updated', async () => {
        const res = await testServerPrivate.executeOperation({
          query: UpdateUser,
          variables: {
            input: {
              name: 'Dark Knight',
              email: `${generateRandomString()}@wepublish.ch`,
              emailVerifiedAt: null,
              properties: [],
              active: true,
              roleIDs: []
            },
            id: ids[0]
          }
        })

        expect(res).toMatchSnapshot({
          data: {
            updateUser: {
              id: expect.any(String),
              email: expect.any(String)
            }
          }
        })
      })

      test('can reset user password', async () => {
        const input: UserInput = {
          name: 'Robin Wayne',
          email: `${generateRandomString()}@wepublish.ch`,
          emailVerifiedAt: new Date().toISOString(),
          properties: [],
          active: true,
          roleIDs: []
        }

        const createdUser = await testServerPrivate.executeOperation({
          query: CreateUser,
          variables: {
            input,
            password: 'p@$$w0rd'
          }
        })

        const sessionRes = await testServerPrivate.executeOperation({
          query: CreateSession,
          variables: {
            email: input.email,
            password: 'p@$$w0rd'
          }
        })

        expect(sessionRes).toMatchSnapshot({
          data: {
            createSession: {
              token: expect.any(String),
              user: expect.objectContaining({
                email: expect.any(String)
              })
            }
          }
        })

        const resetPwdRes = await testServerPrivate.executeOperation({
          query: ResetUserPassword,
          variables: {
            id: createdUser.data?.createUser.id,
            password: 'NewUpdatedPassword321'
          }
        })

        expect(resetPwdRes).toMatchSnapshot({
          data: {
            resetUserPassword: {
              id: expect.any(String),
              email: expect.any(String),
              emailVerifiedAt: expect.any(Date)
            }
          }
        })

        const updatedPwdSession = await testServerPrivate.executeOperation({
          query: CreateSession,
          variables: {
            email: input.email,
            password: 'NewUpdatedPassword321'
          }
        })

        expect(updatedPwdSession).toMatchSnapshot({
          data: {
            createSession: {
              token: expect.any(String),
              user: expect.objectContaining({
                email: expect.any(String)
              })
            }
          }
        })
      })

      test('can be deleted', async () => {
        const res = await testServerPrivate.executeOperation({
          query: DeleteUser,
          variables: {
            id: ids[0]
          }
        })

        expect(res).toMatchSnapshot({
          data: {
            deleteUser: {
              id: expect.any(String),
              email: expect.any(String)
            }
          }
        })

        ids.shift()
      })
    })
  })
})
